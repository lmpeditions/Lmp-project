"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { requirePermission, assertDossierAccess, AuthError, isStaff } from "./rbac";
import { notify } from "./notifications";
import { audit } from "./audit";
import {
  createValidationSchema,
  respondValidationSchema,
  editorDecideSchema,
} from "./validators";

export interface ValidationActionState {
  error?: "validation" | "forbidden" | "server" | "expired" | "closed" | "optionRequired";
  ok?: boolean;
}

const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7;

/** Extract the valid option ids from a request's stored options JSON. */
function optionIds(options: Prisma.JsonValue): string[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((o) => (o && typeof o === "object" && typeof (o as { id?: unknown }).id === "string" ? (o as { id: string }).id : null))
    .filter((id): id is string => id !== null);
}

/** Admin sends a validation request with its 4 models and a 7-day deadline. */
export async function createValidationRequestAction(
  _prev: ValidationActionState,
  formData: FormData,
): Promise<ValidationActionState> {
  let session;
  try {
    session = await requirePermission("dossier.write");
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const parsed = createValidationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const options = [
    { id: "o1", label: d.option1Label, url: d.option1Url || "" },
    { id: "o2", label: d.option2Label, url: d.option2Url || "" },
    { id: "o3", label: d.option3Label, url: d.option3Url || "" },
    { id: "o4", label: d.option4Label, url: d.option4Url || "" },
  ];

  try {
    await prisma.validationRequest.create({
      data: {
        dossierId: d.dossierId,
        kind: d.kind,
        title: d.title,
        options: options as unknown as Prisma.InputJsonValue,
        deadline: new Date(Date.now() + SEVEN_DAYS),
        createdById: session.sub,
      },
    });
    const dossier = await prisma.dossier.findUnique({
      where: { id: d.dossierId },
      select: { authorId: true },
    });
    if (dossier) {
      await notify({
        userId: dossier.authorId,
        dossierId: d.dossierId,
        type: "VALIDATION",
        title: "Validation requise",
        body: `Une demande de validation « ${d.title} » attend votre réponse. Vous avez 7 jours.`,
        email: true,
      });
    }
    await audit({ actorId: session.sub, dossierId: d.dossierId, action: "validation.created", entity: "ValidationRequest" });
    return { ok: true };
  } catch (e) {
    console.error("[createValidationRequestAction]", e);
    return { error: "server" };
  }
}

/** Author validates a model or requests changes (within 7 days). */
export async function respondValidationAction(
  _prev: ValidationActionState,
  formData: FormData,
): Promise<ValidationActionState> {
  const parsed = respondValidationSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    selectedOptionId: formData.get("selectedOptionId") || undefined,
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    const needsOption = parsed.error.issues.some((i) => i.message === "OPTION_REQUIRED");
    return { error: needsOption ? "optionRequired" : "validation" };
  }
  const d = parsed.data;

  const req = await prisma.validationRequest.findUnique({ where: { id: d.requestId } });
  if (!req) return { error: "validation" };

  let session;
  try {
    session = await assertDossierAccess(req.dossierId);
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }

  if (req.status !== "PENDING") return { error: "closed" };
  if (req.deadline.getTime() < Date.now()) return { error: "expired" };

  // When validating, the chosen option must be one of the request's own
  // options (defends against a crafted form submitting an arbitrary id).
  if (d.decision === "validate" && !optionIds(req.options).includes(d.selectedOptionId ?? "")) {
    return { error: "optionRequired" };
  }

  try {
    if (d.decision === "validate") {
      await prisma.validationRequest.update({
        where: { id: req.id },
        data: {
          status: "VALIDATED",
          selectedOptionId: d.selectedOptionId,
          decidedById: session.sub,
          decidedAt: new Date(),
          locked: req.kind === "CORRECTION",
        },
      });
    } else {
      await prisma.validationRequest.update({
        where: { id: req.id },
        data: { status: "CHANGES_REQUESTED", authorComment: d.comment, decidedById: session.sub, decidedAt: new Date() },
      });
    }
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.dossierId },
      select: { managerId: true },
    });
    if (dossier?.managerId) {
      await notify({
        userId: dossier.managerId,
        dossierId: req.dossierId,
        type: "VALIDATION",
        title: d.decision === "validate" ? "Validation effectuée" : "Modification demandée",
        body: `L'auteur a ${d.decision === "validate" ? "validé" : "demandé une modification sur"} « ${req.title} ».`,
        email: false,
      });
    }
    return { ok: true };
  } catch (e) {
    console.error("[respondValidationAction]", e);
    return { error: "server" };
  }
}

/** Editor decides on a request whose 7-day delay has lapsed (plain form action). */
export async function editorDecideAction(formData: FormData): Promise<void> {
  let session;
  try {
    session = await requirePermission("dossier.write");
  } catch (e) {
    if (e instanceof AuthError) return;
    throw e;
  }
  const parsed = editorDecideSchema.safeParse({
    requestId: formData.get("requestId"),
    selectedOptionId: formData.get("selectedOptionId"),
  });
  if (!parsed.success) return;

  const req = await prisma.validationRequest.findUnique({ where: { id: parsed.data.requestId } });
  if (!req) return;
  if (req.status !== "PENDING" || req.deadline.getTime() >= Date.now()) return;
  if (!optionIds(req.options).includes(parsed.data.selectedOptionId)) return;

  try {
    await prisma.validationRequest.update({
      where: { id: req.id },
      data: {
        status: "EXPIRED_TO_EDITOR",
        selectedOptionId: parsed.data.selectedOptionId,
        decidedById: session.sub,
        decidedAt: new Date(),
        locked: req.kind === "CORRECTION",
      },
    });
    const dossier = await prisma.dossier.findUnique({
      where: { id: req.dossierId },
      select: { authorId: true },
    });
    if (dossier) {
      await notify({
        userId: dossier.authorId,
        dossierId: req.dossierId,
        type: "VALIDATION",
        title: "Décision de l'éditeur",
        body: `Le délai étant dépassé, l'éditeur a tranché sur « ${req.title} ».`,
        email: true,
      });
    }
    await audit({ actorId: session.sub, dossierId: req.dossierId, action: "validation.editorDecided", entity: "ValidationRequest" });
  } catch (e) {
    console.error("[editorDecideAction]", e);
  }
}
