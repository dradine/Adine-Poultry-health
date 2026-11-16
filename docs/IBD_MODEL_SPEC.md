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
- Report arithmetic mean, geometric mean titre (GMT), median, minimum/maximum, selected percentile/rank, arithmetic-scale sample CV and log2-scale SD. CV is descriptive and has no universal rejection cut-off; do not conflate arithmetic CV with log-scale dispersion.
- Store exact model version, input snapshot, assumptions, warnings and source document/version with every run.

## Product-platform routing
- Conventional live attenuated: Deventer-style engine may be evaluated only when product BTT and assay mapping are documented.
- Immune-complex: separate product-specific release/replication and monitoring model; no Deventer substitution.
- HVT-VP2 vector: separate vector/insert-aware model; anti-VP2 MDA and anti-HVT vector immunity are distinct variables.
- Inactivated: not an early-chick Deventer scheduling use case; evaluate breeder vaccination/booster programme separately.

## Source anchors
- UK VMD authorised Avishield IBD Plus product information, revised June 2024: product-specific Deventer method, minimum 18 chicks, BTT ≤500 IDEXX-standard ELISA units for that product, route/age/onset/duration details, and correction/conversion caveats.
- IDEXX IBD Ab Test part 99-09260 and package insert 06-01129-18: indirect ELISA, 1:500 dilution, A650 and S/P-to-titre conversion. The insert explicitly warns that the conversion is only a rough titre indication and that protection is not established from S/P or titre alone.
- BioChek IBD ELISA product page: CK113, indirect ELISA, 405 nm, 1:500 dilution, intended uses include flock monitoring and vaccination-date prediction.
- BioChek interpretation guidance: recommends 23 samples for quantitative flock baselines/profiles and vaccination-date prediction; identifies 18 as a minimum and says larger titre variability requires larger samples. Company-specific guidance.
- Elanco AviPro IBD field guideline: describes 5% as a default percentage of birds that can be successfully vaccinated to allow vaccine spread; also illustrates alternative target percentages and stresses flock homogeneity and epidemiological pressure.
- WOAH Terrestrial Manual 2024, IBD chapter: serology, pathology, histopathology and agent detection have distinct purposes; serology alone is not a complete post-vaccination protection assessment.
- Smiałek et al. 2024: commercial broiler comparison of three IBD vaccination protocols; IDEXX used for Deventer timing while BioChek was a separate serological kit, supporting non-interchangeability without validation.
- Comparative challenge study (2019): HVT-IBD vector, immune-complex and live IBD vaccines were studied as distinct platforms, not interchangeable Deventer variants.

## Not yet validated
- Golden-example reconciliation: reproduce published Deventer/Elanco examples exactly, including correction days and rank conventions, before labelling any product configuration validated.
- Percentile rank convention against original Deventer technical sources for each supported product.
- Product-specific BTT values and kit conversion tables.
- Half-life distribution for Iranian commercial broilers and breeder-source strata.
- Sampling correction implementation by each product label.
- Local predictive validity against observed vaccine response, bursal histology, PCR differentiation and field outcomes.


## Deventer percentage semantics and golden validation (2026-11-16)

The Deventer bird-percentage parameter is the **percentage of the flock that should be directly susceptible/receptive to the live vaccine at administration** (MDA below the product-specific BTT). It is not a generic “percentile to protect” and must be explained in the UI.

- Elanco's AviPro field guideline describes **5% as its field-experience default** under the assumption that the vaccine can spread horizontally from the initially responding birds. This is conditional on successful administration and housing/spread conditions; it is not a universal biological constant.
- Published field studies have used **75%** as their requested susceptible fraction. This is a separate scenario and should not be confused with the Elanco 5% default.
- The application therefore retains 5% as the starting scenario but exposes the percentage for veterinarian-selected scenario analysis. Poor MDA uniformity, cages vs deep litter, high field pressure, and multiple-dose strategies require explicit interpretation.
- Golden example from Elanco AviPro guidelines: sample age 2 days; 20 IDEXX titres (published list); BTT 125; broiler half-life 3 days; 75% scenario; correction 2 days. The 15th ordered titre is 4027 and the formula yields approximately 19.0 days. This is now a regression test. The 5% scenario selects the first ordered titre (1224) in the same list and must produce an earlier estimate.
- The correction term is an explicit 0–4 day value only when sampling occurred at 0–4 days. It must be sourced from the exact vaccine/product guidance or an explicitly validated protocol; the software does not infer it from age.

## Assay quality gate

A numerical estimate is blocked until the operator confirms: (1) the plate/run passed the exact kit IFU and laboratory SOP controls, including reference controls where applicable; (2) sampling was random and representative; and (3) the vaccine BTT is documented for the exact assay, kit version and titer unit. These are operator attestations, not automated validation. Future import from BioChek II/xChekPlus must preserve raw OD, controls, lot, assay version and software-generated titre; it must not treat imported titre-only data as proof of plate validity.

## Current kit/software evidence

- BioChek CK113 IBD: indirect ELISA; 1:500; A405; 30-30-15 min; reference controls available. See official 2025 RevB manual and `docs/ASSAY_QC_AND_IMPORT.md` for the updated sampling and QC requirements. Official 2025 manual RevB recommends at least 23 samples for baseline/profile and vaccination-date prediction; 15 may be sufficient for trend detection after baseline establishment but not quantitative analysis. This is manufacturer guidance, not a universal rule.
- BioChek 2025 manual specifies kit-specific S/P-to-titer slope/intercept values and states these can differ among assays/manufacturers. The app must never infer a BioChek formula from a different kit or from generic OD data.
- IDEXX IBD Ab 99-09260: indirect ELISA. Official IDEXX xChekPlus can export case-view results to Excel/TXT and track control replicates; BioChek II supports configurable CSV/TXT LIMS exports. Import adapters require lab-specific sample files. The package insert's S/P-to-titer conversion is explicitly a rough indication; it advises quantitative assessment by calibration against a known quantitative standard. The official product page warns products may not be available/registered in every country.
- BioChek II supports custom CSV/TXT export to LIMS. xChekPlus can export case-view results to Excel/TXT and provides control tracking. Import adapters must be built against actual example files from the laboratory and must be schema/version-specific; no guessed column mapping is permitted.


## Primary source URLs
- Elanco AviPro IBD field guideline and Deventer example: https://assets.elanco.com/0cec44ed-3eaa-0009-2029-666567e7e4de/9e5c171d-f412-458e-a429-7befca1705cf/avipro-ibd-vaccination-guidelines.pdf
- Deventer field validation paper (Lukert? See DOI source metadata; published in Avian Pathology): https://doi.org/10.1080/03079450701589175
- BioChek Poultry ELISA Interpretation Manual RevB 2025: https://www.biochek.com/wp-content/uploads/2025/11/BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf
- WOAH Terrestrial Manual 2024, IBD chapter 3.3.8: https://www.woah.org/fileadmin/Home/fr/Health_standards/tahm/3.03.08_IBD.pdf
- IDEXX IBD Ab Test 99-09260: https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ibd-ab-test/
- IDEXX package insert 06-01129-18: https://s3.amazonaws.com/idexx-ws-web-documents/org/lpd-web-insert/idexx%20ibd%20ab%20test-06-01129-18.pdf


## No false future date when the BTT threshold is already reached

If the raw Deventer calculation is at or before the sampling age, the engine now sets the estimated vaccination age to null and raises a warning. It does not clamp the result to the sampling age, because that would display a misleading numeric vaccination date. The user is prompted to interpret the flock as potentially already beyond the calculated threshold and reassess promptly with the veterinarian.
