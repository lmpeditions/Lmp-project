"use server";

import { headers } from "next/headers";
import { prisma } from "./prisma";
import { requirePermission, AuthError } from "./rbac";
import { rateLimit, clientIp } from "./rate-limit";
import { sendEmail } from "./notifications";
import { sendActivationEmail } from "./emails";
import { createToken } from "./tokens";
import { nextAuthorNumber } from "./dossier-service";
import { audit } from "./audit";
import { applicationSchema } from "./validators";

export interface ApplicationActionState {
  error?: "validation" | "captcha" | "tooManyAttempts" | "server";
  ok?: boolean;
}

/** Verify a Cloudflare Turnstile token. Skipped (allowed) if no secret is set. */
async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured yet → don't block
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch (e) {
    console.error("[turnstile]", e);
    return false;
  }
}

/** Public: submit an author application (no account is created here). */
export async function submitApplicationAction(
  _prev: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const ip = clientIp(await headers());
  if (!(await rateLimit(`apply:${ip}`, { limit: 3, windowMs: 60 * 60_000 })).ok) {
    return { error: "tooManyAttempts" };
  }

  const ok = await verifyTurnstile(
    (formData.get("cf-turnstile-response") as string) || null,
    ip,
  );
  if (!ok) return { error: "captcha" };

  const parsed = applicationSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    nationality: formData.get("nationality") || undefined,
    phone: formData.get("phone") || undefined,
    cin: formData.get("cin") || undefined,
    address: formData.get("address") || undefined,
    profession: formData.get("profession") || undefined,
  });
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  try {
    await prisma.authorApplication.create({
      data: {
        fullName: d.fullName,
        email: d.email.toLowerCase(),
        nationality: d.nationality,
        phone: d.phone,
        cin: d.cin,
        address: d.address,
        profession: d.profession,
      },
    });

    // Notify all admins (best-effort email).
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { email: true },
    });
    for (const a of admins) {
      try {
        await sendEmail(
          a.email,
          "Nouvelle candidature auteur",
          `<p>Une nouvelle candidature a été soumise :</p>
           <ul><li><b>${d.fullName}</b></li><li>${d.email}</li>${d.profession ? `<li>${d.profession}</li>` : ""}</ul>
           <p>Connectez-vous au back-office pour l'examiner.</p>`,
        );
      } catch (e) {
        console.error("[submitApplication] notice admin échouée:", e);
      }
    }
    return { ok: true };
  } catch (e) {
    console.error("[submitApplicationAction]", e);
    return { error: "server" };
  }
}

export interface ReviewApplicationState {
  error?: "forbidden" | "notFound" | "emailTaken" | "server";
  ok?: boolean;
  activationLink?: string;
  authorName?: string;
  authorNumber?: string;
}

/** Admin approves an application → creates the author account + sends invite. */
export async function approveApplicationAction(
  _prev: ReviewApplicationState,
  formData: FormData,
): Promise<ReviewApplicationState> {
  let session;
  try {
    session = await requirePermission("user.manage");
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const applicationId = String(formData.get("applicationId") || "");
  const locale = String(formData.get("locale") || "fr");

  const app = await prisma.authorApplication.findUnique({ where: { id: applicationId } });
  if (!app || app.status !== "PENDING") return { error: "notFound" };

  const email = app.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) return { error: "emailTaken" };

  try {
    const authorNumber = await nextAuthorNumber();
    const user = await prisma.user.create({
      data: {
        email,
        name: app.fullName,
        authorNumber,
        nationality: app.nationality,
        phone: app.phone,
        cin: app.cin,
        address: app.address,
        profession: app.profession,
        role: "AUTHOR",
        status: "INVITED",
      },
    });
    await prisma.authorApplication.update({
      where: { id: app.id },
      data: { status: "APPROVED", reviewedById: session.sub, reviewedAt: new Date() },
    });

    const inviteToken = await createToken(user.id, "ACTIVATION");
    let activationLink = `${process.env.AUTH_URL ?? "http://localhost:3000"}/${locale}/activate/${inviteToken}`;
    try {
      activationLink = await sendActivationEmail(
        user.email,
        user.name,
        inviteToken,
        locale,
        authorNumber,
      );
    } catch (e) {
      console.error("[approveApplication] e-mail auteur échoué:", e);
    }
    await audit({ actorId: session.sub, action: "application.approved", entity: "AuthorApplication", meta: { email, authorNumber } });
    return { ok: true, activationLink, authorName: user.name, authorNumber };
  } catch (e) {
    console.error("[approveApplicationAction]", e);
    return { error: "server" };
  }
}

/** Admin rejects an application. */
export async function rejectApplicationAction(formData: FormData): Promise<void> {
  let session;
  try {
    session = await requirePermission("user.manage");
  } catch (e) {
    if (e instanceof AuthError) return;
    throw e;
  }
  const applicationId = String(formData.get("applicationId") || "");
  const app = await prisma.authorApplication.findUnique({ where: { id: applicationId } });
  if (!app || app.status !== "PENDING") return;
  await prisma.authorApplication.update({
    where: { id: app.id },
    data: { status: "REJECTED", reviewedById: session.sub, reviewedAt: new Date() },
  });
  await audit({ actorId: session.sub, action: "application.rejected", entity: "AuthorApplication" });
}
