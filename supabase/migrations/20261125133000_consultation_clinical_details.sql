alter table public.consultations
  add column if not exists day_brief text,
  add column if not exists blood_pressure text,
  add column if not exists weight_kg numeric(6,2),
  add column if not exists fetal_heart_rate integer,
  add column if not exists medicines jsonb not null default '[]'::jsonb;
