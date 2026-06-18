"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Download, Eye, Pencil, BookMarked } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CoverProposal } from "@/lib/types";

export function CoverGallery({
  proposals,
  bookTitle,
}: {
  proposals: CoverProposal[];
  bookTitle: string;
}) {
  const t = useTranslations("couverture");
  const tc = useTranslations("common");
  const [approvedId, setApprovedId] = useState<string | null>(
    proposals.find((p) => p.approved)?.id ?? null
  );
  const [active, setActive] = useState<string>(
    proposals.find((p) => p.current)?.id ?? proposals[0].id
  );

  const steps = ["brief", "firstProposal", "revisions", "finalValidation"] as const;
  const currentStep = approvedId ? 3 : 2;

  return (
    <div className="space-y-6">
      {/* Status stepper */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  i <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("text-sm", i <= currentStep ? "font-medium" : "text-muted-foreground")}>
                {t(`status.${s}`)}
              </span>
              {i < steps.length - 1 && <span className="mx-1 hidden h-px w-8 bg-border sm:block" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Gallery grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {proposals.map((p, i) => {
          const isApproved = approvedId === p.id;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Card
                className={cn(
                  "group overflow-hidden transition-all hover:shadow-md",
                  isApproved && "ring-2 ring-success",
                  active === p.id && !isApproved && "ring-2 ring-primary"
                )}
              >
                {/* Mock cover artwork */}
                <button
                  onClick={() => setActive(p.id)}
                  className={cn(
                    "relative flex aspect-[3/4] w-full flex-col justify-between bg-gradient-to-br p-4 text-left text-white",
                    p.gradient
                  )}
                >
                  <div className="flex items-center justify-between">
                    <BookMarked className="h-5 w-5 opacity-80" />
                    {isApproved && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-success">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-70">LMP Éditions</p>
                    <p className="mt-1 text-lg font-bold leading-tight drop-shadow">{bookTitle}</p>
                    <p className="mt-2 text-xs opacity-80">Yasmine El Amrani</p>
                  </div>
                </button>

                <div className="space-y-3 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{p.label}</span>
                    {isApproved ? (
                      <Badge tone="success" dot>{t("approved")}</Badge>
                    ) : p.current ? (
                      <Badge tone="info" dot>{t("current")}</Badge>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3.5 w-3.5" /> {tc("view")}
                    </Button>
                    <Button size="sm" variant="ghost" className="px-2" aria-label={tc("download")}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isApproved ? "secondary" : "primary"}
                      className="flex-1"
                      onClick={() => setApprovedId(isApproved ? null : p.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {tc("approve")}
                    </Button>
                    <Button size="sm" variant="ghost" className="px-2" aria-label={tc("requestChange")}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
