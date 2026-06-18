import { prisma } from "./prisma";

/**
 * Append an entry to the audit trail (ActivityLog). Call after every sensitive
 * mutation. Never throws into the caller — logging failures must not break the
 * primary action.
 */
export async function audit(params: {
  actorId?: string | null;
  dossierId?: string | null;
  action: string; // e.g. "stage.updated"
  entity: string; // e.g. "Stage"
  meta?: Record<string, unknown>;
  ip?: string | null;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: params.actorId ?? null,
        dossierId: params.dossierId ?? null,
        action: params.action,
        entity: params.entity,
        meta: params.meta ?? undefined,
        ip: params.ip ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write activity log", err);
  }
}
