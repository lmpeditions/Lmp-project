"use server";

import { redirect } from "next/navigation";
import type { StageType } from "@prisma/client";
import { prisma } from "./prisma";
import { requirePermission, AuthError } from "./rbac";
import {
  hashPassword,
  setSessionCookie,
  createToken as createSessionToken,
} from "./auth";
import {
  createToken as createInviteToken,
  verifyTokenRecord,
  markTokenUsed,
} from "./tokens";
import { sendActivationEmail, sendResetEmail } from "./emails";
import { nextTrackingNumber } from "./dossier-service";
import { audit } from "./audit";
import {
  createAuthorSchema,
  requestResetSchema,
  setPasswordSchema,
} from "./validators";

const STAGE_ORDER: StageType[] = [
  "CONTRAT",
  "ISBN",
  "RELECTURE",
  "CORRECTION",
  "COUVERTURE",
  "MISE_EN_PAGE",
  "COMMUNICATION",
  "PUBLICATION",
];

// ---------------------------------------------------------------- Admin: create author

export interface CreateAuthorState {
  error?: "validation" | "emailTaken" | "forbidden" | "server";
  ok?: boolean;
  activationLink?: string;
  authorName?: string;
}

export async function createAuthorAction(
  _prev: CreateAuthorState,
  formData: FormData,
): Promise<CreateAuthorState> {
  let session;
  try {
    session = await requirePermission("user.manage");
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }

  const parsed = createAuthorSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    nationality: formData.get("nationality") || undefined,
    phone: formData.get("phone") || undefined,
    cin: formData.get("cin") || undefined,
    address: formData.get("address") || undefined,
    profession: formData.get("profession") || undefined,
    bookTitle: formData.get("bookTitle"),
    formula: formData.get("formula"),
    contractTotal: formData.get("contractTotal") || 0,
  });
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;
  const locale = String(formData.get("locale") || "fr");

  const email = d.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "emailTaken" };

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name: d.name,
        nationality: d.nationality,
        phone: d.phone,
        cin: d.cin,
        address: d.address,
        profession: d.profession,
        role: "AUTHOR",
        status: "INVITED",
      },
    });

    const trackingNumber = await nextTrackingNumber();
    const dossier = await prisma.dossier.create({
      data: {
        trackingNumber,
        bookTitle: d.bookTitle,
        formula: d.formula,
        contractTotal: d.contractTotal,
        startDate: new Date(),
        authorId: user.id,
        managerId: session.sub,
      },
    });

    await prisma.stage.createMany({
      data: STAGE_ORDER.map((type, i) => ({
        dossierId: dossier.id,
        type,
        order: i,
        status: i === 0 ? ("IN_PROGRESS" as const) : ("UPCOMING" as const),
        progress: 0,
      })),
    });

    const token = await createInviteToken(user.id, "ACTIVATION");
    const base = process.env.AUTH_URL ?? "http://localhost:3000";
    const activationLink = `${base}/${locale}/activate/${token}`;
    try {
      await sendActivationEmail(user.email, user.name, token, locale);
    } catch (mailErr) {
      // Email failure must not block author creation; the admin can still
      // share the activation link shown in the UI.
      console.error("[createAuthorAction] e-mail d'activation non envoyé:", mailErr);
    }

    await audit({
      actorId: session.sub,
      dossierId: dossier.id,
      action: "author.created",
      entity: "User",
      meta: { email: user.email, trackingNumber },
    });

    return { ok: true, activationLink, authorName: user.name };
  } catch (e) {
    console.error("[createAuthorAction]", e);
    return { error: "server" };
  }
}

// ---------------------------------------------------------------- Public: request password reset

export interface ResetRequestState {
  ok?: boolean;
  resetLink?: string; // dev convenience only
}

export async function requestResetAction(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  // Always report success to avoid leaking which emails exist.
  if (!parsed.success) return { ok: true };
  const locale = String(formData.get("locale") || "fr");

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  let resetLink: string | undefined;
  if (user) {
    const token = await createInviteToken(user.id, "PASSWORD_RESET");
    resetLink = await sendResetEmail(user.email, user.name, token, locale);
  }
  return { ok: true, resetLink };
}

// ---------------------------------------------------------------- Public: set password (activate / reset)

export interface SetPasswordState {
  error?: "mismatch" | "weak" | "invalidToken" | "server";
}

async function applyPassword(
  formData: FormData,
  purpose: "ACTIVATION" | "PASSWORD_RESET",
): Promise<{ state: SetPasswordState; redirectTo?: string }> {
  const parsed = setPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((i) => i.message === "PASSWORDS_DO_NOT_MATCH");
    return { state: { error: mismatch ? "mismatch" : "weak" } };
  }
  const locale = String(formData.get("locale") || "fr");

  const rec = await verifyTokenRecord(parsed.data.token, purpose);
  if (!rec) return { state: { error: "invalidToken" } };

  try {
    const hash = await hashPassword(parsed.data.password);
    const user = await prisma.user.update({
      where: { id: rec.userId },
      data: { passwordHash: hash, status: "ACTIVE" },
    });
    await markTokenUsed(rec.id);

    if (purpose === "ACTIVATION") {
      // Auto sign-in the freshly activated author.
      const sessionToken = createSessionToken({
        sub: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
      });
      await setSessionCookie(sessionToken);
      return { state: {}, redirectTo: `/${locale}/author` };
    }
    return { state: {}, redirectTo: `/${locale}?reset=ok` };
  } catch (e) {
    console.error("[applyPassword]", e);
    return { state: { error: "server" } };
  }
}

export async function activateAction(
  _prev: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const { state, redirectTo } = await applyPassword(formData, "ACTIVATION");
  if (redirectTo) redirect(redirectTo);
  return state;
}

export async function resetPasswordAction(
  _prev: SetPasswordState,
  formData: FormData,
): Promise<SetPasswordState> {
  const { state, redirectTo } = await applyPassword(formData, "PASSWORD_RESET");
  if (redirectTo) redirect(redirectTo);
  return state;
}
