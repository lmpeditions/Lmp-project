"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  login,
  setSessionCookie,
  clearSessionCookie,
  verifyToken,
  createToken,
  hashPassword,
} from "./auth";
import { prisma } from "./prisma";
import { isStaff } from "./rbac";
import { rateLimit, clientIp } from "./rate-limit";
import { loginSchema, signupSchema } from "./validators";

/**
 * Server Actions for authentication (CSRF-safe by default in Next.js).
 * Used by the login form and the logout button.
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
  if (!rateLimit(`login:${ip}`, { limit: 8, windowMs: 60_000 }).ok) {
    return { error: "tooManyAttempts" };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalidCredentials" };

  let role: string | undefined;
  try {
    const token = await login(parsed.data.email, parsed.data.password);
    await setSessionCookie(token);
    role = verifyToken(token)?.role;
  } catch (e) {
    const code = e instanceof Error ? e.message : "";
    if (code === "ACCOUNT_SUSPENDED") return { error: "accountSuspended" };
    if (code === "INVALID_CREDENTIALS") return { error: "invalidCredentials" };
    console.error("[loginAction] erreur inattendue:", e);
    return { error: "loginError" };
  }

  const locale = String(formData.get("locale") || "fr");
  const home = isStaff(role as never) ? "admin" : "author";
  redirect(`/${locale}/${home}`);
}

export interface SignupState {
  error?: "emailTaken" | "mismatch" | "weak" | "tooManyAttempts" | "server";
}

/**
 * Public self-registration. Always creates an AUTHOR (never staff). The account
 * is active immediately, but every book still requires admin validation, so
 * registration stays "open but controlled".
 */
export async function signupAction(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`signup:${ip}`, { limit: 5, windowMs: 60_000 }).ok) {
    return { error: "tooManyAttempts" };
  }

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((i) => i.message === "PASSWORDS_DO_NOT_MATCH");
    return { error: mismatch ? "mismatch" : "weak" };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "emailTaken" };

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        role: "AUTHOR",
        status: "ACTIVE",
        passwordHash: await hashPassword(parsed.data.password),
      },
    });
  } catch (e) {
    console.error("[signupAction]", e);
    return { error: "server" };
  }

  // Auto sign-in the new author.
  const token = createToken({ sub: user.id, role: user.role, email: user.email, name: user.name });
  await setSessionCookie(token);
  const locale = String(formData.get("locale") || "fr");
  redirect(`/${locale}/author`);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  // Redirect to the root; the i18n middleware localizes it (e.g. → /fr).
  redirect("/");
}
