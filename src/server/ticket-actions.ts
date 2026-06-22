"use server";

import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { requireSession, assertDossierAccess, AuthError, isStaff } from "./rbac";
import { notify } from "./notifications";
import { getActiveBook } from "./queries";
import { createTicketSchema, ticketReplySchema } from "./validators";

export interface TicketActionState {
  error?: "forbidden" | "validation" | "noBook" | "server";
  ok?: boolean;
}

function newRef(): string {
  return "TIC-" + Date.now().toString(36).slice(-5).toUpperCase();
}

/** Author opens a new support ticket on their active book. */
export async function createTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const session = await requireSession();
  const parsed = createTicketSchema.safeParse({
    subject: formData.get("subject"),
    category: formData.get("category"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "validation" };

  const active = await getActiveBook(session.sub);
  if (!active) return { error: "noBook" };
  const locale = String(formData.get("locale") || "fr");

  try {
    const ticket = await prisma.ticket.create({
      data: {
        ref: newRef(),
        dossierId: active.id,
        subject: parsed.data.subject,
        category: parsed.data.category,
        status: "OPEN",
        authorId: session.sub,
        messages: { create: { senderId: session.sub, body: parsed.data.body } },
      },
    });
    const dossier = await prisma.dossier.findUnique({ where: { id: active.id }, select: { managerId: true } });
    if (dossier?.managerId) {
      await notify({
        userId: dossier.managerId,
        dossierId: active.id,
        type: "TICKET",
        title: "Nouveau ticket",
        body: `Nouveau ticket : « ${parsed.data.subject} ».`,
        email: false,
      });
    }
    redirect(`/${locale}/author/tickets/${ticket.id}`);
  } catch (e) {
    // redirect() throws NEXT_REDIRECT — let it propagate
    if (e && typeof e === "object" && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
    console.error("[createTicketAction]", e);
    return { error: "server" };
  }
}

/** Reply to a ticket (author who owns it, or any staff member). */
export async function replyTicketAction(
  _prev: TicketActionState,
  formData: FormData,
): Promise<TicketActionState> {
  const parsed = ticketReplySchema.safeParse({
    ticketId: formData.get("ticketId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: "validation" };

  let session;
  try {
    session = await requireSession();
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: parsed.data.ticketId },
    select: { id: true, authorId: true, dossierId: true, subject: true },
  });
  if (!ticket) return { error: "validation" };
  if (!isStaff(session.role) && ticket.authorId !== session.sub) return { error: "forbidden" };

  try {
    await prisma.ticketMessage.create({
      data: { ticketId: ticket.id, senderId: session.sub, body: parsed.data.body },
    });
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: isStaff(session.role) ? "WAITING" : "IN_PROGRESS" },
    });
    const recipient = isStaff(session.role)
      ? ticket.authorId
      : (await prisma.dossier.findUnique({ where: { id: ticket.dossierId }, select: { managerId: true } }))?.managerId;
    if (recipient) {
      await notify({
        userId: recipient,
        dossierId: ticket.dossierId,
        type: "TICKET",
        title: "Réponse à un ticket",
        body: `Nouvelle réponse sur « ${ticket.subject} ».`,
        email: false,
      });
    }
    return { ok: true };
  } catch (e) {
    console.error("[replyTicketAction]", e);
    return { error: "server" };
  }
}
