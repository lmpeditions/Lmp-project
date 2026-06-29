"use client";

import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { updateTicketAction } from "@/server/ticket-actions";

const inputClass =
  "h-9 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

const STATUSES: { value: string; key: string }[] = [
  { value: "OPEN", key: "open" },
  { value: "IN_PROGRESS", key: "inProgress" },
  { value: "WAITING", key: "waiting" },
  { value: "RESOLVED", key: "resolved" },
  { value: "CLOSED", key: "closed" },
];

/** Staff controls on the ticket detail: change status + assign to a staff member. */
export function TicketAdminControls({
  ticketId,
  currentStatus,
  assigneeId,
  staff,
}: {
  ticketId: string;
  currentStatus: string; // view value: open | inProgress | waiting | resolved | closed
  assigneeId: string | null;
  staff: { id: string; name: string }[];
}) {
  const t = useTranslations("adminTickets");
  const tk = useTranslations("tickets");

  return (
    <form action={updateTicketAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="ticketId" value={ticketId} />

      <div className="space-y-1.5">
        <label htmlFor="status" className="text-xs font-medium text-muted-foreground">{t("changeStatus")}</label>
        <select id="status" name="status" defaultValue={STATUSES.find((s) => s.key === currentStatus)?.value ?? "OPEN"} className={inputClass}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{tk(s.key)}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="assigneeId" className="text-xs font-medium text-muted-foreground">{t("assignee")}</label>
        <select id="assigneeId" name="assigneeId" defaultValue={assigneeId ?? ""} className={inputClass}>
          <option value="">{t("unassigned")}</option>
          {staff.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        <Save className="h-3.5 w-3.5" /> {t("save")}
      </button>
    </form>
  );
}
