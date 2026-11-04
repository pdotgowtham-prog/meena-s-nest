import { describe, expect, it } from "vitest";
import { authSchema, expenseSchema, inviteSchema, profileSchema, vaultSchema, workspaceSchema } from "../src/lib/validation";
describe("form validation", () => {
  it("validates account credentials", () => {
    expect(authSchema.safeParse({ email: "nope", password: "small" }).success).toBe(false);
    expect(authSchema.safeParse({ email: "partner@example.com", password: "a-strong-password" }).success).toBe(true);
  });
  it("validates workspace names", () => {
    expect(workspaceSchema.safeParse({ name: "x" }).success).toBe(false);
    expect(workspaceSchema.safeParse({ name: "Our little nest" }).success).toBe(true);
  });
  it("rejects implausible LMP and EDD intervals", () => {
    expect(profileSchema.safeParse({ lmp_date: "2026-01-01", due_date: "2026-02-01" }).success).toBe(false);
    expect(profileSchema.safeParse({ lmp_date: "2026-01-01", due_date: "2026-10-08" }).success).toBe(true);
  });
  it("rejects zero and accepts positive expenses", () => {
    expect(expenseSchema.safeParse({ amount: 0, expense_date: "2026-11-04", category: "scan" }).success).toBe(false);
    expect(expenseSchema.safeParse({ amount: 1200, expense_date: "2026-11-04", category: "scan" }).success).toBe(true);
  });
  it("enforces vault type and file-size limits", () => {
    expect(vaultSchema.safeParse({ title: "Report", category: "scan", fileSize: 2048, mimeType: "application/pdf" }).success).toBe(true);
    expect(vaultSchema.safeParse({ title: "Report", category: "scan", fileSize: 11*1024*1024, mimeType: "application/pdf" }).success).toBe(false);
    expect(vaultSchema.safeParse({ title: "Report", category: "scan", fileSize: 2048, mimeType: "text/html" }).success).toBe(false);
  });
  it("validates invitation email", () => {
    expect(inviteSchema.safeParse({ email: "wrong" }).success).toBe(false);
    expect(inviteSchema.safeParse({ email: "partner@example.com" }).success).toBe(true);
  });
});
