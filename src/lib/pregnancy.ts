import { addDaysToDateOnly, parseDateOnly } from "./date";

export type GestationalAge = { weeks: number; days: number; totalDays: number };

export function calculateEdd(lmpDate: string): string {
  return addDaysToDateOnly(lmpDate, 280);
}

export function calculateGestationalAge(lmpDate: string, referenceDate: string): GestationalAge | null {
  const lmp = parseDateOnly(lmpDate).getTime();
  const reference = parseDateOnly(referenceDate).getTime();
  const totalDays = Math.floor((reference - lmp) / 86400000);
  if (!Number.isFinite(totalDays) || totalDays < 0) return null;
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7, totalDays };
}

export function trimesterForWeek(week: number): 1 | 2 | 3 {
  if (week < 14) return 1;
  if (week < 28) return 2;
  return 3;
}

export function daysUntilDue(edd: string, today: string): number {
  return Math.ceil((parseDateOnly(edd).getTime() - parseDateOnly(today).getTime()) / 86400000);
}
