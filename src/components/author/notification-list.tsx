"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  FileText,
  Ticket as TicketIcon,
  CreditCard,
  CheckCircle2,
  FileX,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { NotificationItem, NotificationType } from "@/lib/types";

const icons: Record<NotificationType, LucideIcon> = {
  stage: Sparkles,
  document: FileText,
  ticket: TicketIcon,
  payment: CreditCard,
  validation: CheckCircle2,
  termination: FileX,
};

const tones: Record<NotificationType, string> = {
  stage: "bg-primary/12 text-primary",
  document: "bg-muted text-muted-foreground",
  ticket: "bg-info/12 text-info",
  payment: "bg-warning/12 text-warning",
  validation: "bg-accent/15 text-accent",
  termination: "bg-danger/12 text-danger",
};

export function NotificationList({ items, locale }: { items: NotificationItem[]; locale: string }) {
  const t = useTranslations("notifications");
  const [list, setList] = useState(items);
  const unread = list.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unread} {t("unread").toLowerCase()}
        </p>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setList((l) => l.map((n) => ({ ...n, read: true })))}
          >
            <CheckCheck className="h-4 w-4" />
            {t("markAllRead")}
          </Button>
        )}
      </div>

      <Card className="divide-y divide-border">
        {list.map((n) => {
          const Icon = icons[n.type];
          return (
            <button
              key={n.id}
              onClick={() => setList((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50",
                !n.read && "bg-primary/[0.03]"
              )}
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", tones[n.type])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <Badge tone="neutral">{t(`types.${n.type}`)}</Badge>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-accent" />}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(n.date.slice(0, 10), locale)}
              </span>
            </button>
          );
        })}
      </Card>
    </div>
  );
}
