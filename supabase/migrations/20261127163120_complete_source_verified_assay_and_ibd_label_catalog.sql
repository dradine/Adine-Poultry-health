-- Source-backed BioChek assay catalogue and Avishield IBD Plus UK label refresh.
-- These entries describe published manufacturer/label facts, not local Iranian registration.
update public.assay_kits
set minimum_sample_count=18,
    source_version='BioChek Poultry ELISA Interpretation Manual RevB 2025',
    protocol_version='Manufacturer product page; current lot-specific IFU/COA still required',
    formula_spec=coalesce(formula_spec,'{}'::jsonb)||jsonb_build_object(
      'measurement_scale','kit-titer','sample_matrix','chicken serum','assay_format','indirect ELISA',
      'sample_dilution','1:500','read_wavelength_nm',405,
      'incubation_sequence_minutes',jsonb_build_array(30,30,15),
      'incubation_temperature','room temperature','kit_plates',5,
      'maximum_sample_count_per_kit',460,'reference_controls_required',true,
      'qc_acceptance','Use exact lot COA/IFU control ranges; no generic numeric limits are stored.',
      'sample_size_guidance',jsonb_build_object(
        'minimum_for_quantitative_flock_mean',18,
        'recommended_for_baseline_and_quantitative_trend_or_DTV',23,
        'trend_only_after_baseline',15,
        'source','BioChek Poultry ELISA Interpretation Manual RevB 2025'
      ),
      'minimum_sample_count',18,
      'minimum_sample_count_basis','BioChek RevB 2025 states minimum 18 samples per flock for quantitative mean interpretation; recommends 23 for baseline/profile and vaccination-date prediction; 15 only for trend detection after a baseline exists.',
      'clinical_interpretation_limit','Kit-specific titre is not a universal protection threshold; do not pool across manufacturers or assay scales.'
    ),
    validation_status='documented'
where id in (
 '56e9f5e2-3035-4545-bbf6-1a5372c9654b',
 'bbe33c0d-5320-42e1-bf1f-a5560b90e029',
 'e57c18d9-6ff0-4e6d-b270-21d8a311a126'
);

insert into public.assay_kits
(id,disease_code,manufacturer,kit_name,catalog_number,assay_type,protocol_version,
 formula_spec,source_document,source_version,validation_status,kit_version,target_antigen,
 species,minimum_sample_count,result_units,reference_url)
values
('6c119000-0000-4000-8000-000000000119','IBV','BioChek BV',
 'Infectious Bronchitis Virus Antibody Test Kit','CK119 IBV','ELISA',
 'Manufacturer product page; current lot-specific IFU/COA required',
 jsonb_build_object(
   'measurement_scale','kit-titer','sample_matrix','chicken serum','assay_format','indirect ELISA',
   'sample_dilution','1:500','read_wavelength_nm',405,
   'incubation_sequence_minutes',jsonb_build_array(30,30,15),
   'incubation_temperature','room temperature','kit_plates',5,
   'maximum_sample_count_per_kit',460,'reference_controls_required',true,
   'qc_acceptance','Use exact lot COA/IFU ranges; numeric control limits are not supplied here.',
   'sample_size_guidance',jsonb_build_object(
     'minimum_for_quantitative_flock_mean',18,
     'recommended_for_baseline_and_quantitative_trend_or_DTV',23,
     'trend_only_after_baseline',15,
     'source','BioChek Poultry ELISA Interpretation Manual RevB 2025'
   ),
   'minimum_sample_count',18,
   'minimum_sample_count_basis','BioChek RevB 2025: 18 minimum for quantitative flock mean; 23 recommended for baseline/profile and quantitative DTV; 15 only for trend after baseline.',
   'interpretation_note','Detects antibodies to known IBV strains; ELISA titre is not strain-specific protection or cross-protection.',
   'clinical_interpretation_limit','Do not infer mucosal protection or genotype-specific cross-protection from serum ELISA alone.'
 ),
 'https://www.biochek.com/products/ibv-infectious-bronchitis-virus-antibody-test-kit/',
 'BioChek official product page + Poultry ELISA Interpretation Manual RevB 2025',
 'documented','CK119 IBV','Antibodies to known IBV strains','chicken',18,
 'BioChek assay-specific ELISA titre',
 'https://www.biochek.com/products/ibv-infectious-bronchitis-virus-antibody-test-kit/')
on conflict (id) do update set
 manufacturer=excluded.manufacturer,kit_name=excluded.kit_name,catalog_number=excluded.catalog_number,
 assay_type=excluded.assay_type,protocol_version=excluded.protocol_version,formula_spec=excluded.formula_spec,
 source_document=excluded.source_document,source_version=excluded.source_version,
 validation_status=excluded.validation_status,kit_version=excluded.kit_version,
 target_antigen=excluded.target_antigen,species=excluded.species,
 minimum_sample_count=excluded.minimum_sample_count,result_units=excluded.result_units,
 reference_url=excluded.reference_url;

update public.assay_kits
set reference_url='https://www.biochek.com/products/newcastle-disease-virus-antibody-test-kit/',
    source_document='https://www.biochek.com/products/newcastle-disease-virus-antibody-test-kit/',
    source_version='BioChek official product page + Poultry ELISA Interpretation Manual RevB 2025',
    formula_spec=formula_spec||jsonb_build_object(
      'interpretation_note','Manufacturer states strong correlation with HI; this does not make ELISA and HI titres numerically interchangeable.',
      'measurement_scale','kit-titer','calculation_enabled',false)
where id='bbe33c0d-5320-42e1-bf1f-a5560b90e029';

update public.assay_kits
set source_document='https://www.biochek.com/products/avian-influenza-antibody-test-kit/',
    source_version='BioChek official product page + Poultry ELISA Interpretation Manual RevB 2025',
    formula_spec=formula_spec||jsonb_build_object(
      'interpretation_note','Detects antibodies to type A avian influenza; not subtype-specific HI and not a standalone DIVA conclusion.',
      'measurement_scale','kit-titer','calculation_enabled',false)
where id='e57c18d9-6ff0-4e6d-b270-21d8a311a126';

update public.vaccine_products
set source_document='https://www.vmd.defra.gov.uk/productinformationdatabase/files/QRD_Documents/QRD-Auth_2715448.PDF',
    source_version='UK SPC AN:00716/2026, revised June 2026',
    label_version='UK SPC revised June 2026',
    market_code='GB',
    registration_number='Vm 61812/3002',
    marketing_authorisation_holder='IZO S.r.l a socio unico',
    vaccine_class='intermediate_plus',
    vaccine_route='drinking_water',
    vaccine_age_min_days=10,
    onset_of_immunity_days=14,
    duration_of_immunity_weeks=5,
    breakthrough_titer=500,
    breakthrough_unit='IDEXX standard ELISA units',
    btt_definition='Product label: breakthrough titre ≤500 IDEXX standard ELISA units. Do not apply directly to BioChek or other assay scales without a validated conversion.',
    btt_reference_url='https://www.vmd.defra.gov.uk/productinformationdatabase/files/QRD_Documents/QRD-Auth_2715448.PDF',
    deventer_minimum_sample_count=18,
    deventer_sample_size_basis='UK SPC advises serology on at least 18 chicks for Deventer calculation. BioChek Poultry ELISA Interpretation Manual RevB 2025 recommends 23 samples for reliable quantitative baseline/DTV; use exact assay and label context.',
    validation_status='documented'
where id='5a87d63c-300b-4174-9ecc-a057ea73fd53'
  and product_name='Avishield IBD Plus'
  and disease_code='IBD';
