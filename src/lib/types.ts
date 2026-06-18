/**
 * Domain types for the LMP editorial portal.
 * These mirror the future Prisma models so the mock layer can be swapped
 * for real Supabase/Prisma queries with minimal changes.
 */

export type StageType =
  | "contrat"
  | "isbn"
  | "relecture"
  | "correction"
  | "couverture"
  | "miseEnPage"
  | "communication"
  | "publication";

export type StageStatus = "done" | "inProgress" | "upcoming" | "pending";

export interface Stage {
  type: StageType;
  status: StageStatus;
  /** 0–100 percentage of completion for this stage. */
  progress: number;
}

export type PaymentMethod = "transfer" | "cash" | "card";
export type PaymentStatus = "validated" | "pending";

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: PaymentStatus;
}

export interface PaymentSchedule {
  id: string;
  dueDate: string;
  amount: number;
}

export type TicketCategory =
  | "general"
  | "complaint"
  | "finance"
  | "proofreading"
  | "cover"
  | "communication"
  | "technical"
  | "termination";

export type TicketStatus =
  | "open"
  | "inProgress"
  | "waiting"
  | "resolved"
  | "closed";

export interface Ticket {
  id: string;
  ref: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  updatedAt: string;
  unread: number;
}

export type CoverStatus =
  | "brief"
  | "firstProposal"
  | "revisions"
  | "finalValidation";

export interface CoverProposal {
  id: string;
  label: string;
  /** Tailwind gradient classes used to render the mock artwork. */
  gradient: string;
  approved: boolean;
  current: boolean;
}

export interface ActivityItem {
  id: string;
  date: string;
  label: string;
  type: "stage" | "document" | "payment" | "ticket" | "cover";
}

export interface Dossier {
  trackingNumber: string;
  bookTitle: string;
  authorName: string;
  startDate: string;
  editor: string;
  formula: string;
  estimatedPublication: string;
  globalProgress: number;
  stages: Stage[];
  payments: Payment[];
  schedule: PaymentSchedule[];
  contractTotal: number;
  tickets: Ticket[];
  coverProposals: CoverProposal[];
  activity: ActivityItem[];
}

/* --------------------------- Module detail types -------------------------- */

export interface ActionLog {
  date: string;
  /** Translation key under "isbn.events" / generic, or raw label. */
  label: string;
}

export interface ModuleFile {
  name: string;
  /** ISO date. */
  date: string;
  /** Optional size label, e.g. "2.4 Mo". */
  size?: string;
}

export type IsbnStatus = "notStarted" | "requestSent" | "pending" | "obtained";

export interface IsbnModule {
  status: IsbnStatus;
  isbn?: string;
  documents: ModuleFile[];
  history: ActionLog[];
}

export type ReadingState =
  | "notStarted"
  | "firstRead"
  | "commentsSent"
  | "authorValidation"
  | "done";

export interface ReadingModule {
  state: ReadingState;
  progress: number;
  notes: string[];
  files: ModuleFile[];
}

export interface CorrectionSubstep {
  /** Translation key under "correction.substeps". */
  key: "spelling" | "grammar" | "style" | "finalValidation";
  progress: number;
}

export interface CorrectionModule {
  progress: number;
  substeps: CorrectionSubstep[];
  remarks: string[];
}

export type LayoutStepStatus = "done" | "inProgress" | "upcoming";

export interface LayoutStep {
  /** Translation key under "miseEnPage.steps". */
  key: "preparation" | "firstLayout" | "revisions" | "bat" | "finalValidation";
  status: LayoutStepStatus;
}

export interface LayoutModule {
  steps: LayoutStep[];
  batValidated: boolean;
  documents: ModuleFile[];
}

export type CommunicationStatus =
  | "done"
  | "inProgress"
  | "planned"
  | "confirmed"
  | "upcoming";

export interface CommunicationAction {
  /** Raw label (localized in data) or key. */
  label: string;
  status: CommunicationStatus;
  date?: string;
}

export type DocumentCategory =
  | "manuscript"
  | "administrative"
  | "visuals"
  | "cover"
  | "content"
  | "financial"
  | "communication";

export interface LibraryDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  mimeType: string;
  size: string;
  version: number;
  addedBy: string;
  date: string;
  comment?: string;
}

export interface TicketMessage {
  id: string;
  senderName: string;
  /** "author" | "lmp" — controls bubble alignment/colour. */
  side: "author" | "lmp";
  body: string;
  date: string;
  attachments?: string[];
}

export type TerminationStatus =
  | "notStarted"
  | "submitted"
  | "review"
  | "decision"
  | "closed";

export interface TerminationModule {
  status: TerminationStatus;
  steps: { key: "submission" | "review" | "decision" | "closure"; done: boolean }[];
}

export type NotificationType =
  | "stage"
  | "document"
  | "ticket"
  | "payment"
  | "validation"
  | "termination";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export interface AuthorProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  locale: "fr" | "en";
  theme: "light" | "dark" | "system";
}

/* ----------------------------- Admin types ----------------------------- */

export type UserRole = "superAdmin" | "admin" | "manager" | "author";
export type UserStatus = "active" | "suspended" | "invited";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  dossierCount: number;
  lastActive: string;
}

export interface AdminPaymentRow {
  id: string;
  date: string;
  trackingNumber: string;
  authorName: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: PaymentStatus;
}

export interface AdminDossierRow {
  trackingNumber: string;
  authorName: string;
  bookTitle: string;
  editor: string;
  progress: number;
  status: "inProgress" | "completed" | "onHold";
  openTickets: number;
}

export interface MonthlyRevenue {
  month: string;
  collected: number;
  pending: number;
}

export interface StageDistribution {
  stage: StageType;
  count: number;
}

export interface AdminStats {
  totalClients: number;
  clientsNewThisMonth: number;
  totalProjects: number;
  inProgress: number;
  completed: number;
  revenueCollected: number;
  revenuePending: number;
  revenueByMonth: MonthlyRevenue[];
  stageDistribution: StageDistribution[];
  recentActivity: ActivityItem[];
  dossiers: AdminDossierRow[];
}
