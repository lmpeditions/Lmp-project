"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { requirePermission, requireSession, assertDossierAccess, AuthError, isStaff } from "./rbac";
import { recalcProgress } from "./dossier-service";
import { notify } from "./notifications";
import { audit } from "./audit";
import { remarkSchema, stageMessageSchema, updateReviewSchema } from "./validators";

export interface ReviewActionState {
  error?: "validation" | "forbidden" | "server";
  ok?: boolean;
}

function attachmentJson(name?: string, url?: string): Prisma.InputJsonValue | undefined {
  if (!url) return undefined;
  return [{ name: name || url, url }] as Prisma.InputJsonValue;
}

const statusForProgress = (p: number) =>
  p >= 100 ? ("DONE" as const) : p > 0 ? ("IN_PROGRESS" as const) : ("UPCOMING" as const);

/** Admin adds an editorial remark (title + description + optional file/link). */
export async function addRemarkAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  let session;
  try {
    session = await requirePermission("dossier.write");
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const parsed = remarkSchema.safeParse({
    dossierId: formData.get("dossierId"),
    title: formData.get("title"),
    description: formData.get("description"),
    attachmentName: formData.get("attachmentName") || undefined,
    attachmentUrl: formData.get("attachmentUrl") || undefined,
  });
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  try {
    await prisma.editorialRemark.create({
      data: {
        dossierId: d.dossierId,
        stage: "REVIEW",
        title: d.title,
        description: d.description,
        attachments: attachmentJson(d.attachmentName, d.attachmentUrl || undefined),
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
        type: "STAGE",
        title: "Nouvelle remarque éditoriale",
        body: `Une remarque « ${d.title} » a été ajoutée à votre livre.`,
        email: false,
      });
    }
    await audit({ actorId: session.sub, dossierId: d.dossierId, action: "remark.added", entity: "EditorialRemark" });
    return { ok: true };
  } catch (e) {
    console.error("[addRemarkAction]", e);
    return { error: "server" };
  }
}

const ALLOWED_STAGES = ["REVIEW", "LAYOUT", "COMMUNICATION"];

/** Post a message to a stage conversation thread (author or editor). */
export async function postReviewMessageAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  let session;
  const dossierId = String(formData.get("dossierId") || "");
  const stageRaw = String(formData.get("stage") || "REVIEW");
  const stage = ALLOWED_STAGES.includes(stageRaw) ? stageRaw : "REVIEW";
  try {
    session = await assertDossierAccess(dossierId);
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const parsed = stageMessageSchema.safeParse({
    dossierId,
    body: formData.get("body"),
    attachmentName: formData.get("attachmentName") || undefined,
    attachmentUrl: formData.get("attachmentUrl") || undefined,
  });
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  try {
    await prisma.stageMessage.create({
      data: {
        dossierId: d.dossierId,
        stage,
        senderId: session.sub,
        body: d.body,
        attachments: attachmentJson(d.attachmentName, d.attachmentUrl || undefined),
      },
    });
    const dossier = await prisma.dossier.findUnique({
      where: { id: d.dossierId },
      select: { authorId: true, managerId: true },
    });
    if (dossier) {
      const fromStaff = isStaff(session.role);
      const recipient = fromStaff ? dossier.authorId : dossier.managerId;
      if (recipient) {
        await notify({
          userId: recipient,
          dossierId: d.dossierId,
          type: "STAGE",
          title: fromStaff ? "Nouveau message de l'équipe LMP" : "Nouveau message de l'auteur",
          body: "Vous avez un nouveau message sur votre projet.",
          email: false,
        });
      }
    }
    return { ok: true };
  } catch (e) {
    console.error("[postReviewMessageAction]", e);
    return { error: "server" };
  }
}

/** Admin updates the merged Relecture/Correction stage. */
export async function updateReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  let session;
  try {
    session = await requirePermission("dossier.write");
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const parsed = updateReviewSchema.safeParse({
    dossierId: formData.get("dossierId"),
    isbn: formData.get("isbn") || undefined,
    legalDeposit: formData.get("legalDeposit") || undefined,
    relectureProgress: formData.get("relectureProgress") || 0,
    correctionProgress: formData.get("correctionProgress") || 0,
  });
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  try {
    await prisma.dossier.update({
      where: { id: d.dossierId },
      data: { isbn: d.isbn || null, legalDeposit: d.legalDeposit || null },
    });
    await prisma.stage.update({
      where: { dossierId_type: { dossierId: d.dossierId, type: "RELECTURE" } },
      data: { progress: d.relectureProgress, status: statusForProgress(d.relectureProgress) },
    });
    await prisma.stage.update({
      where: { dossierId_type: { dossierId: d.dossierId, type: "CORRECTION" } },
      data: { progress: d.correctionProgress, status: statusForProgress(d.correctionProgress) },
    });
    await recalcProgress(d.dossierId);

    const dossier = await prisma.dossier.findUnique({
      where: { id: d.dossierId },
      select: { authorId: true },
    });
    if (dossier) {
      await notify({
        userId: dossier.authorId,
        dossierId: d.dossierId,
        type: "STAGE",
        title: "Mise à jour relecture / correction",
        body: "L'avancement de la relecture / correction de votre livre a été mis à jour.",
        email: false,
      });
    }
    await audit({ actorId: session.sub, dossierId: d.dossierId, action: "review.updated", entity: "Stage" });
    return { ok: true };
  } catch (e) {
    console.error("[updateReviewAction]", e);
    return { error: "server" };
  }
}
