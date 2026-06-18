"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Bold, Italic, List, Paperclip, Send, CheckCircle2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Rich-text-style ticket composer (demo). The toolbar is illustrative; the
 * message is not persisted yet — it will POST to the tickets API later.
 */
export function TicketComposer({
  submitLabel,
  successMessage,
}: {
  submitLabel: string;
  successMessage: string;
}) {
  const t = useTranslations("tickets");
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!value.trim()) return;
    setSent(true);
    setValue("");
    window.setTimeout(() => setSent(false), 4000);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-1 border-b border-border px-2 py-1.5 text-muted-foreground">
          <button className="rounded p-1.5 hover:bg-muted" aria-label="Bold"><Bold className="h-4 w-4" /></button>
          <button className="rounded p-1.5 hover:bg-muted" aria-label="Italic"><Italic className="h-4 w-4" /></button>
          <button className="rounded p-1.5 hover:bg-muted" aria-label="List"><List className="h-4 w-4" /></button>
          <span className="mx-1 h-4 w-px bg-border" />
          <button className="rounded p-1.5 hover:bg-muted" aria-label={t("attach")}><Paperclip className="h-4 w-4" /></button>
          <button className="rounded p-1.5 hover:bg-muted" aria-label="Screenshot"><Image className="h-4 w-4" /></button>
        </div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("writeMessage")}
          rows={4}
          className="w-full resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("richHint")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={handleSend} disabled={!value.trim()}>
          <Send className="h-4 w-4" />
          {submitLabel}
        </Button>
        <AnimatePresence>
          {sent && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-success"
            >
              <CheckCircle2 className="h-4 w-4" />
              {successMessage}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
