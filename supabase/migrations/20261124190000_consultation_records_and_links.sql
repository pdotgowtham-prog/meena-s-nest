create table public.consultations (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete restrict,
 created_by uuid not null references auth.users(id) on delete restrict,
 consultation_date date not null default current_date,
 pregnancy_week integer check (pregnancy_week is null or pregnancy_week between 1 and 45),
 doctor_name text check (doctor_name is null or char_length(doctor_name) <= 140),
 speciality text check (speciality is null or char_length(speciality) <= 100),
 hospital text check (hospital is null or char_length(hospital) <= 180),
 reason text check (reason is null or char_length(reason) <= 1000),
 notes text check (notes is null or char_length(notes) <= 4000),
 advice text check (advice is null or char_length(advice) <= 4000),
 follow_up_date date,
 fee_amount numeric(12,2) check (fee_amount is null or (fee_amount >= 0 and fee_amount <= 99999999.99)),
 payment_method text check (payment_method is null or payment_method in ('cash','upi','card','insurance','other')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 deleted_at timestamptz,
 constraint consultations_id_workspace_unique unique(id, workspace_id)
);
alter table public.expenses add column consultation_id uuid;
alter table public.expenses add constraint expenses_consultation_same_workspace
 foreign key (consultation_id, workspace_id) references public.consultations(id, workspace_id) on delete restrict;
alter table public.vault_documents add column consultation_id uuid;
alter table public.vault_documents add constraint vault_documents_consultation_same_workspace
 foreign key (consultation_id, workspace_id) references public.consultations(id, workspace_id) on delete restrict;
create index consultations_workspace_date_idx on public.consultations(workspace_id, consultation_date desc) where deleted_at is null;
create index expenses_consultation_idx on public.expenses(consultation_id) where consultation_id is not null and deleted_at is null;
create index vault_documents_consultation_idx on public.vault_documents(consultation_id) where consultation_id is not null and deleted_at is null;
create trigger consultations_set_updated_at before update on public.consultations for each row execute function private.set_updated_at();
alter table public.consultations enable row level security;
create policy consultations_select_member on public.consultations for select to authenticated using(private.is_workspace_member(workspace_id) and deleted_at is null);
create policy consultations_insert_member on public.consultations for insert to authenticated with check(private.is_workspace_member(workspace_id) and created_by=(select auth.uid()));
create policy consultations_update_member on public.consultations for update to authenticated using(private.is_workspace_member(workspace_id) and deleted_at is null) with check(private.is_workspace_member(workspace_id));
grant select,insert,update on public.consultations to authenticated;
