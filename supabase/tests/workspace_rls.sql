-- Run with Supabase CLI: supabase test db
begin;
do $$
declare t text; missing text[] := '{}';
begin
  foreach t in array array['workspaces','workspace_members','workspace_invites','pregnancy_profiles','vault_documents','expenses'] loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=t and c.relrowsecurity
    ) then missing := array_append(missing,t); end if;
  end loop;
  if cardinality(missing)>0 then raise exception 'RLS disabled on: %',array_to_string(missing,', '); end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='expenses' and policyname='expenses_select_member') then
    raise exception 'Expenses membership read policy missing';
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='vault_documents' and policyname='vault_documents_select_member') then
    raise exception 'Vault membership read policy missing';
  end if;
end $$;
rollback;
