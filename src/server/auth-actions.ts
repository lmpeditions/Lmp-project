"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { login, setSessionCookie, clearSessionCookie, verifyToken } from "./auth";
import { isStaff } from "./rbac";
import { rateLimit, clientIp } from "./rate-limit";
import { loginSchema } from "./validators";

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
    return { error: "loginError" };
  }

  const locale = String(formData.get("locale") || "fr");
  const home = isStaff(role as never) ? "admin" : "author";
  redirect(`/${locale}/${home}`);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  // Redirect to the root; the i18n middleware localizes it (e.g. → /fr).
  redirect("/");
}
