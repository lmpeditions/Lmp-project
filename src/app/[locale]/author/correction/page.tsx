import { redirect } from "next/navigation";

// Relecture & Correction are merged into one view (Lot 3).
export const dynamic = "force-dynamic";
export default async function CorrectionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/author/relecture`);
}
