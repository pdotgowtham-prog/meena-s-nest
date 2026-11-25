create table if not exists public.memories (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete restrict,
 created_by uuid not null references auth.users(id) on delete restrict,
 memory_date date not null default current_date,
 pregnancy_week integer check (pregnancy_week is null or pregnancy_week between 1 and 45),
 title text not null default '',
 story text not null default '',
 location text,
 mood text,
 storage_path text,
 file_name text,
 mime_type text,
 deleted_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists memories_workspace_date_idx on public.memories(workspace_id,memory_date desc) where deleted_at is null;
alter table public.memories enable row level security;
create policy memories_select_member on public.memories for select to authenticated using(private.is_workspace_member(workspace_id) and deleted_at is null);
create policy memories_insert_member on public.memories for insert to authenticated with check(private.is_workspace_member(workspace_id) and created_by=(select auth.uid()));
create policy memories_update_member on public.memories for update to authenticated using(private.is_workspace_member(workspace_id) and deleted_at is null) with check(private.is_workspace_member(workspace_id));
grant select,insert,update on public.memories to authenticated;
create table if not exists public.memory_comments (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete restrict,
 memory_id uuid not null references public.memories(id) on delete cascade,
 created_by uuid not null references auth.users(id) on delete restrict,
 body text not null check(char_length(body) between 1 and 2000),
 created_at timestamptz not null default now(),
 deleted_at timestamptz
);
create index if not exists memory_comments_memory_idx on public.memory_comments(memory_id,created_at) where deleted_at is null;
alter table public.memory_comments enable row level security;
create policy memory_comments_select_member on public.memory_comments for select to authenticated using(private.is_workspace_member(workspace_id) and deleted_at is null);
create policy memory_comments_insert_member on public.memory_comments for insert to authenticated with check(private.is_workspace_member(workspace_id) and created_by=(select auth.uid()) and exists(select 1 from public.memories m where m.id=memory_comments.memory_id and m.workspace_id=memory_comments.workspace_id and m.deleted_at is null));
grant select,insert on public.memory_comments to authenticated;