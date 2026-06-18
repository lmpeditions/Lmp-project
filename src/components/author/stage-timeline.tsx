"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/types";

const statusStyles = {
  done: "border-success bg-success text-success-foreground",
  inProgress: "border-info bg-info text-info-foreground animate-pulse",
  upcoming: "border-border bg-muted text-muted-foreground",
  pending: "border-warning bg-warning text-warning-foreground",
} as const;

const statusLabelKey = {
  done: "done",
  inProgress: "inProgress",
  upcoming: "upcoming",
  pending: "pending",
} as const;

export function StageTimeline({ stages }: { stages: Stage[] }) {
  const tStages = useTranslations("stages");
  const tStatus = useTranslations("stages.status");

  return (
    <ol className="relative grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
      {stages.map((stage, i) => {
        const Icon =
          stage.status === "done" ? Check : stage.status === "inProgress" ? Loader2 : Circle;
        return (
          <motion.li
            key={stage.type}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="relative flex gap-3 p-3"
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  statusStyles[stage.status]
                )}
              >
                <Icon className={cn("h-4 w-4", stage.status === "inProgress" && "animate-spin")} />
              </span>
              {i < stages.length - 1 && (
                <span className="mt-1 hidden h-full w-0.5 bg-border xl:block" />
              )}
            </div>
            <div className="min-w-0 pb-2">
              <p className="text-sm font-semibold">{tStages(stage.type)}</p>
              <p
                className={cn(
                  "text-xs",
                  stage.status === "done" && "text-success",
                  stage.status === "inProgress" && "text-info",
                  stage.status === "upcoming" && "text-muted-foreground",
                  stage.status === "pending" && "text-warning"
                )}
              >
                {tStatus(statusLabelKey[stage.status])}
                {stage.status === "inProgress" && ` · ${stage.progress}%`}
              </p>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
