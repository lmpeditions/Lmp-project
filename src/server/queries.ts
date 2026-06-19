import { prisma } from "./prisma";
import { getSession } from "./auth";
import type {
  ActivityItem,
  Dossier as ViewDossier,
  PaymentMethod as ViewPaymentMethod,
  PaymentStatus as ViewPaymentStatus,
  StageStatus as ViewStageStatus,
  StageType as ViewStageType,
} from "@/lib/types";

/**
 * Read-side data access for Server Components.
 *
 * Bridges the Prisma layer (UPPER_SNAKE enums) to the existing view types
 * (camelCase) used by the UI components, so pages can swap mock-data for live
 * Supabase data without touching the presentation layer.
 */

const stageTypeMap: Record<string, ViewStageType> = {
  CONTRAT: "contrat",
  ISBN: "isbn",
  RELECTURE: "relecture",
  CORRECTION: "correction",
  COUVERTURE: "couverture",
  MISE_EN_PAGE: "miseEnPage",
  COMMUNICATION: "communication",
  PUBLICATION: "publication",
};

const stageStatusMap: Record<string, ViewStageStatus> = {
  DONE: "done",
  IN_PROGRESS: "inProgress",
  UPCOMING: "upcoming",
  PENDING: "pending",
};

const paymentMethodMap: Record<string, ViewPaymentMethod> = {
  TRANSFER: "transfer",
  CASH: "cash",
  CARD: "card",
};

const paymentStatusMap: Record<string, ViewPaymentStatus> = {
  VALIDATED: "validated",
  PENDING: "pending",
};

const notificationActivityType: Record<string, ActivityItem["type"]> = {
  STAGE: "stage",
  DOCUMENT: "document",
  PAYMENT: "payment",
  TICKET: "ticket",
  VALIDATION: "cover",
  TERMINATION: "stage",
};

/** The full DB user for the current session, or null if unauthenticated. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.sub } });
}

/**
 * The author's primary (most recent) dossier, mapped to the view `Dossier`
 * shape the dashboard expects. Returns null if the author has no dossier yet.
 * Multi-book selection (quick-switch) arrives in a later lot.
 */
export async function getAuthorDashboard(userId: string): Promise<ViewDossier | null> {
  const dossier = await prisma.dossier.findFirst({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      manager: { select: { name: true } },
      stages: { orderBy: { order: "asc" } },
      payments: { orderBy: { date: "asc" } },
      schedules: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!dossier) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId, dossierId: dossier.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    trackingNumber: dossier.trackingNumber,
    bookTitle: dossier.bookTitle,
    authorName: dossier.author.name,
    startDate: dossier.startDate.toISOString(),
    editor: dossier.manager?.name ?? "—",
    formula: dossier.formula,
    estimatedPublication: dossier.estimatedPublication?.toISOString() ?? "",
    globalProgress: dossier.globalProgress,
    contractTotal: dossier.contractTotal,
    stages: dossier.stages.map((s) => ({
      type: stageTypeMap[s.type],
      status: stageStatusMap[s.status],
      progress: s.progress,
    })),
    payments: dossier.payments.map((p) => ({
      id: p.id,
      date: p.date.toISOString(),
      amount: p.amount,
      method: paymentMethodMap[p.method],
      reference: p.reference,
      status: paymentStatusMap[p.status],
    })),
    schedule: dossier.schedules.map((s) => ({
      id: s.id,
      dueDate: s.dueDate.toISOString(),
      amount: s.amount,
    })),
    tickets: [],
    coverProposals: [],
    activity: notifications.map((n) => ({
      id: n.id,
      date: n.createdAt.toISOString(),
      label: n.title,
      type: notificationActivityType[n.type] ?? "stage",
    })),
  };
}
