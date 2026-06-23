import crypto from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

/**
 * E-mail OTP second factor (custom MFA).
 *
 * After the password (first factor) is verified we DON'T issue a session.
 * Instead we set a short-lived, signed "pending login" cookie and e-mail a
 * 6-digit code whose bcrypt hash is stored in `LoginOtp` (never in clear).
 * Only once the code is validated does `/verify-otp` issue the real session
 * cookie — so a correct password alone reaches nothing but the OTP screen.
 */

const PENDING_COOKIE = "lmp_otp_pending";
const PENDING_MAX_AGE = 60 * 15; // 15 min — outlasts the code TTL a little
const CODE_TTL_MS = 1000 * 60 * 10; // 10 min
const MAX_ATTEMPTS = 5;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

/** Set the signed "password ok, awaiting OTP" cookie for a user. */
export async function setPendingLogin(userId: string): Promise<void> {
  const store = await cookies();
  store.set(PENDING_COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_MAX_AGE,
  });
}

/** Read + verify the pending-login cookie. Returns the userId or null. */
export async function getPendingLogin(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  const idx = raw.lastIndexOf(".");
  if (idx < 0) return null;
  const userId = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  const expected = sign(userId);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

export async function clearPendingLogin(): Promise<void> {
  const store = await cookies();
  store.delete(PENDING_COOKIE);
}

/**
 * Generate a fresh 6-digit code, store its hash, and return the clear code so
 * the caller can e-mail it. Any earlier un-consumed code is discarded first.
 */
export async function issueOtp(userId: string): Promise<string> {
  await prisma.loginOtp.deleteMany({ where: { userId, consumedAt: null } });
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.loginOtp.create({
    data: { userId, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });
  return code;
}

export type OtpResult = "ok" | "invalid" | "expired" | "tooManyAttempts";

/** Verify a submitted code against the latest active OTP for the user. */
export async function verifyOtp(userId: string, code: string): Promise<OtpResult> {
  const otp = await prisma.loginOtp.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return "invalid";
  if (otp.attempts >= MAX_ATTEMPTS) return "tooManyAttempts";
  if (otp.expiresAt < new Date()) return "expired";

  const ok = await bcrypt.compare(code, otp.codeHash);
  if (!ok) {
    await prisma.loginOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return otp.attempts + 1 >= MAX_ATTEMPTS ? "tooManyAttempts" : "invalid";
  }
  await prisma.loginOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  return "ok";
}
