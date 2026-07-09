import { z } from "zod";

/**
 * Zod schemas — the single source of truth for input validation on every
 * Server Action and Route Handler (defends against malformed/malicious input).
 */

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  // Authors must also supply their author number; admins leave it empty.
  authorNumber: z.string().max(40).optional(),
});

/** Second-factor: the 6-digit code from the login e-mail. */
export const verifyOtpSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

/** Admin creates another back-office user (admin / manager). No application. */
export const createAdminSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  role: z.enum(["ADMIN", "MANAGER", "SUPER_ADMIN"]),
});

export const activateSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8).max(200),
    confirm: z.string().min(8).max(200),
  })
  .refine((d) => d.password === d.confirm, {
    message: "PASSWORDS_DO_NOT_MATCH",
    path: ["confirm"],
  });

export const createDossierSchema = z.object({
  bookTitle: z.string().min(1).max(300),
  authorEmail: z.string().email(),
  authorName: z.string().min(1).max(200),
  formula: z.string().min(1).max(100),
  contractTotal: z.number().int().nonnegative(),
  startDate: z.coerce.date(),
  estimatedPublication: z.coerce.date().optional(),
  managerId: z.string().optional(),
});

export const updateStageSchema = z.object({
  dossierId: z.string(),
  type: z.enum([
    "CONTRAT",
    "ISBN",
    "RELECTURE",
    "CORRECTION",
    "COUVERTURE",
    "MISE_EN_PAGE",
    "COMMUNICATION",
    "PUBLICATION",
  ]),
  status: z.enum(["DONE", "IN_PROGRESS", "UPCOMING", "PENDING"]),
  progress: z.number().int().min(0).max(100),
  notes: z.string().max(2000).optional(),
});

export const recordPaymentSchema = z.object({
  dossierId: z.string(),
  date: z.coerce.date(),
  amount: z.coerce.number().int().positive(),
  method: z.enum(["TRANSFER", "CASH", "CARD"]),
  reference: z.string().min(1).max(100),
  invoiceUrl: z.string().url().max(500), // facture obligatoire
});

/** Author declares a cash payment by uploading its invoice (link). */
export const uploadInvoiceSchema = z.object({
  dossierId: z.string(),
  amount: z.coerce.number().int().positive(),
  reference: z.string().max(100).optional(),
  invoiceUrl: z.string().url().max(500),
});

/** Admin adds a financial movement (entrée / sortie). */
export const ledgerEntrySchema = z.object({
  dossierId: z.string(),
  direction: z.enum(["IN", "OUT"]),
  amount: z.coerce.number().int().positive(),
  label: z.string().min(1).max(200),
  date: z.coerce.date(),
});

/** Admin sets the financing strategy (replaces the previous value). */
export const financingStrategySchema = z.object({
  dossierId: z.string(),
  strategy: z.string().max(4000),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  locale: z.enum(["FR", "EN"]).optional(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
});

/** Admin edits an existing user (name, role, status). */
export const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(200),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "AUTHOR"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "INVITED"]),
});

/** Full author CRM record + their first book, created by an admin. */
export const createAuthorSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  nationality: z.string().max(100).optional(),
  phone: z.string().max(40).optional(),
  cin: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  profession: z.string().max(120).optional(),
  bookTitle: z.string().min(1).max(300),
  formula: z.string().min(1).max(100),
  contractTotal: z.coerce.number().int().nonnegative().default(0),
});

export const requestResetSchema = z.object({
  email: z.string().email().max(200),
});

/** Author opens a support ticket. */
export const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  category: z.enum(["GENERAL", "COMPLAINT", "FINANCE", "PROOFREADING", "COVER", "COMMUNICATION", "TECHNICAL"]),
  body: z.string().min(1).max(5000),
});

/** Reply to a ticket. */
export const ticketReplySchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().min(1).max(5000),
});

/** Author uploads their introduction or table of contents (link). */
export const authorDocumentSchema = z.object({
  dossierId: z.string().min(1),
  kind: z.enum(["introduction", "toc"]),
  url: z.string().url().max(500),
});

/** Author requests termination of a book contract. */
export const terminationSchema = z.object({
  dossierId: z.string().min(1),
  reason: z.string().max(2000).optional(),
});

/** Public author application (a candidature, NOT an account). */
export const applicationSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(200),
  nationality: z.string().max(100).optional(),
  phone: z.string().max(40).optional(),
  cin: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  profession: z.string().max(120).optional(),
});

/** Author starts a new book from the onboarding page. */
export const createBookSchema = z.object({
  bookTitle: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
});

/** Editorial remark added by an admin on the Relecture/Correction stage. */
export const remarkSchema = z.object({
  dossierId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  attachmentName: z.string().max(200).optional(),
  attachmentUrl: z.string().url().max(500).optional().or(z.literal("")),
});

/** A message posted to a stage conversation thread (author or editor). */
export const stageMessageSchema = z.object({
  dossierId: z.string().min(1),
  body: z.string().min(1).max(5000),
  attachmentName: z.string().max(200).optional(),
  attachmentUrl: z.string().url().max(500).optional().or(z.literal("")),
});

/** Admin updates the merged Relecture/Correction stage. */
export const updateReviewSchema = z.object({
  dossierId: z.string().min(1),
  isbn: z.string().max(40).optional(),
  legalDeposit: z.string().max(40).optional(),
  relectureProgress: z.coerce.number().int().min(0).max(100),
  correctionProgress: z.coerce.number().int().min(0).max(100),
});

const optLabel = z.string().min(1).max(200);
const optUrl = z.string().url().max(500).optional().or(z.literal(""));

/** Admin sends a validation request — always 4 models. */
export const createValidationSchema = z.object({
  dossierId: z.string().min(1),
  kind: z.enum(["CORRECTION", "COVER", "LAYOUT"]),
  title: z.string().min(1).max(200),
  option1Label: optLabel,
  option1Url: optUrl,
  option2Label: optLabel,
  option2Url: optUrl,
  option3Label: optLabel,
  option3Url: optUrl,
  option4Label: optLabel,
  option4Url: optUrl,
});

/** Author responds to a validation request (validate a model or ask changes). */
export const respondValidationSchema = z
  .object({
    requestId: z.string().min(1),
    decision: z.enum(["validate", "changes"]),
    selectedOptionId: z.string().optional(),
    comment: z.string().max(2000).optional(),
  })
  .refine((d) => d.decision !== "validate" || !!d.selectedOptionId, {
    message: "OPTION_REQUIRED",
    path: ["selectedOptionId"],
  });

/** Editor decides on an expired request (delay lapsed). */
export const editorDecideSchema = z.object({
  requestId: z.string().min(1),
  selectedOptionId: z.string().min(1),
});

/** A signed-in user changes their own password (verifying the current one). */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8).max(200),
    confirm: z.string().min(8).max(200),
  })
  .refine((d) => d.newPassword === d.confirm, {
    message: "PASSWORDS_DO_NOT_MATCH",
    path: ["confirm"],
  });

/** Set a password from an activation or reset token. */
export const setPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: z.string().min(8).max(200),
    confirm: z.string().min(8).max(200),
  })
  .refine((d) => d.password === d.confirm, {
    message: "PASSWORDS_DO_NOT_MATCH",
    path: ["confirm"],
  });

export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateDossierInput = z.infer<typeof createDossierSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
