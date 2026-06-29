"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { requirePermission, AuthError } from "./rbac";
import { audit } from "./audit";
import { updateUserSchema } from "./validators";

export interface UserActionState {
  error?: "forbidden" | "validation" | "self" | "lastAdmin" | "hasLinkedData" | "notFound" | "server";
  ok?: boolean;
}

/** Admin updates a user's name, role and status. */
export async function updateUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  let session;
  try {
    session = await requirePermission("user.manage");
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const target = await prisma.user.findUnique({ where: { id: d.userId } });
  if (!target) return { error: "notFound" };

  // Never let an admin change their OWN role/status (avoids self-lockout).
  if (d.userId === session.sub && (d.role !== target.role || d.status !== target.status)) {
    return { error: "self" };
  }
  // Never remove the last active super-admin.
  if (target.role === "SUPER_ADMIN" && d.role !== "SUPER_ADMIN") {
    const others = await prisma.user.count({
      where: { role: "SUPER_ADMIN", status: "ACTIVE", id: { not: target.id } },
    });
    if (others === 0) return { error: "lastAdmin" };
  }

  try {
    await prisma.user.update({
      where: { id: d.userId },
      data: { name: d.name, role: d.role, status: d.status },
    });
    await audit({ actorId: session.sub, action: "user.updated", entity: "User", meta: { userId: d.userId, role: d.role, status: d.status } });
    return { ok: true };
  } catch (e) {
    console.error("[updateUserAction]", e);
    return { error: "server" };
  }
}

/** Toggle a user between ACTIVE and SUSPENDED (plain form action). */
export async function setUserStatusAction(formData: FormData): Promise<void> {
  let session;
  try {
    session = await requirePermission("user.manage");
  } catch (e) {
    if (e instanceof AuthError) return;
    throw e;
  }
  const userId = String(formData.get("userId") || "");
  if (userId === session.sub) return; // no self-suspend
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { status: true, role: true } });
  if (!u) return;
  const next = u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
  if (next === "SUSPENDED" && u.role === "SUPER_ADMIN") {
    const others = await prisma.user.count({ where: { role: "SUPER_ADMIN", status: "ACTIVE", id: { not: userId } } });
    if (others === 0) return; // keep at least one active super-admin
  }
  await prisma.user.update({ where: { id: userId }, data: { status: next } });
  await audit({ actorId: session.sub, action: "user.status", entity: "User", meta: { userId, status: next } });
}

/** Delete a user. Blocked for self, the last super-admin, or users with linked data. */
export async function deleteUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  let session;
  try {
    session = await requirePermission("user.manage");
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const userId = String(formData.get("userId") || "");
  if (userId === session.sub) return { error: "self" };

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, _count: { select: { ownedDossiers: true } } },
  });
  if (!u) return { error: "notFound" };
  if (u.role === "SUPER_ADMIN") {
    const others = await prisma.user.count({ where: { role: "SUPER_ADMIN", id: { not: userId } } });
    if (others === 0) return { error: "lastAdmin" };
  }
  // An author who owns books cannot be deleted (would orphan dossiers).
  if (u._count.ownedDossiers > 0) return { error: "hasLinkedData" };

  try {
    await prisma.user.delete({ where: { id: userId } });
    await audit({ actorId: session.sub, action: "user.deleted", entity: "User", meta: { userId } });
    return { ok: true };
  } catch (e) {
    // Foreign-key violation → the user has linked records (messages, tickets…).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { error: "hasLinkedData" };
    }
    console.error("[deleteUserAction]", e);
    return { error: "server" };
  }
}
