"use server";

import { redirect } from "next/navigation";
import type { TicketStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { requireSession, requirePermission, assertDossierAccess, AuthError, isStaff } from "./rbac";
import { notify } from "./notifications";
import { audit } from "./audit";
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

const TICKET_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"];

/**
 * Staff-only: update a ticket's status and/or assignee (plain form action).
 * Empty assignee value clears the assignment.
 */
export async function updateTicketAction(formData: FormData): Promise<void> {
  let session;
  try {
    session = await requirePermission("ticket.manage");
  } catch (e) {
    if (e instanceof AuthError) return;
    throw e;
  }
  const ticketId = String(formData.get("ticketId") || "");
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, authorId: true, dossierId: true, subject: true, status: true, assigneeId: true },
  });
  if (!ticket) return;

  const rawStatus = String(formData.get("status") || "");
  const status = TICKET_STATUSES.includes(rawStatus as TicketStatus) ? (rawStatus as TicketStatus) : ticket.status;

  // assignee: "" clears, a valid staff id assigns, absent leaves unchanged.
  const hasAssignee = formData.has("assigneeId");
  let assigneeId = ticket.assigneeId;
  if (hasAssignee) {
    const raw = String(formData.get("assigneeId") || "");
    if (!raw) {
      assigneeId = null;
    } else {
      const staff = await prisma.user.findFirst({
        where: { id: raw, role: { in: ["SUPER_ADMIN", "ADMIN", "MANAGER"] } },
        select: { id: true },
      });
      assigneeId = staff ? staff.id : ticket.assigneeId;
    }
  }

  await prisma.ticket.update({ where: { id: ticket.id }, data: { status, assigneeId } });

  // Notify the author when the ticket is resolved or closed.
  if (status !== ticket.status && (status === "RESOLVED" || status === "CLOSED")) {
    await notify({
      userId: ticket.authorId,
      dossierId: ticket.dossierId,
      type: "TICKET",
      title: status === "RESOLVED" ? "Ticket résolu" : "Ticket clôturé",
      body: `Votre ticket « ${ticket.subject} » a été ${status === "RESOLVED" ? "marqué comme résolu" : "clôturé"}.`,
      email: false,
    });
  }
  await audit({ actorId: session.sub, dossierId: ticket.dossierId, action: "ticket.updated", entity: "Ticket", meta: { status, assigneeId } });
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
