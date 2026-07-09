"use server";

import { prisma } from "./prisma";
import {
  getSession,
  hashPassword,
  verifyPassword,
  createToken,
  setSessionCookie,
} from "./auth";
import { audit } from "./audit";
import { updateProfileSchema, changePasswordSchema } from "./validators";

// ---------------------------------------------------------------- Update own profile

export interface UpdateProfileState {
  error?: "unauth" | "validation" | "server";
  ok?: boolean;
}

/** A signed-in user updates their own name / phone / address. */
export async function updateProfileAction(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const session = await getSession();
  if (!session) return { error: "unauth" };

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
  });
  if (!parsed.success) return { error: "validation" };

  try {
    const user = await prisma.user.update({
      where: { id: session.sub },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone ?? null,
        address: parsed.data.address ?? null,
      },
    });
    // Re-issue the session cookie so the updated name shows everywhere
    // (top bar, greetings) without forcing a re-login.
    await setSessionCookie(
      createToken({ sub: user.id, role: user.role, email: user.email, name: user.name }),
    );
    await audit({ actorId: session.sub, action: "profile.updated", entity: "User" });
    return { ok: true };
  } catch (e) {
    console.error("[updateProfileAction]", e);
    return { error: "server" };
  }
}

// ---------------------------------------------------------------- Change own password

export interface ChangePasswordState {
  error?:
    | "unauth"
    | "weak"
    | "mismatch"
    | "wrongCurrent"
    | "noPassword"
    | "server";
  ok?: boolean;
}

/** A signed-in user changes their own password (verifies the current one). */
export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) return { error: "unauth" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some((i) => i.message === "PASSWORDS_DO_NOT_MATCH");
    return { error: mismatch ? "mismatch" : "weak" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user?.passwordHash) return { error: "noPassword" };
    const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return { error: "wrongCurrent" };

    await prisma.user.update({
      where: { id: session.sub },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });
    await audit({ actorId: session.sub, action: "password.changed", entity: "User" });
    return { ok: true };
  } catch (e) {
    console.error("[changePasswordAction]", e);
    return { error: "server" };
  }
}
