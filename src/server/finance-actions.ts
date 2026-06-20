"use server";

import { prisma } from "./prisma";
import { requirePermission, requireSession, assertDossierAccess, AuthError } from "./rbac";
import { notify } from "./notifications";
import { audit } from "./audit";
import {
  recordPaymentSchema,
  uploadInvoiceSchema,
  ledgerEntrySchema,
  financingStrategySchema,
} from "./validators";

export interface FinanceActionState {
  error?: "validation" | "forbidden" | "server";
  ok?: boolean;
}

/** Admin records a payment — an invoice (link) is mandatory. */
export async function recordPaymentAction(
  _prev: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  let session;
  try {
    session = await requirePermission("payment.manage");
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const parsed = recordPaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;
  try {
    await prisma.payment.create({
      data: {
        dossierId: d.dossierId,
        date: d.date,
        amount: d.amount,
        method: d.method,
        reference: d.reference,
        status: "VALIDATED",
        invoiceUrl: d.invoiceUrl,
      },
    });
    const dossier = await prisma.dossier.findUnique({ where: { id: d.dossierId }, select: { authorId: true } });
    if (dossier) {
      await notify({
        userId: dossier.authorId,
        dossierId: d.dossierId,
        type: "PAYMENT",
        title: "Paiement enregistré",
        body: `Un paiement de ${d.amount} DH a été enregistré sur votre dossier.`,
        email: false,
      });
    }
    await audit({ actorId: session.sub, dossierId: d.dossierId, action: "payment.recorded", entity: "Payment" });
    return { ok: true };
  } catch (e) {
    console.error("[recordPaymentAction]", e);
    return { error: "server" };
  }
}

/** Author uploads a cash-payment invoice → PENDING, awaiting admin confirmation. */
export async function uploadInvoiceAction(
  _prev: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const dossierId = String(formData.get("dossierId") || "");
  let session;
  try {
    session = await assertDossierAccess(dossierId);
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const parsed = uploadInvoiceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;
  try {
    await prisma.payment.create({
      data: {
        dossierId,
        date: new Date(),
        amount: d.amount,
        method: "CASH",
        reference: d.reference || `FACTURE-${Date.now().toString().slice(-6)}`,
        status: "PENDING",
        invoiceUrl: d.invoiceUrl,
        uploadedById: session.sub,
      },
    });
    const dossier = await prisma.dossier.findUnique({ where: { id: dossierId }, select: { managerId: true } });
    if (dossier?.managerId) {
      await notify({
        userId: dossier.managerId,
        dossierId,
        type: "PAYMENT",
        title: "Facture à vérifier",
        body: `L'auteur a téléversé une facture de ${d.amount} DH (espèces) à confirmer.`,
        email: false,
      });
    }
    return { ok: true };
  } catch (e) {
    console.error("[uploadInvoiceAction]", e);
    return { error: "server" };
  }
}

/** Admin confirms an author-uploaded cash payment (plain form action). */
export async function confirmPaymentAction(formData: FormData): Promise<void> {
  let session;
  try {
    session = await requirePermission("payment.manage");
  } catch (e) {
    if (e instanceof AuthError) return;
    throw e;
  }
  const paymentId = String(formData.get("paymentId") || "");
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PENDING") return;
  await prisma.payment.update({ where: { id: paymentId }, data: { status: "VALIDATED" } });
  const dossier = await prisma.dossier.findUnique({ where: { id: payment.dossierId }, select: { authorId: true } });
  if (dossier) {
    await notify({
      userId: dossier.authorId,
      dossierId: payment.dossierId,
      type: "PAYMENT",
      title: "Paiement confirmé",
      body: `Votre paiement de ${payment.amount} DH a été confirmé.`,
      email: false,
    });
  }
  await audit({ actorId: session.sub, dossierId: payment.dossierId, action: "payment.confirmed", entity: "Payment" });
}

/** Admin adds a financial movement (entrée / sortie). */
export async function addLedgerEntryAction(
  _prev: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  let session;
  try {
    session = await requirePermission("payment.manage");
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const parsed = ledgerEntrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;
  try {
    await prisma.ledgerEntry.create({
      data: { dossierId: d.dossierId, direction: d.direction, amount: d.amount, label: d.label, date: d.date, createdById: session.sub },
    });
    const dossier = await prisma.dossier.findUnique({ where: { id: d.dossierId }, select: { authorId: true } });
    if (dossier) {
      await notify({
        userId: dossier.authorId,
        dossierId: d.dossierId,
        type: "PAYMENT",
        title: d.direction === "IN" ? "Entrée enregistrée" : "Sortie enregistrée",
        body: `${d.direction === "IN" ? "+" : "-"}${d.amount} DH — ${d.label}`,
        email: false,
      });
    }
    await audit({ actorId: session.sub, dossierId: d.dossierId, action: "ledger.added", entity: "LedgerEntry" });
    return { ok: true };
  } catch (e) {
    console.error("[addLedgerEntryAction]", e);
    return { error: "server" };
  }
}

/** Admin sets the financing strategy (replaces the previous value, no stacking). */
export async function setFinancingStrategyAction(
  _prev: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  let session;
  try {
    session = await requirePermission("dossier.write");
  } catch (e) {
    if (e instanceof AuthError) return { error: "forbidden" };
    throw e;
  }
  const parsed = financingStrategySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "validation" };
  try {
    await prisma.dossier.update({
      where: { id: parsed.data.dossierId },
      data: { financingStrategy: parsed.data.strategy || null },
    });
    await audit({ actorId: session.sub, dossierId: parsed.data.dossierId, action: "financing.updated", entity: "Dossier" });
    return { ok: true };
  } catch (e) {
    console.error("[setFinancingStrategyAction]", e);
    return { error: "server" };
  }
}
