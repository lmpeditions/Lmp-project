import { setRequestLocale, getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { FolderOpen, Users, Ticket, Wallet, BarChart3, HelpCircle } from "lucide-react";

const MODULES: Record<
  string,
  { key: string; icon: typeof Users; features: { fr: string[]; en: string[] } }
> = {
  dossiers: {
    key: "dossiers",
    icon: FolderOpen,
    features: {
      fr: ["Créer un dossier", "Génération N° LMP", "Assigner un responsable", "Modifier les statuts", "Gérer les délais"],
      en: ["Create a case", "Generate LMP number", "Assign a manager", "Update statuses", "Manage deadlines"],
    },
  },
  users: {
    key: "users",
    icon: Users,
    features: {
      fr: ["Super Admin", "Admin", "Manager", "Auteur", "Création / suspension", "Rôles & permissions"],
      en: ["Super Admin", "Admin", "Manager", "Author", "Create / suspend", "Roles & permissions"],
    },
  },
  tickets: {
    key: "tickets",
    icon: Ticket,
    features: {
      fr: ["File d'attente", "Assignation", "Réponses", "Catégories", "SLA"],
      en: ["Queue", "Assignment", "Replies", "Categories", "SLA"],
    },
  },
  payments: {
    key: "payments",
    icon: Wallet,
    features: {
      fr: ["Enregistrer un paiement", "Échéanciers", "Validation", "Justificatifs", "Réclamations"],
      en: ["Record a payment", "Schedules", "Validation", "Receipts", "Disputes"],
    },
  },
  statistics: {
    key: "statistics",
    icon: BarChart3,
    features: {
      fr: ["Revenus", "Dossiers par étape", "Délais moyens", "Taux de complétion", "Export"],
      en: ["Revenue", "Cases by stage", "Average lead times", "Completion rate", "Export"],
    },
  },
};

export const dynamic = "force-dynamic";
export default async function AdminModulePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations("nav");

  const mod = MODULES[slug[0]];
  const lang = (locale === "fr" ? "fr" : "en") as "fr" | "en";
  const note =
    locale === "fr"
      ? "Section du back-office LMP prévue dans la spécification. Elle sera connectée à Supabase (Prisma) à la prochaine itération."
      : "LMP back-office section planned in the specification. It will be connected to Supabase (Prisma) in the next iteration.";

  if (!mod) {
    return (
      <ModulePlaceholder
        title={tNav("dashboard")}
        description={locale === "fr" ? "Section inconnue" : "Unknown section"}
        note={note}
        icon={HelpCircle}
      />
    );
  }

  return (
    <ModulePlaceholder
      title={tNav(mod.key)}
      description={locale === "fr" ? "Back-office LMP" : "LMP Back-office"}
      note={note}
      icon={mod.icon}
      features={mod.features[lang]}
    />
  );
}
