alter table public.vaccine_products
  add column if not exists deventer_minimum_sample_count integer,
  add column if not exists deventer_sample_size_basis text;

alter table public.vaccine_products
  drop constraint if exists vaccine_products_deventer_minimum_sample_count_check;
alter table public.vaccine_products
  add constraint vaccine_products_deventer_minimum_sample_count_check
  check (deventer_minimum_sample_count is null or deventer_minimum_sample_count >= 2);

update public.vaccine_products
set label_version = 'Revised June 2026; AN 00716/2026',
    source_version = 'UK VMD product information revised June 2026; AN 00716/2026; accessed 2026-11-16',
    source_document = 'UK VMD authorised product information, Revised June 2026; AN 00716/2026',
    btt_reference_url = 'https://www.vmd.defra.gov.uk/productinformationdatabase/files/QRD_Documents/QRD-Auth_2715448.PDF',
    btt_definition = 'Breakthrough titre <=500 IDEXX standard ELISA units as specified in section 8 of the UK product information.',
    deventer_minimum_sample_count = 18,
    deventer_sample_size_basis = 'UK VMD product information revised June 2026 (AN 00716/2026), section 8: test at least 18 chicks and apply the Deventer formula. Product-specific label guidance; do not generalize to other products or assays.'
where product_name = 'Avishield IBD Plus' and market_code = 'GB';
