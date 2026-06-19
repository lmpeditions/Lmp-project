import { cookies } from "next/headers";

/**
 * The author's currently selected book (multi-book quick-switch).
 * Stored in an httpOnly cookie so every Server Component resolves the same
 * "active book" across navigation, broker-style.
 */

export const ACTIVE_BOOK_COOKIE = "lmp_active_book";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function setActiveBook(dossierId: string): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_BOOK_COOKIE, dossierId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function readActiveBookCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACTIVE_BOOK_COOKIE)?.value;
}
