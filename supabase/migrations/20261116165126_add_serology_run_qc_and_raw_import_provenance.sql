alter table public.serology_batches
  add column if not exists ifu_version text,
  add column if not exists assay_software_name text,
  add column if not exists assay_software_version text,
  add column if not exists plate_reader_model text,
  add column if not exists plate_reader_serial text,
  add column if not exists operator_label text,
  add column if not exists positive_control_mean_od numeric,
  add column if not exists negative_control_mean_od numeric,
  add column if not exists reference_control_code text,
  add column if not exists reference_control_result numeric,
  add column if not exists reference_control_expected_min numeric,
  add column if not exists reference_control_expected_max numeric,
  add column if not exists qc_reviewed_by text,
  add column if not exists qc_reviewed_at timestamptz;

alter table public.serology_batches
  drop constraint if exists serology_batches_reference_control_range_check;
alter table public.serology_batches
  add constraint serology_batches_reference_control_range_check
  check (
    (reference_control_expected_min is null or reference_control_expected_min >= 0)
    and (reference_control_expected_max is null or reference_control_expected_max >= 0)
    and (reference_control_expected_min is null or reference_control_expected_max is null or reference_control_expected_min <= reference_control_expected_max)
  );

alter table public.serology_results
  add column if not exists well_position text,
  add column if not exists replicate_no smallint,
  add column if not exists dilution_factor numeric,
  add column if not exists reported_titer_unit text,
  add column if not exists result_flags text[];

alter table public.serology_results
  drop constraint if exists serology_results_replicate_positive_check;
alter table public.serology_results
  add constraint serology_results_replicate_positive_check
  check (replicate_no is null or replicate_no >= 1);

alter table public.serology_results
  drop constraint if exists serology_results_dilution_positive_check;
alter table public.serology_results
  add constraint serology_results_dilution_positive_check
  check (dilution_factor is null or dilution_factor > 0);

comment on column public.serology_batches.qc_status is
  'Laboratory run QC status according to exact kit IFU and lab SOP; do not set accepted based on flock titre distribution.';
comment on column public.serology_batches.protocol_metadata is
  'Versioned assay provenance: plate layout, controls, run settings, export schema and instrument details. Keep original source export separately.';
comment on column public.serology_results.raw_od is
  'Raw optical density from original reader export; do not replace with S/P, S/N or calculated titer.';
comment on column public.serology_results.reported_titer is
  'Software/IFU-derived titer in reported_titer_unit; preserve original and transformation provenance.';
