import { describe, expect, it } from "vitest";
import { calculateEdd, calculateGestationalAge, daysUntilDue, trimesterForWeek } from "../src/lib/pregnancy";
import { formatDate } from "../src/lib/date";
describe("pregnancy date calculations", () => {
  it("calculates EDD 280 days after LMP", () => expect(calculateEdd("2026-01-01")).toBe("2026-10-08"));
  it("calculates gestational weeks and remaining days", () => expect(calculateGestationalAge("2026-01-01","2026-02-12")).toEqual({ weeks: 6, days: 0, totalDays: 42 }));
  it("returns null before LMP", () => expect(calculateGestationalAge("2026-02-01","2026-01-31")).toBeNull());
  it("uses trimester boundaries", () => {
    expect(trimesterForWeek(13)).toBe(1); expect(trimesterForWeek(14)).toBe(2);
    expect(trimesterForWeek(27)).toBe(2); expect(trimesterForWeek(28)).toBe(3);
  });
  it("formats dates as DD-MM-YYYY in Indian locale", () => expect(formatDate("2026-11-04")).toBe("04-11-2026"));
  it("calculates days to due date without timezone drift", () => expect(daysUntilDue("2026-12-10","2026-12-01")).toBe(9));
});
