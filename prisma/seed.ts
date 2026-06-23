import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Seed the LMP portal with demo data matching the specification
 * (#LMP20260001, "L'Encre des Silences", 62%, DH amounts).
 *
 * Run: npm run db:seed   (after db:generate + db:migrate)
 *
 * Default demo password for every account: "demo1234"
 */
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("demo1234", 12);

  // ---- Users ----------------------------------------------------------
  const superAdmin = await prisma.user.upsert({
    where: { email: "sami.idrissi@lmp.ma" },
    update: {},
    create: { email: "sami.idrissi@lmp.ma", name: "Sami Idrissi", role: "SUPER_ADMIN", status: "ACTIVE", passwordHash: password },
  });

  const admin = await prisma.user.upsert({
    where: { email: "karim.benali@lmp.ma" },
    update: {},
    create: { email: "karim.benali@lmp.ma", name: "Karim Benali", role: "ADMIN", status: "ACTIVE", passwordHash: password },
  });

  const manager = await prisma.user.upsert({
    where: { email: "salma.haddadi@lmp.ma" },
    update: {},
    create: { email: "salma.haddadi@lmp.ma", name: "Salma Haddadi", role: "MANAGER", status: "ACTIVE", passwordHash: password },
  });

  const author = await prisma.user.upsert({
    where: { email: "yasmine.elamrani@exemple.ma" },
    update: {},
    create: {
      email: "yasmine.elamrani@exemple.ma",
      name: "Yasmine El Amrani",
      role: "AUTHOR",
      status: "ACTIVE",
      authorNumber: "LMP-2026-0001",
      phone: "+212 6 12 34 56 78",
      address: "Casablanca, Maroc",
      passwordHash: password,
    },
  });

  // ---- Demo dossier ---------------------------------------------------
  const dossier = await prisma.dossier.upsert({
    where: { trackingNumber: "#LMP20260001" },
    update: {},
    create: {
      trackingNumber: "#LMP20260001",
      bookTitle: "L'Encre des Silences",
      formula: "Formule Premium",
      status: "IN_PROGRESS",
      globalProgress: 62,
      contractTotal: 25000,
      startDate: new Date("2026-06-01"),
      estimatedPublication: new Date("2026-11-15"),
      authorId: author.id,
      managerId: admin.id,
    },
  });

  // ---- Stages ----------------------------------------------------------
  const stages: {
    type: "CONTRAT" | "ISBN" | "RELECTURE" | "CORRECTION" | "COUVERTURE" | "MISE_EN_PAGE" | "COMMUNICATION" | "PUBLICATION";
    status: "DONE" | "IN_PROGRESS" | "UPCOMING";
    progress: number;
    order: number;
  }[] = [
    { type: "CONTRAT", status: "DONE", progress: 100, order: 0 },
    { type: "ISBN", status: "DONE", progress: 100, order: 1 },
    { type: "RELECTURE", status: "DONE", progress: 100, order: 2 },
    { type: "CORRECTION", status: "IN_PROGRESS", progress: 40, order: 3 },
    { type: "COUVERTURE", status: "IN_PROGRESS", progress: 60, order: 4 },
    { type: "MISE_EN_PAGE", status: "UPCOMING", progress: 0, order: 5 },
    { type: "COMMUNICATION", status: "UPCOMING", progress: 0, order: 6 },
    { type: "PUBLICATION", status: "UPCOMING", progress: 0, order: 7 },
  ];
  for (const s of stages) {
    await prisma.stage.upsert({
      where: { dossierId_type: { dossierId: dossier.id, type: s.type } },
      update: { status: s.status, progress: s.progress, order: s.order },
      create: { dossierId: dossier.id, ...s },
    });
  }

  // ---- Payments & schedule -------------------------------------------
  await prisma.payment.deleteMany({ where: { dossierId: dossier.id } });
  await prisma.payment.createMany({
    data: [
      { dossierId: dossier.id, date: new Date("2026-06-10"), amount: 5000, method: "TRANSFER", reference: "PAY-001", status: "VALIDATED" },
      { dossierId: dossier.id, date: new Date("2026-06-25"), amount: 10000, method: "CASH", reference: "PAY-002", status: "VALIDATED" },
    ],
  });
  await prisma.paymentSchedule.deleteMany({ where: { dossierId: dossier.id } });
  await prisma.paymentSchedule.createMany({
    data: [
      { dossierId: dossier.id, dueDate: new Date("2026-07-15"), amount: 5000 },
      { dossierId: dossier.id, dueDate: new Date("2026-08-15"), amount: 5000 },
    ],
  });

  // ---- Documents ------------------------------------------------------
  await prisma.document.deleteMany({ where: { dossierId: dossier.id } });
  await prisma.document.createMany({
    data: [
      { dossierId: dossier.id, name: "Manuscrit — v3.docx", category: "MANUSCRIPT", mimeType: "DOCX", sizeLabel: "2,1 Mo", url: "#", version: 3, uploadedById: author.id, comment: "Version révisée après relecture" },
      { dossierId: dossier.id, name: "Contrat signé.pdf", category: "ADMINISTRATIVE", mimeType: "PDF", sizeLabel: "1,2 Mo", url: "#", version: 1, uploadedById: admin.id },
      { dossierId: dossier.id, name: "Certificat ISBN.pdf", category: "ADMINISTRATIVE", mimeType: "PDF", sizeLabel: "318 Ko", url: "#", version: 1, uploadedById: admin.id },
      { dossierId: dossier.id, name: "Couverture — Proposition B.png", category: "COVER", mimeType: "PNG", sizeLabel: "3,1 Mo", url: "#", version: 2, uploadedById: admin.id, comment: "En attente de validation" },
    ],
  });

  // ---- Ticket + messages ---------------------------------------------
  const ticket = await prisma.ticket.upsert({
    where: { ref: "TIC-014" },
    update: {},
    create: {
      ref: "TIC-014",
      dossierId: dossier.id,
      subject: "Question sur la maquette de couverture n°2",
      category: "COVER",
      status: "IN_PROGRESS",
      authorId: author.id,
      assigneeId: admin.id,
    },
  });
  await prisma.ticketMessage.deleteMany({ where: { ticketId: ticket.id } });
  await prisma.ticketMessage.createMany({
    data: [
      { ticketId: ticket.id, senderId: author.id, body: "Bonjour, j'aimerais comprendre les différences entre la maquette n°2 et la n°3." },
      { ticketId: ticket.id, senderId: admin.id, body: "Bonjour Yasmine, la n°3 utilise une police sérif et un fond plus sombre. Comparatif joint." },
    ],
  });

  // ---- Notifications --------------------------------------------------
  await prisma.notification.deleteMany({ where: { userId: author.id } });
  await prisma.notification.createMany({
    data: [
      { userId: author.id, dossierId: dossier.id, type: "VALIDATION", title: "Validation requise", body: "Une nouvelle maquette de couverture attend votre approbation." },
      { userId: author.id, dossierId: dossier.id, type: "TICKET", title: "Réponse à votre ticket", body: "Karim Benali a répondu au ticket TIC-014." },
    ],
  });

  // ---- Settings -------------------------------------------------------
  await prisma.setting.upsert({
    where: { key: "general" },
    update: {},
    create: { key: "general", value: { orgName: "Les Manuscrits Publiés (LMP)", defaultLocale: "FR", defaultTheme: "SYSTEM" } },
  });

  console.log("✓ Seed complete.");
  console.log("  Super Admin : sami.idrissi@lmp.ma / demo1234");
  console.log("  Admin       : karim.benali@lmp.ma / demo1234");
  console.log("  Manager     : salma.haddadi@lmp.ma / demo1234");
  console.log("  Author      : yasmine.elamrani@exemple.ma / demo1234 (n° LMP-2026-0001)");
  // Reference unused vars so linters stay quiet.
  void superAdmin;
  void manager;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
