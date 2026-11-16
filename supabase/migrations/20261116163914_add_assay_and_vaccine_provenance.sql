-- Add provenance and QC metadata to assay/vaccine catalogues.
alter table public.assay_kits
  add column if not exists kit_version text,
  add column if not exists target_antigen text,
  add column if not exists species text not null default 'chicken',
  add column if not exists minimum_sample_count integer,
  add column if not exists dilution_factor numeric,
  add column if not exists wavelength_nm integer,
  add column if not exists result_units text,
  add column if not exists reference_url text,
  add column if not exists source_document_hash text,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz;

alter table public.assay_kits
  drop constraint if exists assay_kits_min_sample_count_positive;
alter table public.assay_kits
  add constraint assay_kits_min_sample_count_positive
  check (minimum_sample_count is null or minimum_sample_count > 0);

alter table public.vaccine_products
  add column if not exists vaccine_class text,
  add column if not exists vaccine_route text,
  add column if not exists vaccine_age_min_days numeric,
  add column if not exists vaccine_age_max_days numeric,
  add column if not exists btt_assay_kit_id uuid references public.assay_kits(id),
  add column if not exists btt_definition text,
  add column if not exists btt_reference_url text,
  add column if not exists label_version text,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz;

alter table public.vaccine_products
  drop constraint if exists vaccine_products_age_range_valid;
alter table public.vaccine_products
  add constraint vaccine_products_age_range_valid
  check ((vaccine_age_min_days is null or vaccine_age_min_days >= 0)
    and (vaccine_age_max_days is null or vaccine_age_max_days >= 0)
    and (vaccine_age_min_days is null or vaccine_age_max_days is null or vaccine_age_max_days >= vaccine_age_min_days));

alter table public.model_runs
  add column if not exists qc_summary jsonb not null default '{}'::jsonb,
  add column if not exists model_assumptions jsonb not null default '{}'::jsonb,
  add column if not exists source_references jsonb not null default '[]'::jsonb,
  add column if not exists input_schema_version text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

comment on column public.assay_kits.minimum_sample_count is 'Kit/protocol-specific sample-count guidance; NULL means not documented, never a universal default.';
comment on column public.vaccine_products.breakthrough_titer is 'Product-specific BTT; meaningful only with btt_assay_kit_id and documented assay scale.';
comment on column public.vaccine_products.btt_assay_kit_id is 'Exact assay kit/scale on which this product BTT is defined.';
comment on column public.model_runs.qc_summary is 'Snapshot of analytical quality-control checks at model execution.';
comment on column public.model_runs.source_references is 'Versioned manufacturer labels, kit manuals and scientific references supporting this run.';
