"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

interface ActionButtonProps {
  children: ReactNode;
  /** Inline confirmation message shown after the action succeeds. */
  successMessage: string;
  /** Optional native confirm() prompt before running the action. */
  confirmMessage?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
}

/**
 * Demo action button: optional confirm prompt, then a transient inline success
 * toast. No backend yet — wired to services in the Prisma/Auth iteration.
 */
export function ActionButton({
  children,
  successMessage,
  confirmMessage,
  variant = "primary",
  size = "sm",
  className,
}: ActionButtonProps) {
  const [done, setDone] = useState(false);

  function handleClick() {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setDone(true);
    window.setTimeout(() => setDone(false), 4000);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant={variant} size={size} className={className} onClick={handleClick}>
        {children}
      </Button>
      <AnimatePresence>
        {done && (
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
  );
}
