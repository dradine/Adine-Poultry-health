-- Reference flock records remain separate from serology snapshots.
-- This migration is intentionally additive and does not backfill or overwrite existing rows.
create table public.flock_vaccination_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  flock_id uuid not null references public.flocks(id) on delete cascade,
  event_date date not null,
  age_days integer check (age_days is null or (age_days >= 0 and age_days <= 500)),
  disease_code text not null references public.diseases(code),
  product_name text not null,
  product_id uuid references public.vaccine_products(id),
  platform text not null,
  strain text,
  route text not null,
  dose text,
  coverage_percent numeric check (coverage_percent is null or (coverage_percent >= 0 and coverage_percent <= 100)),
  administration_quality text,
  batch_lot text,
  source_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flock_clinical_observations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  flock_id uuid not null references public.flocks(id) on delete cascade,
  observed_at date not null,
  status text not null,
  signs text,
  morbidity_percent numeric check (morbidity_percent is null or (morbidity_percent >= 0 and morbidity_percent <= 100)),
  mortality_percent numeric check (mortality_percent is null or (mortality_percent >= 0 and mortality_percent <= 100)),
  mortality_trend text,
  feed_intake text,
  water_intake text,
  production_change text,
  necropsy text,
  direct_tests text,
  medications text,
  exposure_risks text,
  clinical_course text,
  source_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flock_time_series (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  flock_id uuid not null references public.flocks(id) on delete cascade,
  observed_at date not null,
  metric text not null check (metric in ('water','feed','weight','egg_production','mortality','temperature','humidity')),
  value numeric not null,
  unit text not null,
  source_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flock_audit_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  flock_id uuid not null references public.flocks(id) on delete cascade,
  entity_type text not null check (entity_type in ('flock','vaccination_event','clinical_observation','time_series','serology_round','model_run')),
  entity_id uuid not null,
  action text not null check (action in ('create','update','delete','restore','conflict')),
  reason text,
  before_snapshot jsonb,
  after_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index flock_vaccination_events_flock_date_idx on public.flock_vaccination_events(flock_id, event_date desc);
create index flock_clinical_observations_flock_date_idx on public.flock_clinical_observations(flock_id, observed_at desc);
create index flock_time_series_flock_metric_date_idx on public.flock_time_series(flock_id, metric, observed_at desc);
create index flock_audit_events_flock_date_idx on public.flock_audit_events(flock_id, created_at desc);
-- RLS and sync list queries filter by owner_id; keep owner-scoped scans indexable.
create index flock_vaccination_events_owner_id_id_idx on public.flock_vaccination_events(owner_id, id);
create index flock_clinical_observations_owner_id_id_idx on public.flock_clinical_observations(owner_id, id);
create index flock_time_series_owner_id_id_idx on public.flock_time_series(owner_id, id);
create index flock_audit_events_owner_created_at_idx on public.flock_audit_events(owner_id, created_at desc);

do $$
declare t text;
begin
  foreach t in array array['flock_vaccination_events','flock_clinical_observations','flock_time_series','flock_audit_events'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id = (select auth.uid()))', t || '_select_own', t);
    -- Writes are deliberately available only through the audited SECURITY DEFINER RPC
    -- introduced by the following migration; do not grant direct table mutations.
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;

drop trigger if exists flock_vaccination_events_set_updated_at on public.flock_vaccination_events;
create trigger flock_vaccination_events_set_updated_at before update on public.flock_vaccination_events for each row execute function public.set_updated_at();
drop trigger if exists flock_clinical_observations_set_updated_at on public.flock_clinical_observations;
create trigger flock_clinical_observations_set_updated_at before update on public.flock_clinical_observations for each row execute function public.set_updated_at();
drop trigger if exists flock_time_series_set_updated_at on public.flock_time_series;
create trigger flock_time_series_set_updated_at before update on public.flock_time_series for each row execute function public.set_updated_at();
