-- Keep soft-deleted rows visible to their workspace members at the RLS layer.
-- The application filters deleted_at IS NULL in normal list queries. This allows
-- authorized members to update deleted_at for soft-delete and undo operations.

drop policy if exists expenses_select_member on public.expenses;
create policy expenses_select_member
on public.expenses
for select
to authenticated
using (private.is_workspace_member(workspace_id));

drop policy if exists vault_documents_select_member on public.vault_documents;
create policy vault_documents_select_member
on public.vault_documents
for select
to authenticated
using (private.is_workspace_member(workspace_id));
