alter table public.vaccine_products
  add column if not exists market_code text,
  add column if not exists registration_number text,
  add column if not exists marketing_authorisation_holder text,
  add column if not exists onset_of_immunity_days numeric,
  add column if not exists duration_of_immunity_weeks numeric;

alter table public.vaccine_products
  drop constraint if exists vaccine_products_immunity_timing_nonnegative;
alter table public.vaccine_products
  add constraint vaccine_products_immunity_timing_nonnegative
  check (
    (onset_of_immunity_days is null or onset_of_immunity_days >= 0)
    and (duration_of_immunity_weeks is null or duration_of_immunity_weeks >= 0)
  );

comment on column public.vaccine_products.market_code is
  'Country/market code for this exact product label; does not imply registration in other markets.';
comment on column public.vaccine_products.registration_number is
  'Local veterinary marketing authorisation/registration number for the specified market.';
comment on column public.vaccine_products.onset_of_immunity_days is
  'Product-label onset-of-immunity claim; not a vaccine take or universal protection guarantee.';
