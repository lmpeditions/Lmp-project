import { NextResponse } from "next/server";
import { requireSession, AuthError } from "@/server/rbac";
import { isStorageConfigured, uploadFile } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "text/plain",
]);

const FOLDERS = new Set(["documents", "invoices", "covers", "attachments", "uploads"]);

/** Authenticated file upload → Supabase Storage. Returns { url, name }. */
export async function POST(req: Request) {
  try {
    await requireSession();
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    throw e;
  }

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "storage_not_configured" }, { status: 503 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const folderRaw = String(form.get("folder") || "uploads");
  const folder = FOLDERS.has(folderRaw) ? folderRaw : "uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "type_not_allowed" }, { status: 400 });
  }

  try {
    const { url, name } = await uploadFile(file, folder);
    return NextResponse.json({ url, name });
  } catch (e) {
    console.error("[api/upload]", e);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
