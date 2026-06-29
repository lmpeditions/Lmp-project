"use client";

import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ExportRow {
  trackingNumber: string;
  authorName: string;
  bookTitle: string;
  editor: string;
  progress: number;
  status: string;
  openTickets: number;
}

/** Exports the dossiers table to a UTF-8 CSV (Excel-friendly, ";" separated). */
export function ExportStatsButton({ rows }: { rows: ExportRow[] }) {
  const t = useTranslations("adminStats");
  const tc = useTranslations("admin");

  function escape(v: string | number): string {
    const s = String(v).replace(/"/g, '""');
    return /[";\n]/.test(s) ? `"${s}"` : s;
  }

  function handleExport() {
    const headers = [tc("author"), tc("book"), "#", tc("editor"), `${tc("progress")} %`, tc("status"), tc("openTickets")];
    const lines = rows.map((r) =>
      [r.authorName, r.bookTitle, r.trackingNumber, r.editor, r.progress, r.status, r.openTickets].map(escape).join(";"),
    );
    const csv = [headers.map(escape).join(";"), ...lines].join("\r\n");
    // BOM so Excel renders accents correctly.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LMP-statistiques-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
      <Download className="h-4 w-4" />
      {t("export")}
    </Button>
  );
}
