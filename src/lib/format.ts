import type { Order, Payment } from "../data/types";

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

export const paid = (o: Order) =>
  o.payments.reduce((s, p) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);

export const balance = (o: Order) => Math.max(0, o.price - paid(o));

/** Whole days from today until the given date (negative = overdue). */
export function daysUntil(iso: string): number {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(iso); b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function dueLabel(iso: string): string {
  const d = daysUntil(iso);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `${d}d left`;
}

/** Measurements older than ~2 months want a refresh (from the notes). */
export function measurementStale(iso: string): boolean {
  return daysUntil(iso) < -60;
}

export const sumPayments = (ps: Payment[]) =>
  ps.reduce((s, p) => s + (p.kind === "refund" ? -p.amount : p.amount), 0);

/** Keep only digits, capped at a 10-digit Indian mobile number. */
export const phoneDigits = (s: string) => s.replace(/\D/g, "").slice(0, 10);

/** Format a local number for display as "98110 20304". */
export const phoneLocal = (s: string) => {
  const d = phoneDigits(s);
  return d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;
};

/** Store form: "+91 98110 20304", or "" when nothing valid was entered. */
export const phoneIntl = (s: string) => {
  const d = phoneDigits(s);
  return d ? `+91 ${phoneLocal(d)}` : "";
};

/* A measurement value: a number (optional half/decimal) with an optional
   unit (" / in / cm), optionally a range like 34"-36". */
const MEASURE_ONE = /^\d{1,3}(\.\d{1,2})?\s?(?:"|''|in|inch(?:es)?|cm)?$/i;
export const isMeasureValue = (v: string) => {
  const s = v.trim();
  if (!s) return false;
  return s.split(/\s*-\s*/).every(p => MEASURE_ONE.test(p.trim()));
};
