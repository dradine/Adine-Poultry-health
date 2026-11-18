insert into public.assay_kits
  (disease_code, manufacturer, kit_name, catalog_number, assay_type, protocol_version,
   formula_spec, source_document, source_version, validation_status, kit_version,
   target_antigen, species, dilution_factor, wavelength_nm, result_units, reference_url)
values
  ('IBD', 'IDEXX Laboratories', 'IDEXX IBD Ab Test', '99-09260',
   'ELISA', 'Package insert 06-01129-18',
   '{"dilution_factor":500,"wavelength_nm":650,"s_p_formula":"(sample_mean - NCx) / (PCx - NCx)","log10_titer_formula":"1.09 * log10(S/P) + 3.36","interpretation_note":"Package insert states this conversion gives a rough indication of antibody titre; relation of immunity to S/P or titre is not established by the assay insert. Use vaccine BTT only when explicitly specified by the exact vaccine label."}'::jsonb,
   'IDEXX IBD Ab Test package insert',
   '06-01129-18; official IDEXX product page part number 99-09260',
   'documented',
   '99-09260',
   'Antibodies to IBDV',
   'chicken',
   500,
   650,
   'IDEXX standard ELISA units',
   'https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ibd-ab-test/')
on conflict (manufacturer, catalog_number, protocol_version)
do update set
  kit_name=excluded.kit_name, formula_spec=excluded.formula_spec,
  source_document=excluded.source_document, source_version=excluded.source_version,
  validation_status=excluded.validation_status, kit_version=excluded.kit_version,
  target_antigen=excluded.target_antigen, species=excluded.species,
  dilution_factor=excluded.dilution_factor, wavelength_nm=excluded.wavelength_nm,
  result_units=excluded.result_units, reference_url=excluded.reference_url;

insert into public.vaccine_products
  (disease_code, manufacturer, product_name, platform, strain, breakthrough_titer,
   breakthrough_unit, model_family, source_document, source_version, validation_status,
   vaccine_class, vaccine_route, vaccine_age_min_days, btt_assay_kit_id,
   btt_definition, btt_reference_url, label_version, market_code, registration_number,
   marketing_authorisation_holder, onset_of_immunity_days, duration_of_immunity_weeks)
select
  'IBD', 'Genera Inc.', 'Avishield IBD Plus', 'live', 'Intermediate plus G6',
  500, 'IDEXX standard ELISA units', 'deventer_live',
  'UK VMD authorised product information',
  'Revised June 2024; AN 00800/2023', 'documented',
  'intermediate_plus', 'drinking_water', 10, k.id,
  'Break-through titre <=500 IDEXX ELISA units as stated in UK product leaflet',
  'https://www.vmd.defra.gov.uk/productinformationdatabase/files/QRD_Documents/QRD-Auth_2715448.PDF',
  'June 2024', 'GB', 'Vm 43676/3000', 'Genera Inc.',
  14, 5
from public.assay_kits k
where k.manufacturer='IDEXX Laboratories'
  and k.catalog_number='99-09260'
  and k.protocol_version='Package insert 06-01129-18'
  and not exists (
    select 1 from public.vaccine_products p
    where p.manufacturer='Genera Inc.' and p.product_name='Avishield IBD Plus'
      and p.market_code='GB' and p.label_version='June 2024'
  );
