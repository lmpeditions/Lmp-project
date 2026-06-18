import type { BadgeTone } from "@/components/ui/badge";
import type {
  PaymentStatus,
  StageStatus,
  TicketStatus,
} from "./types";

export const stageStatusTone: Record<StageStatus, BadgeTone> = {
  done: "success",
  inProgress: "info",
  upcoming: "neutral",
  pending: "warning",
};

export const ticketStatusTone: Record<TicketStatus, BadgeTone> = {
  open: "info",
  inProgress: "primary",
  waiting: "warning",
  resolved: "success",
  closed: "neutral",
};

export const paymentStatusTone: Record<PaymentStatus, BadgeTone> = {
  validated: "success",
  pending: "warning",
};

export const adminDossierStatusTone: Record<
  "inProgress" | "completed" | "onHold",
  BadgeTone
> = {
  inProgress: "info",
  completed: "success",
  onHold: "warning",
};
