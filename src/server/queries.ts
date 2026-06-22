import { prisma } from "./prisma";
import { getSession } from "./auth";
import { isStaff } from "./rbac";
import { readActiveBookCookie } from "./active-book";

export type Attachment = { name: string; url: string };
const asAttachments = (v: unknown): Attachment[] =>
  Array.isArray(v) ? (v as Attachment[]) : [];
import type {
  ActivityItem,
  AdminPaymentRow,
  AdminStats,
  Dossier as ViewDossier,
  NotificationItem,
  NotificationType as ViewNotificationType,
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

export interface BookSummary {
  id: string;
  trackingNumber: string;
  bookTitle: string;
  status: string;
  globalProgress: number;
}

/** All of an author's books, newest first — feeds the quick-switch. */
export async function getAuthorBooks(userId: string): Promise<BookSummary[]> {
  return prisma.dossier.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, trackingNumber: true, bookTitle: true, status: true, globalProgress: true },
  });
}

/**
 * Resolve the author's active book: the one stored in the cookie if still
 * owned, else the most recent non-pending book, else the most recent book.
 */
export async function getActiveBook(
  userId: string,
): Promise<{ id: string; status: string; bookTitle: string } | null> {
  const books = await prisma.dossier.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, bookTitle: true },
  });
  if (books.length === 0) return null;
  const cookieId = await readActiveBookCookie();
  const fromCookie = cookieId ? books.find((b) => b.id === cookieId) : undefined;
  if (fromCookie) return fromCookie;
  return books.find((b) => b.status !== "PENDING_VALIDATION") ?? books[0];
}

/**
 * Dashboard data for one specific book, mapped to the view `Dossier` shape.
 * Returns null if the dossier no longer exists.
 */
export async function getAuthorDashboard(dossierId: string): Promise<ViewDossier | null> {
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
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
    where: { userId: dossier.authorId, dossierId: dossier.id },
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

export interface RemarkView {
  id: string;
  title: string;
  description: string;
  attachments: Attachment[];
  authorName: string;
  date: string;
}
export interface ThreadMessage {
  id: string;
  side: "author" | "lmp";
  senderName: string;
  body: string;
  attachments: Attachment[];
  date: string;
}
export interface ReviewData {
  dossierId: string;
  trackingNumber: string;
  bookTitle: string;
  authorName: string;
  isbn: string | null;
  legalDeposit: string | null;
  relecture: { status: ViewStageStatus; progress: number };
  correction: { status: ViewStageStatus; progress: number };
  remarks: RemarkView[];
  messages: ThreadMessage[];
}

/** Merged Relecture + Correction stage: progress, ISBN/legal deposit, remarks, thread. */
export async function getReviewData(dossierId: string): Promise<ReviewData | null> {
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    select: {
      id: true,
      trackingNumber: true,
      bookTitle: true,
      isbn: true,
      legalDeposit: true,
      author: { select: { name: true } },
      stages: { where: { type: { in: ["RELECTURE", "CORRECTION"] } } },
    },
  });
  if (!dossier) return null;

  const rel = dossier.stages.find((s) => s.type === "RELECTURE");
  const cor = dossier.stages.find((s) => s.type === "CORRECTION");

  const [remarks, messages] = await Promise.all([
    prisma.editorialRemark.findMany({
      where: { dossierId, stage: "REVIEW" },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.stageMessage.findMany({
      where: { dossierId, stage: "REVIEW" },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { name: true, role: true } } },
    }),
  ]);

  return {
    dossierId: dossier.id,
    trackingNumber: dossier.trackingNumber,
    bookTitle: dossier.bookTitle,
    authorName: dossier.author.name,
    isbn: dossier.isbn,
    legalDeposit: dossier.legalDeposit,
    relecture: { status: stageStatusMap[rel?.status ?? "UPCOMING"], progress: rel?.progress ?? 0 },
    correction: { status: stageStatusMap[cor?.status ?? "UPCOMING"], progress: cor?.progress ?? 0 },
    remarks: remarks.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      attachments: asAttachments(r.attachments),
      authorName: r.createdBy?.name ?? "LMP",
      date: r.createdAt.toISOString(),
    })),
    messages: messages.map((m) => ({
      id: m.id,
      side: isStaff(m.sender.role) ? "lmp" : "author",
      senderName: m.sender.name,
      body: m.body,
      attachments: asAttachments(m.attachments),
      date: m.createdAt.toISOString(),
    })),
  };
}

export interface FinancePayment {
  id: string;
  date: string;
  amount: number;
  method: ViewPaymentMethod;
  reference: string;
  status: ViewPaymentStatus;
  invoiceUrl: string | null;
  byAuthor: boolean;
}
export interface LedgerEntryView {
  id: string;
  direction: "IN" | "OUT";
  amount: number;
  label: string;
  date: string;
}
export interface FinanceData {
  dossierId: string;
  bookTitle: string;
  contractTotal: number;
  paid: number;
  balance: number;
  ledgerIn: number;
  ledgerOut: number;
  financingStrategy: string | null;
  payments: FinancePayment[];
  ledger: LedgerEntryView[];
  schedule: { id: string; dueDate: string; amount: number }[];
}

/** Full finance view for a dossier: payments (+invoices), ledger, strategy, totals. */
export async function getFinanceData(dossierId: string): Promise<FinanceData | null> {
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: {
      payments: { orderBy: { date: "desc" } },
      ledgerEntries: { orderBy: { date: "desc" } },
      schedules: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!dossier) return null;

  const paid = dossier.payments
    .filter((p) => p.status === "VALIDATED")
    .reduce((s, p) => s + p.amount, 0);
  const ledgerIn = dossier.ledgerEntries.filter((e) => e.direction === "IN").reduce((s, e) => s + e.amount, 0);
  const ledgerOut = dossier.ledgerEntries.filter((e) => e.direction === "OUT").reduce((s, e) => s + e.amount, 0);

  return {
    dossierId: dossier.id,
    bookTitle: dossier.bookTitle,
    contractTotal: dossier.contractTotal,
    paid,
    balance: dossier.contractTotal - paid,
    ledgerIn,
    ledgerOut,
    financingStrategy: dossier.financingStrategy,
    payments: dossier.payments.map((p) => ({
      id: p.id,
      date: p.date.toISOString(),
      amount: p.amount,
      method: paymentMethodMap[p.method],
      reference: p.reference,
      status: paymentStatusMap[p.status],
      invoiceUrl: p.invoiceUrl,
      byAuthor: !!p.uploadedById,
    })),
    ledger: dossier.ledgerEntries.map((e) => ({
      id: e.id,
      direction: e.direction,
      amount: e.amount,
      label: e.label,
      date: e.date.toISOString(),
    })),
    schedule: dossier.schedules.map((s) => ({ id: s.id, dueDate: s.dueDate.toISOString(), amount: s.amount })),
  };
}

/** Net financial movements for a dossier (for the author dashboard). */
export async function getLedgerSummary(dossierId: string): Promise<{ in: number; out: number }> {
  const entries = await prisma.ledgerEntry.findMany({ where: { dossierId }, select: { direction: true, amount: true } });
  return {
    in: entries.filter((e) => e.direction === "IN").reduce((s, e) => s + e.amount, 0),
    out: entries.filter((e) => e.direction === "OUT").reduce((s, e) => s + e.amount, 0),
  };
}

export type ValidationOption = { id: string; label: string; url: string };
export interface ValidationView {
  id: string;
  kind: "CORRECTION" | "COVER" | "LAYOUT";
  title: string;
  status: "PENDING" | "VALIDATED" | "CHANGES_REQUESTED" | "EXPIRED_TO_EDITOR";
  options: ValidationOption[];
  selectedOptionId: string | null;
  authorComment: string | null;
  deadline: string;
  locked: boolean;
  expired: boolean; // deadline passed while still PENDING
  createdAt: string;
}

/** All validation requests for a dossier, newest first, with expiry computed. */
export async function getDossierValidations(dossierId: string): Promise<ValidationView[]> {
  const rows = await prisma.validationRequest.findMany({
    where: { dossierId },
    orderBy: { createdAt: "desc" },
  });
  const now = Date.now();
  return rows.map((v) => ({
    id: v.id,
    kind: v.kind,
    title: v.title,
    status: v.status,
    options: Array.isArray(v.options) ? (v.options as ValidationOption[]) : [],
    selectedOptionId: v.selectedOptionId,
    authorComment: v.authorComment,
    deadline: v.deadline.toISOString(),
    locked: v.locked,
    expired: v.status === "PENDING" && v.deadline.getTime() < now,
    createdAt: v.createdAt.toISOString(),
  }));
}

export interface AdminDossierRow {
  id: string;
  trackingNumber: string;
  bookTitle: string;
  authorName: string;
  editor: string;
  progress: number;
  status: string;
}

/** Real (validated) dossiers for the admin list, linking to their detail page. */
export async function getAdminDossiers(): Promise<AdminDossierRow[]> {
  const rows = await prisma.dossier.findMany({
    where: { status: { not: "PENDING_VALIDATION" } },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } }, manager: { select: { name: true } } },
  });
  return rows.map((d) => ({
    id: d.id,
    trackingNumber: d.trackingNumber,
    bookTitle: d.bookTitle,
    authorName: d.author.name,
    editor: d.manager?.name ?? "—",
    progress: d.globalProgress,
    status: d.status,
  }));
}

// ----------------------------------------------------------------- Admin aggregates

const STAGE_DB_TYPES = ["CONTRAT", "ISBN", "RELECTURE", "CORRECTION", "COUVERTURE", "MISE_EN_PAGE", "COMMUNICATION", "PUBLICATION"] as const;

const dossierStatusView: Record<string, "inProgress" | "completed" | "onHold"> = {
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
  ON_HOLD: "onHold",
  CANCELLED: "onHold",
};

const activityLabels: Record<string, { label: string; type: ActivityItem["type"] }> = {
  "author.created": { label: "Nouvel auteur créé", type: "stage" },
  "book.created": { label: "Nouveau livre soumis", type: "stage" },
  "book.validated": { label: "Livre validé", type: "stage" },
  "stage.updated": { label: "Étape mise à jour", type: "stage" },
  "review.updated": { label: "Relecture / correction mise à jour", type: "stage" },
  "remark.added": { label: "Remarque éditoriale ajoutée", type: "document" },
  "validation.created": { label: "Demande de validation envoyée", type: "cover" },
  "validation.editorDecided": { label: "Décision de validation (éditeur)", type: "cover" },
  "payment.recorded": { label: "Paiement enregistré", type: "payment" },
  "payment.confirmed": { label: "Paiement confirmé", type: "payment" },
  "ledger.added": { label: "Mouvement financier", type: "payment" },
  "financing.updated": { label: "Stratégie de financement mise à jour", type: "payment" },
};

/** Real back-office statistics computed live from the database. */
export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalClients, clientsNewThisMonth, totalProjects, inProgress, completed, collectedAgg, pendingAgg] =
    await Promise.all([
      prisma.user.count({ where: { role: "AUTHOR" } }),
      prisma.user.count({ where: { role: "AUTHOR", createdAt: { gte: startOfMonth } } }),
      prisma.dossier.count({ where: { status: { not: "PENDING_VALIDATION" } } }),
      prisma.dossier.count({ where: { status: "IN_PROGRESS" } }),
      prisma.dossier.count({ where: { status: "COMPLETED" } }),
      prisma.payment.aggregate({ where: { status: "VALIDATED" }, _sum: { amount: true } }),
      prisma.paymentSchedule.aggregate({ where: { paid: false }, _sum: { amount: true } }),
    ]);

  // Monthly buckets (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("fr-FR", { month: "short" }), collected: 0, pending: 0 };
  });
  const monthOf = (date: Date) => months.find((m) => m.key === `${date.getFullYear()}-${date.getMonth()}`);

  const [paidPayments, unpaidSchedules, inProgStages, logs, dossiers] = await Promise.all([
    prisma.payment.findMany({ where: { status: "VALIDATED" }, select: { amount: true, date: true } }),
    prisma.paymentSchedule.findMany({ where: { paid: false }, select: { amount: true, dueDate: true } }),
    prisma.stage.findMany({ where: { status: "IN_PROGRESS" }, select: { type: true } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.dossier.findMany({
      where: { status: { not: "PENDING_VALIDATION" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        author: { select: { name: true } },
        manager: { select: { name: true } },
        tickets: { where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING"] } }, select: { id: true } },
      },
    }),
  ]);

  for (const p of paidPayments) monthOf(p.date) && (monthOf(p.date)!.collected += p.amount);
  for (const s of unpaidSchedules) monthOf(s.dueDate) && (monthOf(s.dueDate)!.pending += s.amount);

  const stageCounts: Record<string, number> = {};
  for (const s of inProgStages) stageCounts[s.type] = (stageCounts[s.type] ?? 0) + 1;

  return {
    totalClients,
    clientsNewThisMonth,
    totalProjects,
    inProgress,
    completed,
    revenueCollected: collectedAgg._sum.amount ?? 0,
    revenuePending: pendingAgg._sum.amount ?? 0,
    revenueByMonth: months.map((m) => ({ month: m.label, collected: m.collected, pending: m.pending })),
    stageDistribution: STAGE_DB_TYPES.map((t) => ({ stage: stageTypeMap[t], count: stageCounts[t] ?? 0 })),
    recentActivity: logs.map((l) => ({
      id: l.id,
      date: l.createdAt.toISOString(),
      label: activityLabels[l.action]?.label ?? l.action,
      type: activityLabels[l.action]?.type ?? "stage",
    })),
    dossiers: dossiers.map((d) => ({
      trackingNumber: d.trackingNumber,
      authorName: d.author.name,
      bookTitle: d.bookTitle,
      editor: d.manager?.name ?? "—",
      progress: d.globalProgress,
      status: dossierStatusView[d.status] ?? "inProgress",
      openTickets: d.tickets.length,
    })),
  };
}

/** Real payments across all dossiers, for the admin payments page. */
export async function getAdminPayments(): Promise<AdminPaymentRow[]> {
  const rows = await prisma.payment.findMany({
    orderBy: { date: "desc" },
    include: { dossier: { select: { trackingNumber: true, author: { select: { name: true } } } } },
  });
  return rows.map((p) => ({
    id: p.id,
    date: p.date.toISOString(),
    trackingNumber: p.dossier.trackingNumber,
    authorName: p.dossier.author.name,
    amount: p.amount,
    method: paymentMethodMap[p.method],
    reference: p.reference,
    status: paymentStatusMap[p.status],
  }));
}

const notificationTypeView: Record<string, ViewNotificationType> = {
  STAGE: "stage",
  DOCUMENT: "document",
  TICKET: "ticket",
  PAYMENT: "payment",
  VALIDATION: "validation",
  TERMINATION: "termination",
};

/** A user's real notifications, newest first. */
export async function getAuthorNotifications(userId: string): Promise<NotificationItem[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return rows.map((n) => ({
    id: n.id,
    type: notificationTypeView[n.type] ?? "stage",
    title: n.title,
    body: n.body,
    date: n.createdAt.toISOString(),
    read: n.read,
  }));
}

// ----------------------------------------------------------------- Per-stage threads & ISBN

/** Messages of a given stage thread (REVIEW | LAYOUT | COMMUNICATION). */
export async function getStageMessages(dossierId: string, stage: string): Promise<ThreadMessage[]> {
  const rows = await prisma.stageMessage.findMany({
    where: { dossierId, stage },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true, role: true } } },
  });
  return rows.map((m) => ({
    id: m.id,
    side: isStaff(m.sender.role) ? "lmp" : "author",
    senderName: m.sender.name,
    body: m.body,
    attachments: asAttachments(m.attachments),
    date: m.createdAt.toISOString(),
  }));
}

export interface IsbnInfo {
  isbn: string | null;
  legalDeposit: string | null;
  isbnStatus: ViewStageStatus;
  contratStatus: ViewStageStatus;
}

/** ISBN + legal deposit + the related stage statuses for a book. */
export async function getIsbnInfo(dossierId: string): Promise<IsbnInfo | null> {
  const d = await prisma.dossier.findUnique({
    where: { id: dossierId },
    select: { isbn: true, legalDeposit: true, stages: { where: { type: { in: ["ISBN", "CONTRAT"] } } } },
  });
  if (!d) return null;
  const isbnStage = d.stages.find((s) => s.type === "ISBN");
  const contrat = d.stages.find((s) => s.type === "CONTRAT");
  return {
    isbn: d.isbn,
    legalDeposit: d.legalDeposit,
    isbnStatus: stageStatusMap[isbnStage?.status ?? "UPCOMING"],
    contratStatus: stageStatusMap[contrat?.status ?? "UPCOMING"],
  };
}

// ----------------------------------------------------------------- Termination / Documents / Tickets

const terminationStatusView: Record<string, "notStarted" | "submitted" | "review" | "decision" | "closed"> = {
  NOT_STARTED: "notStarted",
  SUBMITTED: "submitted",
  REVIEW: "review",
  DECISION: "decision",
  CLOSED: "closed",
};

export interface TerminationView {
  status: "notStarted" | "submitted" | "review" | "decision" | "closed";
  reason: string | null;
  exists: boolean;
}

/** A book's termination request status (or "not started" if none). */
export async function getTermination(dossierId: string): Promise<TerminationView> {
  const tr = await prisma.terminationRequest.findUnique({ where: { dossierId } });
  return {
    status: tr ? terminationStatusView[tr.status] : "notStarted",
    reason: tr?.reason ?? null,
    exists: !!tr,
  };
}

export interface DocView {
  id: string;
  name: string;
  url: string;
  date: string;
}

/** The author's OWN uploaded documents (intro / table of contents only). */
export async function getAuthorDocuments(dossierId: string, userId: string): Promise<DocView[]> {
  const rows = await prisma.document.findMany({
    where: { dossierId, uploadedById: userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((d) => ({ id: d.id, name: d.name, url: d.url, date: d.createdAt.toISOString() }));
}

const ticketStatusView: Record<string, "open" | "inProgress" | "waiting" | "resolved" | "closed"> = {
  OPEN: "open",
  IN_PROGRESS: "inProgress",
  WAITING: "waiting",
  RESOLVED: "resolved",
  CLOSED: "closed",
};
const ticketCategoryView: Record<string, string> = {
  GENERAL: "general",
  COMPLAINT: "complaint",
  FINANCE: "finance",
  PROOFREADING: "proofreading",
  COVER: "cover",
  COMMUNICATION: "communication",
  TECHNICAL: "technical",
  TERMINATION: "termination",
};

export interface TicketRow {
  id: string;
  ref: string;
  subject: string;
  category: string;
  status: "open" | "inProgress" | "waiting" | "resolved" | "closed";
  updatedAt: string;
  authorName?: string;
  trackingNumber?: string;
}

/** Tickets created by an author across their books. */
export async function getAuthorTickets(userId: string): Promise<TicketRow[]> {
  const rows = await prisma.ticket.findMany({
    where: { authorId: userId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((t) => ({
    id: t.id,
    ref: t.ref,
    subject: t.subject,
    category: ticketCategoryView[t.category] ?? "general",
    status: ticketStatusView[t.status],
    updatedAt: t.updatedAt.toISOString(),
  }));
}

/** All tickets for the back-office, newest first. */
export async function getAdminTickets(): Promise<TicketRow[]> {
  const rows = await prisma.ticket.findMany({
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } }, dossier: { select: { trackingNumber: true } } },
  });
  return rows.map((t) => ({
    id: t.id,
    ref: t.ref,
    subject: t.subject,
    category: ticketCategoryView[t.category] ?? "general",
    status: ticketStatusView[t.status],
    updatedAt: t.updatedAt.toISOString(),
    authorName: t.author.name,
    trackingNumber: t.dossier.trackingNumber,
  }));
}

export interface TicketDetail {
  id: string;
  ref: string;
  subject: string;
  category: string;
  status: "open" | "inProgress" | "waiting" | "resolved" | "closed";
  authorId: string;
  messages: ThreadMessage[];
}

/** One ticket with its conversation, if the current viewer may access it. */
export async function getTicket(ticketId: string): Promise<TicketDetail | null> {
  const t = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true, role: true } } } } },
  });
  if (!t) return null;
  return {
    id: t.id,
    ref: t.ref,
    subject: t.subject,
    category: ticketCategoryView[t.category] ?? "general",
    status: ticketStatusView[t.status],
    authorId: t.authorId,
    messages: t.messages.map((m) => ({
      id: m.id,
      side: isStaff(m.sender.role) ? "lmp" : "author",
      senderName: m.sender.name,
      body: m.body,
      attachments: asAttachments(m.attachments),
      date: m.createdAt.toISOString(),
    })),
  };
}
