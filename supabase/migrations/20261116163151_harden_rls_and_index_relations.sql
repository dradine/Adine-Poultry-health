alter function public.set_updated_at() set search_path = pg_catalog;
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists flocks_set_updated_at on public.flocks;
create trigger flocks_set_updated_at before update on public.flocks
for each row execute function public.set_updated_at();
drop trigger if exists serology_batches_set_updated_at on public.serology_batches;
create trigger serology_batches_set_updated_at before update on public.serology_batches
for each row execute function public.set_updated_at();

create index if not exists assay_kits_disease_code_idx on public.assay_kits(disease_code);
create index if not exists vaccine_products_disease_code_idx on public.vaccine_products(disease_code);
create index if not exists serology_batches_owner_id_idx on public.serology_batches(owner_id);
create index if not exists serology_batches_disease_code_idx on public.serology_batches(disease_code);
create index if not exists serology_batches_assay_kit_id_idx on public.serology_batches(assay_kit_id);
create index if not exists serology_results_owner_id_idx on public.serology_results(owner_id);
create index if not exists model_runs_owner_id_idx on public.model_runs(owner_id);
create index if not exists model_runs_disease_code_idx on public.model_runs(disease_code);

drop policy if exists serology_batches_insert_own on public.serology_batches;
create policy serology_batches_insert_own on public.serology_batches for insert to authenticated
with check (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = flock_id and f.owner_id = (select auth.uid())));
drop policy if exists serology_batches_update_own on public.serology_batches;
create policy serology_batches_update_own on public.serology_batches for update to authenticated
using (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = flock_id and f.owner_id = (select auth.uid())))
with check (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = flock_id and f.owner_id = (select auth.uid())));

drop policy if exists serology_results_select_own on public.serology_results;
create policy serology_results_select_own on public.serology_results for select to authenticated
using (owner_id = (select auth.uid()) and exists (select 1 from public.serology_batches b where b.id = batch_id and b.owner_id = (select auth.uid())));
drop policy if exists serology_results_insert_own on public.serology_results;
create policy serology_results_insert_own on public.serology_results for insert to authenticated
with check (owner_id = (select auth.uid()) and exists (select 1 from public.serology_batches b where b.id = batch_id and b.owner_id = (select auth.uid())));
drop policy if exists serology_results_update_own on public.serology_results;
create policy serology_results_update_own on public.serology_results for update to authenticated
using (owner_id = (select auth.uid()) and exists (select 1 from public.serology_batches b where b.id = batch_id and b.owner_id = (select auth.uid())))
with check (owner_id = (select auth.uid()) and exists (select 1 from public.serology_batches b where b.id = batch_id and b.owner_id = (select auth.uid())));
drop policy if exists serology_results_delete_own on public.serology_results;
create policy serology_results_delete_own on public.serology_results for delete to authenticated
using (owner_id = (select auth.uid()) and exists (select 1 from public.serology_batches b where b.id = batch_id and b.owner_id = (select auth.uid())));

drop policy if exists model_runs_insert_own on public.model_runs;
create policy model_runs_insert_own on public.model_runs for insert to authenticated
with check (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = flock_id and f.owner_id = (select auth.uid())));
drop policy if exists model_runs_update_own on public.model_runs;
create policy model_runs_update_own on public.model_runs for update to authenticated
using (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = flock_id and f.owner_id = (select auth.uid())))
with check (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = flock_id and f.owner_id = (select auth.uid())));