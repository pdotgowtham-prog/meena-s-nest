export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Audit = {
  created_at: string;
  updated_at: string;
  created_by: string;
  deleted_at: string | null;
};
type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      workspaces: Table<
        { id: string; name: string; owner_user_id: string } & Omit<Audit, "deleted_at"> & { deleted_at: string | null },
        { id?: string; name: string; owner_user_id: string; created_by: string; created_at?: string; updated_at?: string; deleted_at?: string | null }
      >;
      workspace_members: Table<
        { workspace_id: string; user_id: string; role: "owner" | "partner" } & Audit,
        { workspace_id: string; user_id: string; role: "owner" | "partner"; created_by: string; created_at?: string; updated_at?: string; deleted_at?: string | null }
      >;
      workspace_invites: Table<
        { id: string; workspace_id: string; invited_email: string; token_hash: string; role: "partner"; invited_by: string; expires_at: string; accepted_at: string | null } & Audit,
        { id?: string; workspace_id: string; invited_email: string; token_hash: string; role?: "partner"; invited_by: string; expires_at: string; accepted_at?: string | null; created_by: string; created_at?: string; updated_at?: string; deleted_at?: string | null }
      >;
      pregnancy_profiles: Table<
        { id: string; workspace_id: string; lmp_date: string | null; due_date: string | null; baby_name: string | null; notes: string | null } & Audit,
        { id?: string; workspace_id: string; lmp_date?: string | null; due_date?: string | null; baby_name?: string | null; notes?: string | null; created_by: string; created_at?: string; updated_at?: string; deleted_at?: string | null }
      >;
      vault_documents: Table<
        { id: string; workspace_id: string; title: string; category: string; file_name: string; storage_path: string; mime_type: string; size_bytes: number; document_date: string | null; notes: string | null } & Audit,
        { id?: string; workspace_id: string; title: string; category: string; file_name: string; storage_path: string; mime_type: string; size_bytes: number; document_date?: string | null; notes?: string | null; created_by: string; created_at?: string; updated_at?: string; deleted_at?: string | null }
      >;
      consultations: Table<
        { id: string; workspace_id: string; consultation_date: string; pregnancy_week: number | null; doctor_name: string | null; speciality: string | null; hospital: string | null; reason: string | null; notes: string | null; advice: string | null; follow_up_date: string | null; fee_amount: number | null; payment_method: string | null } & Audit,
        { id?: string; workspace_id: string; consultation_date?: string; pregnancy_week?: number | null; doctor_name?: string | null; speciality?: string | null; hospital?: string | null; reason?: string | null; notes?: string | null; advice?: string | null; follow_up_date?: string | null; fee_amount?: number | null; payment_method?: string | null; created_by: string; created_at?: string; updated_at?: string; deleted_at?: string | null }
      >;
      expenses: Table<
        { id: string; workspace_id: string; expense_date: string; amount: number; currency: string; category: string; merchant: string | null; description: string | null; document_id: string | null } & Audit,
        { id?: string; workspace_id: string; expense_date?: string; amount: number; currency?: "INR"; category: string; merchant?: string | null; description?: string | null; document_id?: string | null; created_by: string; created_at?: string; updated_at?: string; deleted_at?: string | null }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      create_workspace: { Args: { p_name: string }; Returns: string };
      accept_workspace_invite: { Args: { p_token: string }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
