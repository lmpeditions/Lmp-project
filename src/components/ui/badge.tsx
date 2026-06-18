import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export type BadgeTone =
  | "success"
  | "warning"
  | "info"
  | "danger"
  | "neutral"
  | "primary";

const tones: Record<BadgeTone, string> = {
  success: "bg-success/12 text-success border-success/20",
  warning: "bg-warning/12 text-warning border-warning/25",
  info: "bg-info/12 text-info border-info/20",
  danger: "bg-danger/12 text-danger border-danger/20",
  primary: "bg-primary/12 text-primary border-primary/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
