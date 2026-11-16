-- Restrict Data API grants to the minimum required by the app.
-- RLS remains the row-level authorization boundary on all seven tables.
revoke all on table public.diseases, public.assay_kits, public.vaccine_products,
  public.flocks, public.serology_batches, public.serology_results, public.model_runs
from anon, authenticated;

grant select on table public.diseases, public.assay_kits, public.vaccine_products
to authenticated;

grant select, insert, update, delete on table public.flocks, public.serology_batches,
  public.serology_results, public.model_runs
to authenticated;

grant usage on schema public to authenticated;
