update public.assay_kits
set minimum_sample_count = 23,
    source_version = 'BioChek Poultry ELISA Interpretation Manual RevB 2025',
    formula_spec = coalesce(formula_spec, '{}'::jsonb) ||
      '{"minimum_sample_count":23,"minimum_sample_count_basis":"BioChek RevB 2025 recommends at least 23 samples for baselines/profiles and vaccination-date prediction; 15 may be sufficient for trend monitoring after baselines exist but is insufficient for quantitative analysis. This is manufacturer guidance, not a universal ELISA rule.","sampling_requirements":["random selection across the house","healthy chicks","appropriate sample size based on titer variability"],"reference_controls":"prediluted control verifies run validity; freeze-dried control processed like serum validates dilution procedure","titer_equation":"log10(titer) = x*log10(S/P)+y; x and y are assay/IFU-specific; never reuse across kits"}'::jsonb
where manufacturer='BioChek BV'
  and catalog_number='CK113 IBD';
