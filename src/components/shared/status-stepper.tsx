import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type StepState = "done" | "current" | "upcoming";

export interface StepperStep {
  label: string;
  state: StepState;
}

/** Horizontal numbered stepper used by ISBN / Relecture / Mise en page modules. */
export function StatusStepper({ steps }: { steps: StepperStep[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              s.state === "done" && "bg-success text-success-foreground",
              s.state === "current" && "bg-primary text-primary-foreground ring-4 ring-primary/20",
              s.state === "upcoming" && "bg-muted text-muted-foreground"
            )}
          >
            {s.state === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span
            className={cn(
              "text-sm",
              s.state === "upcoming" ? "text-muted-foreground" : "font-medium"
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <span className="mx-1 hidden h-px w-8 bg-border sm:block" />
          )}
        </li>
      ))}
    </ol>
  );
}
