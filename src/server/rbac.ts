import type { Role } from "@prisma/client";
import { getSession, type SessionPayload } from "./auth";
import { prisma } from "./prisma";

/**
 * Role-based access control.
 *
 * Permissions are derived from the role via a static map (simple, auditable).
 * Fine-grained per-resource checks (e.g. "can this author see this dossier?")
 * live in helpers like `assertDossierAccess`.
 */

export type Permission =
  | "dossier.read.any"
  | "dossier.read.own"
  | "dossier.write"
  | "user.manage"
  | "payment.manage"
  | "ticket.manage"
  | "ticket.read.own"
  | "stats.read"
  | "settings.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "dossier.read.any",
    "dossier.write",
    "user.manage",
    "payment.manage",
    "ticket.manage",
    "stats.read",
    "settings.manage",
  ],
  ADMIN: [
    "dossier.read.any",
    "dossier.write",
    "user.manage",
    "payment.manage",
    "ticket.manage",
    "stats.read",
  ],
  MANAGER: ["dossier.read.any", "dossier.write", "ticket.manage", "stats.read"],
  AUTHOR: ["dossier.read.own", "ticket.read.own"],
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isStaff(role: Role): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "MANAGER";
}

/** Throw if there is no session. Returns the session payload. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError("UNAUTHENTICATED");
  return session;
}

/** Throw unless the current user holds the given permission. */
export async function requirePermission(permission: Permission): Promise<SessionPayload> {
  const session = await requireSession();
  if (!can(session.role, permission)) throw new AuthError("FORBIDDEN");
  return session;
}

/** Throw unless the current user's role is in the allowed list. */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw new AuthError("FORBIDDEN");
  return session;
}

/**
 * Ensure the current user may access a specific dossier:
 * staff can access any; an author only their own.
 */
export async function assertDossierAccess(dossierId: string): Promise<SessionPayload> {
  const session = await requireSession();
  if (isStaff(session.role)) return session;
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    select: { authorId: true },
  });
  if (!dossier || dossier.authorId !== session.sub) throw new AuthError("FORBIDDEN");
  return session;
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code);
    this.name = "AuthError";
  }
  get status() {
    return this.code === "UNAUTHENTICATED" ? 401 : 403;
  }
}
