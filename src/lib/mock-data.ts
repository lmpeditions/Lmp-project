import type {
  AdminPaymentRow,
  AdminStats,
  AdminUser,
  AuthorProfile,
  CommunicationAction,
  CorrectionModule,
  Dossier,
  IsbnModule,
  LayoutModule,
  LibraryDocument,
  NotificationItem,
  ReadingModule,
  TerminationModule,
  TicketMessage,
} from "./types";

/**
 * Mock dossier for the demo author — values taken directly from the
 * LMP "Portail de Suivi Éditorial" specification (#LMP20260001, 62%, DH).
 * In production this is replaced by a Prisma query against Supabase.
 */
export const demoDossier: Dossier = {
  trackingNumber: "#LMP20260001",
  bookTitle: "L'Encre des Silences",
  authorName: "Yasmine El Amrani",
  startDate: "2026-06-01",
  editor: "Karim Benali",
  formula: "Formule Premium",
  estimatedPublication: "2026-11-15",
  globalProgress: 62,
  contractTotal: 25000,
  stages: [
    { type: "contrat", status: "done", progress: 100 },
    { type: "isbn", status: "done", progress: 100 },
    { type: "relecture", status: "done", progress: 100 },
    { type: "correction", status: "inProgress", progress: 40 },
    { type: "couverture", status: "inProgress", progress: 60 },
    { type: "miseEnPage", status: "upcoming", progress: 0 },
    { type: "communication", status: "upcoming", progress: 0 },
    { type: "publication", status: "upcoming", progress: 0 },
  ],
  payments: [
    {
      id: "p1",
      date: "2026-06-10",
      amount: 5000,
      method: "transfer",
      reference: "PAY-001",
      status: "validated",
    },
    {
      id: "p2",
      date: "2026-06-25",
      amount: 10000,
      method: "cash",
      reference: "PAY-002",
      status: "validated",
    },
  ],
  schedule: [
    { id: "s1", dueDate: "2026-07-15", amount: 5000 },
    { id: "s2", dueDate: "2026-08-15", amount: 5000 },
  ],
  tickets: [
    {
      id: "t1",
      ref: "TIC-014",
      subject: "Question sur la maquette de couverture n°2",
      category: "cover",
      status: "inProgress",
      updatedAt: "2026-06-16",
      unread: 1,
    },
    {
      id: "t2",
      ref: "TIC-012",
      subject: "Justificatif du virement PAY-001",
      category: "finance",
      status: "resolved",
      updatedAt: "2026-06-12",
      unread: 0,
    },
    {
      id: "t3",
      ref: "TIC-009",
      subject: "Délai estimé pour la correction stylistique",
      category: "proofreading",
      status: "waiting",
      updatedAt: "2026-06-09",
      unread: 0,
    },
  ],
  coverProposals: [
    {
      id: "c1",
      label: "Proposition A",
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      approved: false,
      current: false,
    },
    {
      id: "c2",
      label: "Proposition B",
      gradient: "from-amber-400 via-orange-500 to-rose-500",
      approved: false,
      current: true,
    },
    {
      id: "c3",
      label: "Proposition C",
      gradient: "from-emerald-400 via-teal-500 to-cyan-600",
      approved: false,
      current: false,
    },
    {
      id: "c4",
      label: "Proposition D",
      gradient: "from-slate-600 via-slate-800 to-zinc-900",
      approved: false,
      current: false,
    },
  ],
  activity: [
    { id: "a1", date: "2026-06-16", label: "Nouvelle maquette de couverture (Proposition B) disponible", type: "cover" },
    { id: "a2", date: "2026-06-15", label: "Réponse à votre ticket TIC-014", type: "ticket" },
    { id: "a3", date: "2026-06-12", label: "Paiement PAY-002 validé (10 000 DH)", type: "payment" },
    { id: "a4", date: "2026-06-10", label: "Étape « Relecture » terminée", type: "stage" },
    { id: "a5", date: "2026-06-08", label: "Rapport de relecture ajouté à vos documents", type: "document" },
  ],
};

/** Aggregated statistics for the LMP back-office dashboard. */
export const adminStats: AdminStats = {
  totalClients: 48,
  clientsNewThisMonth: 6,
  totalProjects: 53,
  inProgress: 31,
  completed: 18,
  revenueCollected: 612000,
  revenuePending: 184000,
  revenueByMonth: [
    { month: "Jan", collected: 62000, pending: 12000 },
    { month: "Fév", collected: 74000, pending: 18000 },
    { month: "Mar", collected: 81000, pending: 22000 },
    { month: "Avr", collected: 69000, pending: 15000 },
    { month: "Mai", collected: 95000, pending: 28000 },
    { month: "Juin", collected: 108000, pending: 31000 },
  ],
  stageDistribution: [
    { stage: "contrat", count: 4 },
    { stage: "isbn", count: 6 },
    { stage: "relecture", count: 8 },
    { stage: "correction", count: 9 },
    { stage: "couverture", count: 7 },
    { stage: "miseEnPage", count: 6 },
    { stage: "communication", count: 5 },
    { stage: "publication", count: 8 },
  ],
  recentActivity: [
    { id: "r1", date: "2026-06-17", label: "Nouveau dossier créé — #LMP20260053 (M. Tahiri)", type: "stage" },
    { id: "r2", date: "2026-06-17", label: "Paiement reçu — 10 000 DH (#LMP20260041)", type: "payment" },
    { id: "r3", date: "2026-06-16", label: "Ticket TIC-014 assigné à K. Benali", type: "ticket" },
    { id: "r4", date: "2026-06-16", label: "BAT validé par l'auteur — #LMP20260029", type: "stage" },
    { id: "r5", date: "2026-06-15", label: "Couverture approuvée — #LMP20260033", type: "cover" },
  ],
  dossiers: [
    { trackingNumber: "#LMP20260001", authorName: "Yasmine El Amrani", bookTitle: "L'Encre des Silences", editor: "K. Benali", progress: 62, status: "inProgress", openTickets: 1 },
    { trackingNumber: "#LMP20260041", authorName: "Omar Tazi", bookTitle: "Les Murmures de l'Atlas", editor: "S. Haddadi", progress: 88, status: "inProgress", openTickets: 0 },
    { trackingNumber: "#LMP20260029", authorName: "Leïla Berrada", bookTitle: "Casablanca, Minuit", editor: "K. Benali", progress: 100, status: "completed", openTickets: 0 },
    { trackingNumber: "#LMP20260033", authorName: "Mehdi Alaoui", bookTitle: "Le Cartographe", editor: "N. Fassi", progress: 74, status: "inProgress", openTickets: 2 },
    { trackingNumber: "#LMP20260047", authorName: "Sofia Naciri", bookTitle: "Grains de Sable", editor: "S. Haddadi", progress: 21, status: "onHold", openTickets: 1 },
    { trackingNumber: "#LMP20260052", authorName: "Rachid Benjelloun", bookTitle: "Le Dernier Conteur", editor: "N. Fassi", progress: 45, status: "inProgress", openTickets: 0 },
  ],
};

/* ------------------------ Author module mock data ------------------------ */

export const isbnModule: IsbnModule = {
  status: "obtained",
  isbn: "978-9920-000-00-1",
  documents: [
    { name: "Certificat ISBN.pdf", date: "2026-06-22", size: "318 Ko" },
    { name: "Dépôt légal.pdf", date: "2026-06-22", size: "210 Ko" },
    { name: "Contrat signé.pdf", date: "2026-06-01", size: "1,2 Mo" },
  ],
  history: [
    { date: "2026-06-12", label: "Dossier ISBN créé" },
    { date: "2026-06-15", label: "Demande envoyée" },
    { date: "2026-06-22", label: "ISBN obtenu" },
  ],
};

export const relectureModule: ReadingModule = {
  state: "authorValidation",
  progress: 75,
  notes: [
    "Première lecture complète effectuée par l'équipe éditoriale.",
    "Cohérence narrative validée — quelques suggestions sur le chapitre 7.",
    "En attente de votre validation des commentaires.",
  ],
  files: [
    { name: "Rapport de relecture.pdf", date: "2026-06-14", size: "640 Ko" },
    { name: "Manuscrit annoté.docx", date: "2026-06-14", size: "2,1 Mo" },
  ],
};

export const correctionModule: CorrectionModule = {
  progress: 40,
  substeps: [
    { key: "spelling", progress: 80 },
    { key: "grammar", progress: 55 },
    { key: "style", progress: 20 },
    { key: "finalValidation", progress: 0 },
  ],
  remarks: [
    "Orthographe : harmonisation des graphies de noms propres en cours.",
    "Grammaire : accords et concordance des temps revus jusqu'au chapitre 9.",
    "Style : recommandations à venir après la passe grammaticale.",
  ],
};

export const miseEnPageModule: LayoutModule = {
  steps: [
    { key: "preparation", status: "done" },
    { key: "firstLayout", status: "inProgress" },
    { key: "revisions", status: "upcoming" },
    { key: "bat", status: "upcoming" },
    { key: "finalValidation", status: "upcoming" },
  ],
  batValidated: false,
  documents: [
    { name: "PDF intérieur — v1.pdf", date: "2026-06-16", size: "5,8 Mo" },
  ],
};

export const communicationActions: CommunicationAction[] = [
  { label: "Création des visuels", status: "inProgress", date: "2026-07-01" },
  { label: "Communiqué de presse", status: "upcoming", date: "2026-09-10" },
  { label: "Campagne réseaux sociaux", status: "planned", date: "2026-10-01" },
  { label: "Interview", status: "confirmed", date: "2026-10-20" },
];

export const documentsLibrary: LibraryDocument[] = [
  { id: "d1", name: "Manuscrit — v3.docx", category: "manuscript", mimeType: "DOCX", size: "2,1 Mo", version: 3, addedBy: "Yasmine El Amrani", date: "2026-06-14", comment: "Version révisée après relecture" },
  { id: "d2", name: "Manuscrit — v2.docx", category: "manuscript", mimeType: "DOCX", size: "2,0 Mo", version: 2, addedBy: "Yasmine El Amrani", date: "2026-06-05" },
  { id: "d3", name: "CIN.pdf", category: "administrative", mimeType: "PDF", size: "420 Ko", version: 1, addedBy: "LMP", date: "2026-06-01" },
  { id: "d4", name: "Contrat signé.pdf", category: "administrative", mimeType: "PDF", size: "1,2 Mo", version: 1, addedBy: "LMP", date: "2026-06-01" },
  { id: "d5", name: "Portrait auteur HD.jpg", category: "visuals", mimeType: "JPG", size: "4,3 Mo", version: 1, addedBy: "Yasmine El Amrani", date: "2026-06-08" },
  { id: "d6", name: "Couverture — Proposition B.png", category: "cover", mimeType: "PNG", size: "3,1 Mo", version: 2, addedBy: "Studio LMP", date: "2026-06-16", comment: "En attente de validation" },
  { id: "d7", name: "Annexes & tableaux.pdf", category: "content", mimeType: "PDF", size: "880 Ko", version: 1, addedBy: "Yasmine El Amrani", date: "2026-06-10" },
  { id: "d8", name: "Reçu PAY-002.pdf", category: "financial", mimeType: "PDF", size: "120 Ko", version: 1, addedBy: "LMP", date: "2026-06-25" },
  { id: "d9", name: "Visuel Instagram.png", category: "communication", mimeType: "PNG", size: "1,4 Mo", version: 1, addedBy: "Studio LMP", date: "2026-07-01" },
];

export const ticketThread: TicketMessage[] = [
  { id: "m1", senderName: "Yasmine El Amrani", side: "author", body: "Bonjour, j'aimerais comprendre les différences entre la maquette n°2 et la n°3 pour la couverture. La typographie change-t-elle ?", date: "2026-06-15T09:12:00", attachments: ["capture-maquette.png"] },
  { id: "m2", senderName: "Karim Benali (LMP)", side: "lmp", body: "Bonjour Yasmine, oui : la maquette n°3 utilise une police sérif plus classique et un fond plus sombre. Je vous joins un comparatif détaillé.", date: "2026-06-15T14:40:00", attachments: ["comparatif.pdf"] },
  { id: "m3", senderName: "Yasmine El Amrani", side: "author", body: "Merci beaucoup, c'est très clair. Je penche pour la n°2 finalement.", date: "2026-06-16T08:05:00" },
];

export const terminationModule: TerminationModule = {
  status: "notStarted",
  steps: [
    { key: "submission", done: false },
    { key: "review", done: false },
    { key: "decision", done: false },
    { key: "closure", done: false },
  ],
};

export const notificationsList: NotificationItem[] = [
  { id: "n1", type: "validation", title: "Validation requise", body: "Une nouvelle maquette de couverture (Proposition B) attend votre approbation.", date: "2026-06-16T10:00:00", read: false },
  { id: "n2", type: "ticket", title: "Réponse à votre ticket", body: "Karim Benali a répondu au ticket TIC-014.", date: "2026-06-15T14:41:00", read: false },
  { id: "n3", type: "stage", title: "Étape terminée", body: "L'étape « Relecture » est désormais terminée.", date: "2026-06-14T16:30:00", read: true },
  { id: "n4", type: "payment", title: "Échéance à venir", body: "Un paiement de 5 000 DH est attendu le 15/07/2026.", date: "2026-06-13T09:00:00", read: true },
  { id: "n5", type: "document", title: "Nouveau document", body: "Le rapport de relecture a été ajouté à vos documents.", date: "2026-06-08T11:20:00", read: true },
];

export const authorProfile: AuthorProfile = {
  name: "Yasmine El Amrani",
  email: "yasmine.elamrani@exemple.ma",
  phone: "+212 6 12 34 56 78",
  address: "Casablanca, Maroc",
  locale: "fr",
  theme: "system",
};

/* ------------------------- Admin module mock data ------------------------ */

export const adminUsers: AdminUser[] = [
  { id: "u1", name: "Sami Idrissi", email: "sami.idrissi@lmp.ma", role: "superAdmin", status: "active", dossierCount: 0, lastActive: "2026-06-17" },
  { id: "u2", name: "Karim Benali", email: "karim.benali@lmp.ma", role: "admin", status: "active", dossierCount: 12, lastActive: "2026-06-17" },
  { id: "u3", name: "Salma Haddadi", email: "salma.haddadi@lmp.ma", role: "manager", status: "active", dossierCount: 9, lastActive: "2026-06-16" },
  { id: "u4", name: "Nadia Fassi", email: "nadia.fassi@lmp.ma", role: "manager", status: "active", dossierCount: 7, lastActive: "2026-06-15" },
  { id: "u5", name: "Yasmine El Amrani", email: "yasmine.elamrani@exemple.ma", role: "author", status: "active", dossierCount: 1, lastActive: "2026-06-17" },
  { id: "u6", name: "Omar Tazi", email: "omar.tazi@exemple.ma", role: "author", status: "active", dossierCount: 1, lastActive: "2026-06-12" },
  { id: "u7", name: "Sofia Naciri", email: "sofia.naciri@exemple.ma", role: "author", status: "suspended", dossierCount: 1, lastActive: "2026-05-28" },
  { id: "u8", name: "Rachid Benjelloun", email: "rachid.benjelloun@exemple.ma", role: "author", status: "invited", dossierCount: 1, lastActive: "—" },
];

export const adminPayments: AdminPaymentRow[] = [
  { id: "ap1", date: "2026-06-25", trackingNumber: "#LMP20260001", authorName: "Yasmine El Amrani", amount: 10000, method: "cash", reference: "PAY-002", status: "validated" },
  { id: "ap2", date: "2026-06-17", trackingNumber: "#LMP20260041", authorName: "Omar Tazi", amount: 10000, method: "transfer", reference: "PAY-041", status: "validated" },
  { id: "ap3", date: "2026-06-16", trackingNumber: "#LMP20260033", authorName: "Mehdi Alaoui", amount: 7500, method: "transfer", reference: "PAY-033", status: "pending" },
  { id: "ap4", date: "2026-06-10", trackingNumber: "#LMP20260001", authorName: "Yasmine El Amrani", amount: 5000, method: "transfer", reference: "PAY-001", status: "validated" },
  { id: "ap5", date: "2026-06-08", trackingNumber: "#LMP20260047", authorName: "Sofia Naciri", amount: 3000, method: "card", reference: "PAY-047", status: "pending" },
];
