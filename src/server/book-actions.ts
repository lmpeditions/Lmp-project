"use server";

import { redirect } from "next/navigation";
import type { StageType } from "@prisma/client";
import { prisma } from "./prisma";
import { requireSession, requirePermission, AuthError } from "./rbac";
import { nextTrackingNumber } from "./dossier-service";
import { setActiveBook } from "./active-book";
import { notify } from "./notifications";
import { audit } from "./audit";
import { createBookSchema } from "./validators";

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

export interface BookFormState {
  error?: "validation" | "server";
}

/** Author starts a new book — created PENDING_VALIDATION, awaiting an admin. */
export async function createBookAction(
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const session = await requireSession();
  const parsed = createBookSchema.safeParse({
    bookTitle: formData.get("bookTitle"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: "validation" };
  const locale = String(formData.get("locale") || "fr");

  let dossierId: string;
  try {
    const trackingNumber = await nextTrackingNumber();
    const dossier = await prisma.dossier.create({
      data: {
        trackingNumber,
        bookTitle: parsed.data.bookTitle,
        description: parsed.data.description,
        formula: "À définir",
        status: "PENDING_VALIDATION",
        startDate: new Date(),
        authorId: session.sub,
      },
    });
    await prisma.stage.createMany({
      data: STAGE_ORDER.map((type, i) => ({ dossierId: dossier.id, type, order: i, status: "UPCOMING" as const })),
    });
    await audit({
      actorId: session.sub,
      dossierId: dossier.id,
      action: "book.created",
      entity: "Dossier",
      meta: { trackingNumber, bookTitle: parsed.data.bookTitle },
    });
    dossierId = dossier.id;
  } catch (e) {
    console.error("[createBookAction]", e);
    return { error: "server" };
  }

  await setActiveBook(dossierId);
  redirect(`/${locale}/author`);
}

/** Switch the active book (quick-switch). */
export async function switchBookAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const dossierId = String(formData.get("dossierId") || "");
  const locale = String(formData.get("locale") || "fr");
  const owned = await prisma.dossier.findFirst({
    where: { id: dossierId, authorId: session.sub },
    select: { id: true },
  });
  if (owned) await setActiveBook(dossierId);
  redirect(`/${locale}/author`);
}

/** Admin validates a pending book → it becomes active and the author is notified. */
export async function validateBookAction(formData: FormData): Promise<void> {
  let session;
  try {
    session = await requirePermission("dossier.write");
  } catch (e) {
    if (e instanceof AuthError) redirect(`/${String(formData.get("locale") || "fr")}`);
    throw e;
  }
  const dossierId = String(formData.get("dossierId") || "");
  const locale = String(formData.get("locale") || "fr");

  const dossier = await prisma.dossier.update({
    where: { id: dossierId },
    data: { status: "IN_PROGRESS", managerId: session.sub },
  });
  await notify({
    userId: dossier.authorId,
    dossierId,
    type: "STAGE",
    title: "Votre livre est validé",
    body: `Votre livre « ${dossier.bookTitle} » a été validé. Vous pouvez maintenant suivre son édition.`,
    email: true,
  });
  await audit({ actorId: session.sub, dossierId, action: "book.validated", entity: "Dossier" });

  redirect(`/${locale}/admin/dossiers`);
}
