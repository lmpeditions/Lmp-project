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

/** Send the activation link so a new author can set their password. */
export async function sendActivationEmail(
  to: string,
  name: string,
  token: string,
  locale = "fr",
): Promise<string> {
  const link = `${appUrl()}/${locale}/activate/${token}`;
  await sendEmail(
    to,
    "Activez votre espace auteur LMP",
    shell(
      `<p>Bonjour ${name},</p>
       <p>Votre espace auteur sur le portail LMP a été créé. Cliquez sur le lien ci-dessous pour définir votre mot de passe et accéder au suivi de votre livre :</p>
       <p><a href="${link}">${link}</a></p>
       <p style="color:#888;font-size:12px">Ce lien est valable 7 jours.</p>`,
    ),
  );
  console.info(`[activation-link] ${to} -> ${link}`);
  return link;
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
  console.info(`[reset-link] ${to} -> ${link}`);
  return link;
}
