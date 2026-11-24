import { z } from "zod";
export const authSchema = z.object({ email: z.string().trim().email("Enter a valid email address.").max(254), password: z.string().min(8, "Use at least 8 characters.") });
export const workspaceSchema = z.object({ name: z.string().trim().min(2, "Please enter at least 2 characters.").max(80) });
export const profileSchema = z.object({
  lmp_date: z.string().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  baby_name: z.string().trim().max(80).optional(),
  notes: z.string().max(4000).optional()
}).refine((value) => {
  if (!value.lmp_date || !value.due_date) return true;
  const lmp = new Date(value.lmp_date + "T12:00:00Z").getTime();
  const due = new Date(value.due_date + "T12:00:00Z").getTime();
  const days = (due - lmp) / 86400000;
  return days >= 230 && days <= 310;
}, { message: "EDD should be within a clinically plausible 230–310 day range from LMP.", path: ["due_date"] });
export const expenseSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than zero.").max(99999999.99),
  expense_date: z.string().min(1, "Choose a date."),
  category: z.enum(["consultation","scan","lab_test","medicine","travel","nutrition","baby_items","insurance","other"]),
  merchant: z.string().trim().max(140).optional(),
  description: z.string().trim().max(1000).optional()
});
export const inviteSchema = z.object({ email: z.string().trim().email("Enter a valid email address.").max(254) });
export const vaultSchema = z.object({
  title: z.string().trim().min(1, "Add a document title.").max(140),
  category: z.enum(["scan","lab_report","prescription","insurance","discharge_summary","other"]),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024, "Files must be 10 MB or smaller."),
  mimeType: z.enum(["application/pdf","image/jpeg","image/png","image/webp","image/heic","image/heif"])
});
