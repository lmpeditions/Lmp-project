import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side file storage on Supabase Storage.
 *
 * Uses the service_role key (never exposed to the browser). If the storage
 * env vars are not set, `isStorageConfigured()` returns false and the upload
 * route degrades gracefully (the UI falls back to pasting a link), so the app
 * keeps working until the keys + bucket are provisioned.
 *
 * Required env (server-only):
 *   SUPABASE_URL                 e.g. https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    Project Settings → API → service_role
 *   SUPABASE_STORAGE_BUCKET      optional, defaults to "lmp-files"
 */

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "lmp-files";

export function isStorageConfigured(): boolean {
  return Boolean(URL && KEY);
}

let client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!URL || !KEY) throw new Error("STORAGE_NOT_CONFIGURED");
  if (!client) client = createClient(URL, KEY, { auth: { persistSession: false } });
  return client;
}

/** Sanitize a filename to a safe, storage-friendly key segment. */
function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "fichier";
  return `${base}${ext}`;
}

export interface UploadResult {
  url: string;
  path: string;
  name: string;
}

/**
 * Upload a file to the bucket under `folder/`. Returns a public URL.
 * The bucket must exist and be public (or front the URL with a signed URL).
 */
export async function uploadFile(
  file: File,
  folder = "uploads",
): Promise<UploadResult> {
  const supabase = getClient();
  const original = file.name || "fichier";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName(original)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(`UPLOAD_FAILED: ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, name: original };
}
