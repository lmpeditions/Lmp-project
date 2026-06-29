"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Send, Paperclip } from "lucide-react";
import { postReviewMessageAction, type ReviewActionState } from "@/server/review-actions";
import type { ThreadMessage } from "@/server/queries";

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

/**
 * Author ↔ editor conversation thread for a stage. Timestamped messages stack;
 * `perspective` controls which side renders on the right (the current user).
 */
export function StageThread({
  messages,
  dossierId,
  perspective,
  stage = "REVIEW",
}: {
  messages: ThreadMessage[];
  dossierId: string;
  perspective: "author" | "lmp";
  stage?: string;
}) {
  const t = useTranslations("review");
  const locale = useLocale();
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ReviewActionState, FormData>(
    postReviewMessageAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("noMessages")}</p>
        )}
        {messages.map((m) => {
          const mine = m.side === perspective;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>
                <p className={`mb-0.5 text-xs font-semibold ${mine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {m.senderName}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
                {m.attachments.map((a) => (
                  <a
                    key={a.url}
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-1 inline-flex items-center gap-1 text-xs font-medium underline ${mine ? "text-primary-foreground" : "text-primary"}`}
                  >
                    <Paperclip className="h-3 w-3" />
                    {a.name}
                  </a>
                ))}
                <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {fmt(m.date)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form ref={formRef} action={formAction} className="space-y-2 border-t border-border pt-4">
        <input type="hidden" name="dossierId" value={dossierId} />
        <input type="hidden" name="stage" value={stage} />
        <textarea name="body" required rows={2} placeholder={t("messagePlaceholder")} className={inputClass} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input name="attachmentName" placeholder={t("attachmentName")} className={inputClass} />
          <input name="attachmentUrl" type="url" placeholder={t("attachmentUrl")} className={inputClass} />
        </div>
        {state.error && (
          <p className="text-xs text-danger">{t("messageError")}</p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {pending ? t("sending") : t("sendMessage")}
          </button>
        </div>
      </form>
    </div>
  );
}
