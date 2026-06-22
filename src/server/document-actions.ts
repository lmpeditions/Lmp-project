"use server";

import { prisma } from "./prisma";
import { assertDossierAccess, AuthError } from "./rbac";
import { audit } from "./audit";
import { authorDocumentSchema } from "./validators";

export interface DocActionState {
  error?: "forbidden" | "validation" | "server";
  ok?: boolean;
}

/** Author uploads (links) their introduction or table of contents. */
export async function uploadAuthorDocumentAction(
  _prev: DocActionState,
  formData: FormData,
): Promise<DocActionState> {
  const parsed = authorDocumentSchema.safeParse({
    dossierId: formData.get("dossierId"),
    kind: formData.get("kind"),
    url: formData.get("url"),
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
    const name = parsed.data.kind === "introduction" ? "Introduction" : "Table des matières";
    await prisma.document.create({
      data: {
        dossierId: parsed.data.dossierId,
        name,
        category: "CONTENT",
        mimeType: "LINK",
        sizeLabel: "—",
        url: parsed.data.url,
        uploadedById: session.sub,
      },
    });
    await audit({ actorId: session.sub, dossierId: parsed.data.dossierId, action: "document.uploaded", entity: "Document" });
    return { ok: true };
  } catch (e) {
    console.error("[uploadAuthorDocumentAction]", e);
    return { error: "server" };
  }
}
