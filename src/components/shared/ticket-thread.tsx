"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Send } from "lucide-react";
import { replyTicketAction, type TicketActionState } from "@/server/ticket-actions";
import type { ThreadMessage } from "@/server/queries";

/** Ticket conversation with a reply box. `perspective` aligns the viewer's bubbles right. */
export function TicketThread({
  ticketId,
  messages,
  perspective,
}: {
  ticketId: string;
  messages: ThreadMessage[];
  perspective: "author" | "lmp";
}) {
  const t = useTranslations("tickets");
  const locale = useLocale();
  const router = useRouter();
  const [state, formAction, pending] = useActionState<TicketActionState, FormData>(replyTicketAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // On success: clear the box AND re-fetch the route so the new message shows
    // immediately (previously it only appeared after a manual page reload).
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.map((m) => {
          const mine = m.side === perspective;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>
                <p className={`mb-0.5 text-xs font-semibold ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{m.senderName}</p>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{fmt(m.date)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form ref={formRef} action={formAction} className="space-y-2 border-t border-border pt-4">
        <input type="hidden" name="ticketId" value={ticketId} />
        <textarea name="body" required rows={2} placeholder={t("writeMessage")} className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
        {state.error && <p className="text-xs text-danger">{t("replyError")}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {pending ? "…" : t("send")}
          </button>
        </div>
      </form>
    </div>
  );
}
