"use server";

import { prisma } from "./prisma";
import { assertDossierAccess, AuthError } from "./rbac";
import { notify } from "./notifications";
import { audit } from "./audit";
import { terminationSchema } from "./validators";

export interface TerminationActionState {
  error?: "forbidden" | "exists" | "validation" | "server";
  ok?: boolean;
}

/** Author requests termination of a book contract. */
export async function requestTerminationAction(
  _prev: TerminationActionState,
  formData: FormData,
): Promise<TerminationActionState> {
  const parsed = terminationSchema.safeParse({
    dossierId: formData.get("dossierId"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: "validation" };

  let session;
  try {
    session = await assertDossierAccess(parsed.data.dossierId);
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }

  try {
    const existing = await prisma.terminationRequest.findUnique({
      where: { dossierId: parsed.data.dossierId },
    });
    if (existing) return { error: "exists" };

    await prisma.terminationRequest.create({
      data: { dossierId: parsed.data.dossierId, status: "SUBMITTED", reason: parsed.data.reason },
    });
    const d = await prisma.dossier.findUnique({
      where: { id: parsed.data.dossierId },
      select: { managerId: true, bookTitle: true },
    });
    if (d?.managerId) {
      await notify({
        userId: d.managerId,
        dossierId: parsed.data.dossierId,
        type: "TERMINATION",
        title: "Demande de résiliation",
        body: `Une demande de résiliation a été soumise pour « ${d.bookTitle} ».`,
        email: false,
      });
    }
    await audit({ actorId: session.sub, dossierId: parsed.data.dossierId, action: "termination.requested", entity: "TerminationRequest" });
    return { ok: true };
  } catch (e) {
    console.error("[requestTerminationAction]", e);
    return { error: "server" };
  }
}
