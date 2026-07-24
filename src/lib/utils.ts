import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formatira novčani iznos u hrvatskom formatu s EUR valutom.
 * Primjer: 1433.79 → "1.433,79 €"
 */
export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(num)) return currencyFormatter.format(0);
  return currencyFormatter.format(num);
}
