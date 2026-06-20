import { prisma } from "./prisma";
import { getSession } from "./auth";
import { isStaff } from "./rbac";
import { readActiveBookCookie } from "./active-book";

export type Attachment = { name: string; url: string };
const asAttachments = (v: unknown): Attachment[] =>
  Array.isArray(v) ? (v as Attachment[]) : [];
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
