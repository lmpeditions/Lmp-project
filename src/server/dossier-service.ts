import type { StageStatus, StageType } from "@prisma/client";
import { prisma } from "./prisma";
import { audit } from "./audit";
import { notify } from "./notifications";

/**
 * Domain logic for dossiers: tracking-number generation, global-progress
 * recalculation, and stage updates that fan out to notifications + audit.
 */

/** The 8 editorial stages, weighted equally for the global progress bar. */
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

/**
 * Generate the next unique tracking number for a year: #LMP{year}{seq:4}.
 * The DB unique constraint on `trackingNumber` guarantees integrity: two
 * concurrent creations racing on the same sequence make one insert fail
 * (P2002) rather than duplicate — acceptable at this volume.
 */
export async function nextTrackingNumber(date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const prefix = `#LMP${year}`;
  const last = await prisma.dossier.findFirst({
    where: { trackingNumber: { startsWith: prefix } },
    orderBy: { trackingNumber: "desc" },
    select: { trackingNumber: true },
  });
  const lastSeq = last ? Number(last.trackingNumber.slice(prefix.length)) : 0;
  const seq = String(lastSeq + 1).padStart(4, "0");
  return `${prefix}${seq}`;
}

/** Generate the next unique author number for a year: LMP-{year}-{seq:4}. */
export async function nextAuthorNumber(date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const prefix = `LMP-${year}-`;
  const last = await prisma.user.findFirst({
    where: { authorNumber: { startsWith: prefix } },
    orderBy: { authorNumber: "desc" },
    select: { authorNumber: true },
  });
  const seq = last?.authorNumber ? Number(last.authorNumber.slice(prefix.length)) : 0;
  return `${prefix}${String(seq + 1).padStart(4, "0")}`;
}

/** Recompute and persist a dossier's global progress (0–100) from its stages. */
export async function recalcProgress(dossierId: string): Promise<number> {
  const stages = await prisma.stage.findMany({ where: { dossierId } });
  if (stages.length === 0) return 0;
  const total = stages.reduce((sum, s) => {
    if (s.status === "DONE") return sum + 100;
    if (s.status === "IN_PROGRESS") return sum + s.progress;
    return sum;
  }, 0);
  const progress = Math.round(total / STAGE_ORDER.length);
  await prisma.dossier.update({ where: { id: dossierId }, data: { globalProgress: progress } });
  return progress;
}

/** Update a stage, recompute progress, notify the author, and audit. */
export async function updateStage(params: {
  actorId: string;
  dossierId: string;
  type: StageType;
  status: StageStatus;
  progress: number;
  notes?: string;
}): Promise<void> {
  const { actorId, dossierId, type, status, progress, notes } = params;

  await prisma.stage.update({
    where: { dossierId_type: { dossierId, type } },
    data: { status, progress, notes },
  });

  const globalProgress = await recalcProgress(dossierId);

  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    select: { authorId: true, bookTitle: true },
  });

  if (dossier) {
    // Mark the dossier completed when everything is done.
    if (globalProgress >= 100) {
      await prisma.dossier.update({ where: { id: dossierId }, data: { status: "COMPLETED" } });
    }
    await notify({
      userId: dossier.authorId,
      dossierId,
      type: "STAGE",
      title: "Mise à jour de votre projet",
      body: `L'étape « ${type} » est passée au statut « ${status} ».`,
      email: true,
    });
  }

  await audit({
    actorId,
    dossierId,
    action: "stage.updated",
    entity: "Stage",
    meta: { type, status, progress, globalProgress },
  });
}
