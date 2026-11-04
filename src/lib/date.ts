import { APP_TIME_ZONE } from "../constants/app";
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}
export function addDaysToDateOnly(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0");
}
export function formatDate(value: string | null | undefined): string {
  if (!value) return "Not set";
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: APP_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric" }).formatToParts(parseDateOnly(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return get("day") + "-" + get("month") + "-" + get("year");
}
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
export function localToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return get("year") + "-" + get("month") + "-" + get("day");
}
