import { sendEmail } from "./notifications";

/**
 * Transactional emails for the author lifecycle. In dev (no SMTP_HOST) these
 * are logged to the console by `sendEmail`; the raw link is also returned so
 * the caller can surface it for testing.
 */

function appUrl(): string {
  return process.env.AUTH_URL ?? "http://localhost:3000";
}

const shell = (body: string) =>
  `${body}<p style="color:#888;font-size:12px;margin-top:24px">— LMP · Les Manuscrits Publiés · Portail de Suivi Éditorial</p>`;

/**
 * Send the activation link so a new user can set their password. When an
 * `authorNumber` is provided it is included — authors need it to sign in
 * (e-mail + author number + password).
 */
export async function sendActivationEmail(
  to: string,
  name: string,
  token: string,
  locale = "fr",
  authorNumber?: string,
): Promise<string> {
  const link = `${appUrl()}/${locale}/activate/${token}`;
  const numberLine = authorNumber
    ? `<p>Votre <b>numéro d'auteur</b> (nécessaire à la connexion) : <b>${authorNumber}</b>.</p>`
    : "";
  await sendEmail(
    to,
    "Activez votre espace LMP",
    shell(
      `<p>Bonjour ${name},</p>
       <p>Votre espace sur le portail LMP a été créé.</p>
       ${numberLine}
       <p>Cliquez sur le lien ci-dessous pour définir votre mot de passe :</p>
       <p><a href="${link}">${link}</a></p>
       <p style="color:#888;font-size:12px">Ce lien est valable 7 jours.</p>`,
    ),
  );
  if (process.env.NODE_ENV !== "production") console.info(`[activation-link] ${to} -> ${link}`);
  return link;
}

/** Send the 6-digit login code (second factor). */
export async function sendOtpEmail(to: string, name: string, code: string): Promise<void> {
  await sendEmail(
    to,
    "Votre code de connexion LMP",
    shell(
      `<p>Bonjour ${name},</p>
       <p>Voici votre code de connexion à usage unique :</p>
       <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
       <p style="color:#888;font-size:12px">Ce code expire dans 10 minutes. Si vous n'êtes pas à l'origine de cette connexion, ignorez cet e-mail et changez votre mot de passe.</p>`,
    ),
  );
  if (process.env.NODE_ENV !== "production") console.info(`[otp] ${to} -> ${code}`);
}

/** Send a password-reset link. */
export async function sendResetEmail(
  to: string,
  name: string,
  token: string,
  locale = "fr",
): Promise<string> {
  const link = `${appUrl()}/${locale}/reset-password/${token}`;
  await sendEmail(
    to,
    "Réinitialisation de votre mot de passe LMP",
    shell(
      `<p>Bonjour ${name},</p>
       <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
       <p><a href="${link}">${link}</a></p>
       <p style="color:#888;font-size:12px">Ce lien est valable 2 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`,
    ),
  );
  if (process.env.NODE_ENV !== "production") console.info(`[reset-link] ${to} -> ${link}`);
  return link;
}
