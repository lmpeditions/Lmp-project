import { Resend } from "resend";
import type { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Notifications = in-app record (always) + best-effort email.
 *
 * Email is sent via Resend (https://resend.com) when RESEND_API_KEY is set.
 * In local dev (no key) we log to the console instead of failing, so flows
 * stay testable. WhatsApp is a planned phase-2 channel (see spec).
 */

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const client = getResend();
  if (!client) {
    console.info(`[email:dev] To: ${to} — ${subject} (RESEND_API_KEY non défini, e-mail non envoyé)`);
    return;
  }
  const { error } = await client.emails.send({
    from: process.env.EMAIL_FROM ?? "LMP <onboarding@resend.dev>",
    to,
    subject,
    html,
  });
  if (error) {
    console.error(`[email] échec d'envoi à ${to}:`, error);
    throw new Error(`EMAIL_SEND_FAILED: ${error.message}`);
  }
}

/** Create an in-app notification and (optionally) email the user. */
export async function notify(params: {
  userId: string;
  dossierId?: string;
  type: NotificationType;
  title: string;
  body: string;
  email?: boolean;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      dossierId: params.dossierId,
      type: params.type,
      title: params.title,
      body: params.body,
    },
  });

  if (params.email) {
    const user = await prisma.user.findUnique({ where: { id: params.userId } });
    if (user?.email) {
      await sendEmail(
        user.email,
        params.title,
        `<p>${params.body}</p><p style="color:#888">— LMP, Portail de Suivi Éditorial</p>`
      );
    }
  }
}
