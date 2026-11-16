insert into public.assay_kits
  (disease_code, manufacturer, kit_name, catalog_number, assay_type, protocol_version,
   formula_spec, source_document, source_version, validation_status, kit_version,
   target_antigen, species, minimum_sample_count, dilution_factor, wavelength_nm,
   result_units, reference_url)
values
  ('IBD', 'BioChek BV', 'FlockChek IBD ELISA', 'CK113 IBD', 'ELISA',
   'CK113 product information + Interpretation and Application of Results manual v.042017',
   '{"dilution_factor":500,"wavelength_nm":405,"incubation_minutes":[30,30,15],"recommended_sample_count":23,"minimum_sample_count":18,"sample_size_note":"BioChek-specific guidance; increase sample size with greater titre variability","cross_kit_conversion":"not defined; do not use IDEXX BTT without a validated conversion"}'::jsonb,
   'BioChek official CK113 IBD product information',
   'Product page and Interpretation and Application of Results manual v.042017',
   'documented',
   'CK113 IBD',
   'Antibodies to known IBDV strains',
   'chicken',
   18,
   500,
   405,
   'BioChek ELISA titre',
   'https://www.biochek.com/products/infectious-bursal-disease-virus-antibody-test-kit/')
on conflict (manufacturer, catalog_number, protocol_version)
do update set
  kit_name = excluded.kit_name,
  formula_spec = excluded.formula_spec,
  source_document = excluded.source_document,
  source_version = excluded.source_version,
  validation_status = excluded.validation_status,
  kit_version = excluded.kit_version,
  target_antigen = excluded.target_antigen,
  species = excluded.species,
  minimum_sample_count = excluded.minimum_sample_count,
  dilution_factor = excluded.dilution_factor,
  wavelength_nm = excluded.wavelength_nm,
  result_units = excluded.result_units,
  reference_url = excluded.reference_url;