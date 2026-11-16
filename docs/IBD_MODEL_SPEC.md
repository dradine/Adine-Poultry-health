# IBD vaccine-timing engine — scientific specification (draft)

## Scope
This module is a mathematical estimator for conventional live attenuated IBD vaccines only. It is not a universal IBD vaccination scheduler and does not infer protection from an ELISA titre. Immune-complex and HVT-VP2 vector vaccines require separate product-specific release/replication models and are out of scope.

## Deventer-style estimator
For a documented ELISA scale and vaccine-product breakthrough titre (BTT):

`Age = sampling_age + (log2(T_percentile) - log2(BTT)) × antibody_half_life + correction`

- `T_percentile` is the observed titre at the selected flock percentage after sorting individual titres ascending. Current code uses nearest-rank (ceil(p*n)) and does not interpolate a synthetic titre.
- The UI default target is 5% based on Elanco's field-guidance description of 5% as a default; this is not a universal target. The veterinarian can select another target based on product protocol, litter/cage system, vaccine spread, MDA uniformity and field risk.
- Low-tail targets are statistically fragile in small samples. The app reports the selected order-statistic rank and flags a selected rank among the lowest three observations.
- `correction` is constrained to 0–4 days and the current code permits a non-zero correction only when sampling occurred at 0–4 days of age, following the cited product-information convention. The exact product label/protocol takes precedence.
- If the raw estimate is at or before sampling age, the UI reports that the threshold may already have been reached at sampling; it does not display a negative future interval.
- All titres, BTT and half-life must be on a compatible, documented assay scale. No cross-kit conversion is assumed.

## Hard safety boundaries
1. Do not calculate with mixed kits, mixed protocols, or different antigen/assay targets.
2. Do not enter OD, S/P or S/N as if they were ELISA titres.
3. Preserve below-LOD, above-ULOQ, invalid and missing results as censored/qualitative states; do not replace them with zero or arbitrary numbers.
4. Do not use a diagnostic-positive cut-off as a vaccine BTT.
5. Do not reuse an IDEXX BTT with BioChek/IDvet titres unless an exact validated conversion exists for that kit/version.
6. A sample-size threshold is kit/protocol-specific. Current MVP default is 23 based on BioChek interpretation guidance; some product labels specify at least 18. This is not a universal rule.
7. A calculated age is not a vaccination instruction. Consider vaccine type/strain/route, flock exposure risk, breeder source, vaccine take, bursal pathology, PCR differentiation, flock uniformity and veterinarian judgement.

## Analytical quality gates to implement
- Manufacturer/kit/catalogue/version and intended use recorded.
- Kit lot, plate ID, sampling date/age, laboratory, instrument, wavelength, dilution, positive/negative/reference control acceptance and back-titration where applicable recorded.
- Raw OD and derived S/P or S/N retained with exact manufacturer formula/version.
- Result status distinguishes numeric, below LOD, above ULOQ, invalid and missing.
- Sample count and sampling design assessed; random/representative sampling is required.
- Report arithmetic/geometric summaries, median, percentile, CV and distribution. CV is descriptive and has no universal rejection cut-off.
- Store exact model version, input snapshot, assumptions, warnings and source document/version with every run.

## Product-platform routing
- Conventional live attenuated: Deventer-style engine may be evaluated only when product BTT and assay mapping are documented.
- Immune-complex: separate product-specific release/replication and monitoring model; no Deventer substitution.
- HVT-VP2 vector: separate vector/insert-aware model; anti-VP2 MDA and anti-HVT vector immunity are distinct variables.
- Inactivated: not an early-chick Deventer scheduling use case; evaluate breeder vaccination/booster programme separately.

## Source anchors
- UK VMD authorised product information, revised June 2024: product-specific Deventer method, minimum 18 chicks, IDEXX-standard BTT 500 for that product, and correction/conversion caveats.
- BioChek IBD ELISA product page: CK113, indirect ELISA, 405 nm, 1:500 dilution, intended uses include flock monitoring and vaccination-date prediction.
- BioChek interpretation guidance: recommends 23 samples for quantitative flock baselines/profiles and vaccination-date prediction; identifies 18 as a minimum and says larger titre variability requires larger samples. Company-specific guidance.
- Elanco AviPro IBD field guideline: describes 5% as a default percentage of birds that can be successfully vaccinated to allow vaccine spread; also illustrates alternative target percentages and stresses flock homogeneity and epidemiological pressure.
- WOAH Terrestrial Manual 2024, IBD chapter: serology, pathology, histopathology and agent detection have distinct purposes; serology alone is not a complete post-vaccination protection assessment.
- Smiałek et al. 2024: commercial broiler comparison of three IBD vaccination protocols; IDEXX used for Deventer timing while BioChek was a separate serological kit, supporting non-interchangeability without validation.
- Comparative challenge study (2019): HVT-IBD vector, immune-complex and live IBD vaccines were studied as distinct platforms, not interchangeable Deventer variants.

## Not yet validated
- Percentile rank convention against original Deventer technical sources for each supported product.
- Product-specific BTT values and kit conversion tables.
- Half-life distribution for Iranian commercial broilers and breeder-source strata.
- Sampling correction implementation by each product label.
- Local predictive validity against observed vaccine response, bursal histology, PCR differentiation and field outcomes.
