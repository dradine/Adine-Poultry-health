create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.diseases (
  code text primary key,
  name_fa text not null,
  name_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.diseases (code, name_fa, name_en) values
 ('IBD','گامبورو','Infectious Bursal Disease'),
 ('ND','نیوکاسل','Newcastle Disease'),
 ('IBV','برونشیت عفونی','Infectious Bronchitis'),
 ('AIV','آنفلوانزای طیور','Avian Influenza')
on conflict (code) do nothing;

create table public.assay_kits (
  id uuid primary key default gen_random_uuid(),
  disease_code text not null references public.diseases(code),
  manufacturer text not null,
  kit_name text not null,
  catalog_number text,
  assay_type text not null check (assay_type in ('ELISA','HI','VN','OTHER')),
  protocol_version text,
  breakthrough_titer numeric,
  breakthrough_unit text,
  formula_spec jsonb not null default '{}'::jsonb,
  source_document text,
  source_version text,
  validation_status text not null default 'unverified'
    check (validation_status in ('unverified','documented','locally_validated','retired')),
  created_at timestamptz not null default now(),
  unique (manufacturer, catalog_number, protocol_version)
);

create table public.vaccine_products (
  id uuid primary key default gen_random_uuid(),
  disease_code text not null references public.diseases(code),
  manufacturer text not null,
  product_name text not null,
  platform text not null check (platform in ('live','inactivated','immune_complex','vector_hvt','vector_ndv','vector_fpv','other')),
  strain text,
  breakthrough_titer numeric,
  breakthrough_unit text,
  model_family text not null default 'custom',
  source_document text,
  source_version text,
  validation_status text not null default 'unverified'
    check (validation_status in ('unverified','documented','locally_validated','retired')),
  created_at timestamptz not null default now()
);

create table public.flocks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  flock_name text not null,
  species text not null default 'broiler',
  breed text,
  hatch_date date,
  placement_date date not null,
  bird_count integer check (bird_count is null or bird_count > 0),
  location_label text,
  timezone text not null default 'Asia/Tehran',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.serology_batches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  flock_id uuid not null references public.flocks(id) on delete cascade,
  disease_code text not null references public.diseases(code),
  assay_kit_id uuid references public.assay_kits(id),
  assay_type text not null check (assay_type in ('ELISA','HI','VN','OTHER')),
  sampling_date date not null,
  sampling_age_days numeric not null check (sampling_age_days >= 0),
  sample_count integer not null check (sample_count > 0),
  laboratory_name text,
  kit_lot text,
  plate_id text,
  protocol_metadata jsonb not null default '{}'::jsonb,
  qc_status text not null default 'pending'
    check (qc_status in ('pending','pass','fail','review')),
  qc_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.serology_results (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  batch_id uuid not null references public.serology_batches(id) on delete cascade,
  sample_code text not null,
  raw_od numeric,
  sp_ratio numeric,
  sn_ratio numeric,
  reported_titer numeric,
  titer_log2 numeric,
  result_status text not null default 'numeric'
    check (result_status in ('numeric','below_lod','above_uloq','invalid','missing')),
  raw_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (batch_id, sample_code)
);

create table public.model_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  flock_id uuid not null references public.flocks(id) on delete cascade,
  disease_code text not null references public.diseases(code),
  model_version text not null,
  model_family text not null,
  input_snapshot jsonb not null,
  output_snapshot jsonb not null,
  confidence_level text not null default 'insufficient'
    check (confidence_level in ('insufficient','low','moderate','high')),
  decision_status text not null default 'not_ready'
    check (decision_status in ('not_ready','provisional','review_required','ready_for_vet_review')),
  limitations text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index flocks_owner_placement_idx on public.flocks(owner_id, placement_date desc);
create index batches_flock_date_idx on public.serology_batches(flock_id, sampling_date desc);
create index results_batch_idx on public.serology_results(batch_id);
create index model_runs_flock_idx on public.model_runs(flock_id, created_at desc);

do $$
declare t text;
begin
  foreach t in array array['flocks','serology_batches','serology_results','model_runs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to authenticated using (owner_id = (select auth.uid()))', t || '_select_own', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (owner_id = (select auth.uid()))', t || '_insert_own', t);
    execute format('create policy %I on public.%I for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t || '_update_own', t);
    execute format('create policy %I on public.%I for delete to authenticated using (owner_id = (select auth.uid()))', t || '_delete_own', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

alter table public.diseases enable row level security;
create policy diseases_read_authenticated on public.diseases for select to authenticated using (is_active = true);
grant select on public.diseases to authenticated;

alter table public.assay_kits enable row level security;
create policy assay_kits_read_authenticated on public.assay_kits for select to authenticated using (validation_status <> 'retired');
grant select on public.assay_kits to authenticated;

alter table public.vaccine_products enable row level security;
create policy vaccine_products_read_authenticated on public.vaccine_products for select to authenticated using (validation_status <> 'retired');
grant select on public.vaccine_products to authenticated;

revoke all on public.flocks, public.serology_batches, public.serology_results, public.model_runs from anon;
revoke all on public.diseases, public.assay_kits, public.vaccine_products from anon;