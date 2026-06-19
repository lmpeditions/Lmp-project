import crypto from "node:crypto";
import { prisma } from "./prisma";

/**
 * Single-use, expiring tokens for author onboarding (ACTIVATION) and
 * credential recovery (PASSWORD_RESET). Backed by the InviteToken model.
 */

export type TokenPurpose = "ACTIVATION" | "PASSWORD_RESET";

const TTL: Record<TokenPurpose, number> = {
  ACTIVATION: 1000 * 60 * 60 * 24 * 7, // 7 days
  PASSWORD_RESET: 1000 * 60 * 60 * 2, // 2 hours
};

/** Create a fresh token for a user and persist it. Returns the raw token. */
export async function createToken(userId: string, purpose: TokenPurpose): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.inviteToken.create({
    data: { token, userId, purpose, expiresAt: new Date(Date.now() + TTL[purpose]) },
  });
  return token;
}

/**
 * Look up a token and validate it (right purpose, not used, not expired).
 * Returns the record (incl. userId) or null. Does NOT mark it used.
 */
export async function verifyTokenRecord(token: string, purpose: TokenPurpose) {
  const rec = await prisma.inviteToken.findUnique({ where: { token } });
  if (!rec) return null;
  if (rec.purpose !== purpose) return null;
  if (rec.usedAt) return null;
  if (rec.expiresAt < new Date()) return null;
  return rec;
}

/** Mark a token consumed (call after the action it guards succeeds). */
export async function markTokenUsed(id: string): Promise<void> {
  await prisma.inviteToken.update({ where: { id }, data: { usedAt: new Date() } });
}
