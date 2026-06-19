import { z } from "zod";

/**
 * Zod schemas — the single source of truth for input validation on every
 * Server Action and Route Handler (defends against malformed/malicious input).
 */

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
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
  amount: z.number().int().positive(),
  method: z.enum(["TRANSFER", "CASH", "CARD"]),
  reference: z.string().min(1).max(100),
});

export const createTicketSchema = z.object({
  dossierId: z.string(),
  subject: z.string().min(1).max(300),
  category: z.enum([
    "GENERAL",
    "COMPLAINT",
    "FINANCE",
    "PROOFREADING",
    "COVER",
    "COMMUNICATION",
    "TECHNICAL",
    "TERMINATION",
  ]),
  body: z.string().min(1).max(5000),
});

export const ticketReplySchema = z.object({
  ticketId: z.string(),
  body: z.string().min(1).max(5000),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  locale: z.enum(["FR", "EN"]).optional(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "AUTHOR"]),
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

/** Author starts a new book from the onboarding page. */
export const createBookSchema = z.object({
  bookTitle: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
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
