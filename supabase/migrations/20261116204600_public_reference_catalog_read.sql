-- Reference catalog data is non-sensitive and must be available before login/offline cache warm-up.
grant select on table public.diseases, public.assay_kits, public.vaccine_products to anon;

drop policy if exists diseases_public_read on public.diseases;
create policy diseases_public_read on public.diseases for select to anon using (true);

drop policy if exists assay_kits_public_read on public.assay_kits;
create policy assay_kits_public_read on public.assay_kits for select to anon using (true);

drop policy if exists vaccine_products_public_read on public.vaccine_products;
create policy vaccine_products_public_read on public.vaccine_products for select to anon using (true);
