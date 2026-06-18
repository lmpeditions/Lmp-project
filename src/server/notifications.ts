import nodemailer from "nodemailer";
import type { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Notifications = in-app record (always) + best-effort email.
 *
 * Email transport is configured from SMTP_* env vars. When SMTP is not
 * configured (e.g. local dev) we log to the console instead of failing.
 * WhatsApp is a planned phase-2 channel (see spec).
 */

let transporter: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.info(`[email:dev] To: ${to} — ${subject}`);
    return;
  }
  await t.sendMail({ from: process.env.EMAIL_FROM ?? "LMP <no-reply@lmp.ma>", to, subject, html });
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
