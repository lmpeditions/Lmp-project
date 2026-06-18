import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names while resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an amount in Moroccan Dirham (DH), the LMP contract currency. */
export function formatDH(amount: number, locale: string = "fr") {
  return new Intl.NumberFormat(locale === "fr" ? "fr-MA" : "en-MA", {
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format an ISO date string for display. */
export function formatDate(iso: string, locale: string = "fr") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
