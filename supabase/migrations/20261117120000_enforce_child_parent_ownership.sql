-- Prevent child records from being linked to another user's parent record.
drop policy if exists serology_batches_insert_own on public.serology_batches;
drop policy if exists serology_batches_update_own on public.serology_batches;
create policy serology_batches_insert_own on public.serology_batches for insert to authenticated
with check (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = serology_batches.flock_id and f.owner_id = (select auth.uid())));
create policy serology_batches_update_own on public.serology_batches for update to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = serology_batches.flock_id and f.owner_id = (select auth.uid()));

drop policy if exists serology_results_insert_own on public.serology_results;
drop policy if exists serology_results_update_own on public.serology_results;
drop policy if exists serology_results_delete_own on public.serology_results;
create policy serology_results_insert_own on public.serology_results for insert to authenticated
with check (owner_id = (select auth.uid()) and exists (select 1 from public.serology_batches b where b.id = serology_results.batch_id and b.owner_id = (select auth.uid())));
create policy serology_results_update_own on public.serology_results for update to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()) and exists (select 1 from public.serology_batches b where b.id = serology_results.batch_id and b.owner_id = (select auth.uid()));
create policy serology_results_delete_own on public.serology_results for delete to authenticated
using (owner_id = (select auth.uid()) and exists (select 1 from public.serology_batches b where b.id = serology_results.batch_id and b.owner_id = (select auth.uid())));

drop policy if exists model_runs_insert_own on public.model_runs;
drop policy if exists model_runs_update_own on public.model_runs;
drop policy if exists model_runs_delete_own on public.model_runs;
create policy model_runs_insert_own on public.model_runs for insert to authenticated
with check (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = model_runs.flock_id and f.owner_id = (select auth.uid())));
create policy model_runs_update_own on public.model_runs for update to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = model_runs.flock_id and f.owner_id = (select auth.uid()));
create policy model_runs_delete_own on public.model_runs for delete to authenticated
using (owner_id = (select auth.uid()) and exists (select 1 from public.flocks f where f.id = model_runs.flock_id and f.owner_id = (select auth.uid())));

comment on policy serology_batches_insert_own on public.serology_batches is 'Owner must also own the referenced flock.';
comment on policy serology_results_insert_own on public.serology_results is 'Owner must also own the referenced serology batch.';
comment on policy model_runs_insert_own on public.model_runs is 'Owner must also own the referenced flock.';
