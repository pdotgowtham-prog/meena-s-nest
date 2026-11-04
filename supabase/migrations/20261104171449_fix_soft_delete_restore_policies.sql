-- Allow active workspace members to update active or soft-deleted rows.
-- This is required for both soft-delete (set deleted_at) and Undo (clear deleted_at).
-- The normal app list queries still filter out deleted_at IS NOT NULL rows.

drop policy if exists expenses_update_member on public.expenses;
create policy expenses_update_member
on public.expenses
for update
to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));

drop policy if exists vault_documents_update_member on public.vault_documents;
create policy vault_documents_update_member
on public.vault_documents
for update
to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
