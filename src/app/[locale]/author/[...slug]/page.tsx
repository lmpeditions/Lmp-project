import { setRequestLocale, getTranslations } from "next-intl/server";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import {
  Stamp,
  BookOpen,
  SpellCheck,
  LayoutTemplate,
  Megaphone,
  FolderOpen,
  FileX,
  User,
  HelpCircle,
} from "lucide-react";

/** Catch-all for author modules planned in the spec but not in this MVP. */
const MODULES: Record<
  string,
  { key: string; icon: typeof Stamp; features: { fr: string[]; en: string[] } }
> = {
  isbn: {
    key: "isbn",
    icon: Stamp,
    features: {
      fr: ["Non démarré", "Demande envoyée", "En attente", "ISBN obtenu", "Certificat ISBN", "Dépôt légal"],
      en: ["Not started", "Request sent", "Pending", "ISBN obtained", "ISBN certificate", "Legal deposit"],
    },
  },
  relecture: {
    key: "relecture",
    icon: BookOpen,
    features: {
      fr: ["Première lecture", "Commentaires envoyés", "Validation auteur", "Rapport de relecture"],
      en: ["First read", "Comments sent", "Author validation", "Proofreading report"],
    },
  },
  correction: {
    key: "correction",
    icon: SpellCheck,
    features: {
      fr: ["Orthographe", "Grammaire", "Harmonisation stylistique", "Validation finale"],
      en: ["Spelling", "Grammar", "Style harmonization", "Final validation"],
    },
  },
  "mise-en-page": {
    key: "miseEnPage",
    icon: LayoutTemplate,
    features: {
      fr: ["Préparation du fichier", "Première maquette", "Révisions", "BAT", "PDF intérieur"],
      en: ["File preparation", "First layout", "Revisions", "Proof (BAT)", "Interior PDF"],
    },
  },
  communication: {
    key: "communication",
    icon: Megaphone,
    features: {
      fr: ["Création des visuels", "Communiqué de presse", "Réseaux sociaux", "Calendrier marketing"],
      en: ["Visual creation", "Press release", "Social media", "Marketing calendar"],
    },
  },
  documents: {
    key: "documents",
    icon: FolderOpen,
    features: {
      fr: ["A. Manuscrit", "B. Administratifs", "C. Visuels", "D. Couverture", "E. Contenu", "F. Financiers", "G. Communication"],
      en: ["A. Manuscript", "B. Administrative", "C. Visuals", "D. Cover", "E. Content", "F. Financial", "G. Communication"],
    },
  },
  resiliation: {
    key: "resiliation",
    icon: FileX,
    features: {
      fr: ["Soumission", "Étude du dossier", "Validation / refus", "Clôture administrative"],
      en: ["Submission", "Case review", "Approval / refusal", "Administrative closure"],
    },
  },
  profil: {
    key: "profil",
    icon: User,
    features: {
      fr: ["Informations personnelles", "Préférences", "Sécurité", "Notifications"],
      en: ["Personal information", "Preferences", "Security", "Notifications"],
    },
  },
};

export const dynamic = "force-dynamic";
export default async function AuthorModulePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations("nav");

  const key = slug[0];
  const mod = MODULES[key];
  const lang = (locale === "fr" ? "fr" : "en") as "fr" | "en";

  const note =
    locale === "fr"
      ? "Ce module fait partie de la spécification LMP et sera câblé sur la base de données Supabase lors de la prochaine itération. Les sous-statuts et documents prévus sont listés ci-dessous."
      : "This module is part of the LMP specification and will be wired to the Supabase database in the next iteration. The planned sub-statuses and documents are listed below.";

  if (!mod) {
    return (
      <ModulePlaceholder
        title={tNav("dashboard")}
        description={locale === "fr" ? "Module inconnu" : "Unknown module"}
        note={note}
        icon={HelpCircle}
      />
    );
  }

  return (
    <ModulePlaceholder
      title={tNav(mod.key)}
      description={locale === "fr" ? "Module du portail de suivi éditorial" : "Editorial tracking portal module"}
      note={note}
      icon={mod.icon}
      features={mod.features[lang]}
    />
  );
}
