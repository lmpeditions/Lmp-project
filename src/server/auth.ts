import crypto from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Lightweight, dependency-free session layer.
 *
 * We sign a stateless JWT (HS256) with the user id + role and store it in an
 * httpOnly, SameSite=Lax, Secure cookie. This avoids the next-auth@beta peer
 * conflict with React 19 while still giving us secure sessions + RBAC.
 *
 * bcrypt hashes passwords (cost 12). Tokens are verified with constant-time
 * comparison. Session lifetime is 7 days.
 */

const COOKIE = "lmp_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days (seconds)

export interface SessionPayload {
  sub: string; // user id
  role: Role;
  email: string;
  name: string;
  iat: number;
  exp: number;
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlJson(obj: unknown): string {
  return b64url(JSON.stringify(obj));
}

function sign(data: string): string {
  return b64url(crypto.createHmac("sha256", secret()).update(data).digest());
}

/** Create a signed session token. */
export function createToken(payload: Omit<SessionPayload, "iat" | "exp">): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const full: SessionPayload = { ...payload, iat: now, exp: now + MAX_AGE };
  const head = b64urlJson(header);
  const body = b64urlJson(full);
  const sig = sign(`${head}.${body}`);
  return `${head}.${body}.${sig}`;
}

/** Verify a token and return its payload, or null if invalid/expired. */
export function verifyToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [head, body, sig] = parts;
  const expected = sign(`${head}.${body}`);
  // Constant-time comparison.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64").toString()) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Set the session cookie (call from a Server Action / Route Handler). */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Read the current session from the request cookies. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

/**
 * Verify email + password (first factor). Returns the user record on success.
 * Throws on bad credentials or a suspended account. Does NOT issue a session:
 * the session is only created after the e-mail OTP second factor succeeds
 * (see `finalizeLogin`), so a correct password alone grants no access.
 */
export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.passwordHash) throw new Error("INVALID_CREDENTIALS");
  if (user.status === "SUSPENDED") throw new Error("ACCOUNT_SUSPENDED");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("INVALID_CREDENTIALS");
  return user;
}

/**
 * Complete a login after the OTP has been validated: stamp the activity, flip
 * a first-time INVITED account to ACTIVE, and return a fresh session token.
 */
export async function finalizeLogin(userId: string): Promise<string> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });
  if (user.status === "INVITED") {
    await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  }
  return createToken({ sub: user.id, role: user.role, email: user.email, name: user.name });
}
