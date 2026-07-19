"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  authenticate,
  finalizeLogin,
  setSessionCookie,
  clearSessionCookie,
  verifyToken,
} from "./auth";
import {
  issueOtp,
  verifyOtp,
  setPendingLogin,
  getPendingLogin,
  clearPendingLogin,
} from "./otp";
import { sendOtpEmail } from "./emails";
import { prisma } from "./prisma";
import { isStaff } from "./rbac";
import { rateLimit, clientIp } from "./rate-limit";
import { audit } from "./audit";
import { loginSchema, verifyOtpSchema } from "./validators";

/**
 * Authentication Server Actions (CSRF-safe by default in Next.js).
 *
 * Login is two-factor: stage 1 verifies e-mail + password (+ author number for
 * authors) and e-mails a one-time code; no session is issued yet. Stage 2
 * (`verifyOtpAction`) validates the code and only then sets the session cookie.
 */

export interface LoginState {
  error?: "invalidCredentials" | "accountSuspended" | "loginError" | "tooManyAttempts";
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // Throttle by client IP to slow brute-force attempts.
  const ip = clientIp(await headers());
  if (!(await rateLimit(`login:${ip}`, { limit: 8, windowMs: 60_000 })).ok) {
    return { error: "tooManyAttempts" };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    authorNumber: formData.get("authorNumber") || undefined,
  });
  if (!parsed.success) return { error: "invalidCredentials" };

  let user;
  try {
    user = await authenticate(parsed.data.email, parsed.data.password);
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "ACCOUNT_SUSPENDED") return { error: "accountSuspended" };
    if (code === "INVALID_CREDENTIALS") return { error: "invalidCredentials" };
    console.error("[loginAction] erreur inattendue:", e);
    return { error: "loginError" };
  }

  // Authors must also match their author number (third credential). Generic
  // error on mismatch so we never reveal which field was wrong.
  if (user.role === "AUTHOR") {
    const supplied = (parsed.data.authorNumber ?? "").trim().toUpperCase();
    if (!supplied || supplied !== user.authorNumber?.toUpperCase()) {
      return { error: "invalidCredentials" };
    }
  }

  // First factor passed → start the second factor. No session yet.
  try {
    const code = await issueOtp(user.id);
    await setPendingLogin(user.id);
    await sendOtpEmail(user.email, user.name, code);
  } catch (e) {
    console.error("[loginAction] envoi du code échoué:", e);
    return { error: "loginError" };
  }

  const locale = String(formData.get("locale") || "fr");
  redirect(`/${locale}/verify-otp`);
}

export interface VerifyOtpState {
  error?: "invalidCode" | "expired" | "tooManyAttempts" | "expiredSession";
}

export async function verifyOtpAction(
  _prev: VerifyOtpState,
  formData: FormData,
): Promise<VerifyOtpState> {
  const userId = await getPendingLogin();
  const locale = String(formData.get("locale") || "fr");
  if (!userId) return { error: "expiredSession" };

  const ip = clientIp(await headers());
  if (!(await rateLimit(`otp:${ip}`, { limit: 10, windowMs: 60_000 })).ok) {
    return { error: "tooManyAttempts" };
  }

  const parsed = verifyOtpSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: "invalidCode" };

  const result = await verifyOtp(userId, parsed.data.code);
  if (result === "expired") return { error: "expired" };
  if (result === "tooManyAttempts") return { error: "tooManyAttempts" };
  if (result !== "ok") return { error: "invalidCode" };

  // Second factor passed → issue the real session and clear the pending state.
  const token = await finalizeLogin(userId);
  await setSessionCookie(token);
  await clearPendingLogin();
  await audit({ actorId: userId, action: "auth.login", entity: "User" });

  const role = verifyToken(token)?.role;
  const home = isStaff(role as never) ? "admin" : "author";
  redirect(`/${locale}/${home}`);
}

export interface ResendOtpState {
  ok?: boolean;
  error?: "expiredSession" | "tooManyAttempts" | "server";
}

export async function resendOtpAction(
  _prev: ResendOtpState,
  formData: FormData,
): Promise<ResendOtpState> {
  const userId = await getPendingLogin();
  if (!userId) return { error: "expiredSession" };

  const ip = clientIp(await headers());
  if (!(await rateLimit(`otp-resend:${ip}`, { limit: 3, windowMs: 5 * 60_000 })).ok) {
    return { error: "tooManyAttempts" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "expiredSession" };
    const code = await issueOtp(user.id);
    await sendOtpEmail(user.email, user.name, code);
    return { ok: true };
  } catch (e) {
    console.error("[resendOtpAction]", e);
    return { error: "server" };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  await clearPendingLogin();
  // Redirect to the root; the i18n middleware localizes it (e.g. → /fr).
  redirect("/");
}
