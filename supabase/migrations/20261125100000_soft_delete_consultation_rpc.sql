create or replace function public.soft_delete_consultation(p_consultation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workspace_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select c.workspace_id
    into v_workspace_id
  from public.consultations c
  where c.id = p_consultation_id
    and c.deleted_at is null;

  if v_workspace_id is null then
    raise exception 'Consultation not found or already deleted';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = v_workspace_id
      and wm.user_id = v_user_id
      and wm.deleted_at is null
  ) then
    raise exception 'You are not an active member of this workspace';
  end if;

  update public.vault_documents
     set deleted_at = pg_catalog.now()
   where consultation_id = p_consultation_id
     and workspace_id = v_workspace_id
     and deleted_at is null;

  update public.expenses
     set deleted_at = pg_catalog.now()
   where consultation_id = p_consultation_id
     and workspace_id = v_workspace_id
     and deleted_at is null;

  update public.consultations
     set deleted_at = pg_catalog.now()
   where id = p_consultation_id
     and workspace_id = v_workspace_id
     and deleted_at is null;
end;
$function$;

revoke all on function public.soft_delete_consultation(uuid) from public, anon;
grant execute on function public.soft_delete_consultation(uuid) to authenticated;
