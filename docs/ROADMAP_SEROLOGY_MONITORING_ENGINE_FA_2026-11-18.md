# بازطراحی جامع موتور پایش سرولوژی و MDA — ۱۸ نوامبر ۲۰۲۶

## وضعیت ممیزی
این سند، برنامه توسعه و معیارهای پذیرش را بر اساس درخواست کاربر و بازبینی کد شاخه feature/ibd-first-mvp تنظیم می‌کند. موارد زیر برنامه/نیازمندی هستند و تا وقتی پیاده‌سازی و تست نشوند، قابلیت موجود محسوب نمی‌شوند.

## اصول پایه
1. داده خام هر نمونه، واحد، آزمون، lot، تاریخ، سن، روش، antigen/strain، QC و منبع نگهداری شود؛ هرگز فقط خلاصه محاسبه ذخیره نشود.
2. مدل‌ها disease-specific و assay-specific باشند. ELISA OD، S/P، titre kit-derived، HI endpoint/log2 و VN با یکدیگر تبدیل یا تجمیع نشوند مگر تبدیل اعتبارسنجی شده باشد.
3. سویه واکسن، سویه/آنتی‌ژن آزمون و سویه میدانی سه انتخاب جدا باشند. هر کدام می‌تواند مستقل از دیگری خالی یا دستی باشد.
4. خودکارسازی به معنی استنتاج بی‌مدرک نیست: فیلدها از metadata معتبر کیت/IFU یا پروفایل گله prefill شوند و قابل بازبینی/override دستی باشند. هر مقدار auto-filled با نشان «از منبع/پروفایل» و مقدار manual با نشان «ورودی کاربر» مشخص شود.
5. هشدار، توصیه یا آستانه باید منبع/نسخه داشته باشد؛ baseline محلی قابل ساخت و بازبینی باشد. حفاظت بالینی از titre تنها استنتاج نشود.

## معماری پیشنهادی workflow
1. Flock: شناسه، فارم، سالن، نوع پرنده، سویه/لاین، تاریخ هچ یا ورود، سن، تعداد، هچری، وضعیت SPF، تاریخ نمونه، برنامه واکسیناسیون، هدف آزمایش و sampling frame.
2. Disease/goal: بیماری و هدف (MDA، vaccine take، post-vaccination response، field exposure، longitudinal trend، screening/surveillance، paired serology).
3. Assay/kit: برند، کد دقیق، روش، target antigen، sample type، units, range, cutoff, IFU version, lot, reader/software, controls; kit metadata from catalog can prefill, manual fallback always available.
4. Vaccine/strain: product, platform (live, inactivated, vector, immune-complex, recombinant), strain, antigen, route, date, batch, dose, administration/coverage, source. No automatic equivalence between antigen and vaccine strain.
5. Raw data: per-bird ID if known, house/pen, raw OD or calculated kit result (never overwrite original), HI endpoint and log2, PCR qualitative/quantitative and units, exclusion reason, paired sample ID.
6. QC: assay validity, control ranges and replicate differences per IFU, plate/reader metadata, sample integrity, duplicate/replicate status, validation status.
7. Analysis: calculation engine specific to disease+assay+goal; report quality gates, assumptions, sensitivity/uncertainty.
8. Results: overview, metrics, graphs, interpreted findings, possible causes/alternatives, limitations, next data needed and exportable report.

## Automatic prefill + manual overrides
Prefill disease, kit method, target, unit, expected input format, product/label, known sample age, vaccine platform and strains from catalog/profile where verified. Manual entry remains possible for:
- kit/assay not in catalog;
- vaccine product/strain not in registry;
- field isolate/genotype/lineage;
- unknown, missing or partial metadata;
- assay thresholds, half-life, baseline or reference range (source field required);
- raw result import mapping.
Manual entries must not unlock unsupported disease models. If data are missing, preserve the value but label it unverified and gate calculation appropriately.

## Strain registry data contract
- disease code, display name, canonical name, synonyms, category
- role: vaccine strain/platform, assay antigen, field isolate/reference (separate multi-selects)
- subtype/genotype/lineage/clade and sequence/segment/accession if available
- manufacturer/product, country/market label, source URL, citation, last verified date
- evidence level: primary product IFU; peer-reviewed reference; public catalogue; user entry; unverified
- caution and notes
- user-created records must be editable/deletable and must not change global seed registry.
Do not infer cross-protection from strain-name match. IBV serology is not strain-specific protection unless assay and evidence support it. Influenza subtype H5/H9 is not enough to define isolate/clade or vaccine identity. Historical IBDV G1-G7 scheme is not the only current classification; record VP2, segment A/B and sequence context where available.

## MDA module: day-of-hatch and early samples
Accept sample age 0, 1, 2, 3, 4 days (and direct measured hatch sample). Sample age must never be forced to equal placement date or hatch date. Explicitly store:
- hatch date/time and source/precision;
- sample date/time and actual age at sampling;
- whether sampled day-of-hatch, day-old delivery, or later;
- per-chick ID, titer and assay-specific unit;
- maternal flock/source, breeder age, vaccination history if known;
- kit/target antigen/lot/IFU, QC status, random sampling and house/box grouping;
- half-life parameter, source and population basis; threshold/BTT, unit and product source.
Exploratory exponential back-calculation:
T_hatch = T_sample * 2^(sampleAgeDays / halfLife)
T(age) = T_hatch * 2^(-age / halfLife)
Crossing age = halfLife * log2(T_hatch / threshold), only if T_hatch >= threshold.
This is a simplified decay model. Do not silently default half-life/threshold or apply across kits, antigens, species/bird types or vaccine platforms. For day 0, estimated hatch titer equals measured titer, no correction. The output must say measured vs reconstructed.
Next model iteration should estimate uncertainty and display parameter sensitivity (half-life, assay error, threshold), not one precise day. If longitudinal samples from the same bird exist, estimate decay slope from individual log titers only after validating assay consistency and biologic assumptions; do not pool different birds as repeated measurements.
The current MDA component does not automatically store/run provenance and uncertainty; these are release-blocking requirements for a clinical-quality report.

## Statistical report — metrics by valid assay and purpose
Calculate only where appropriate:
- n valid / n excluded and reasons; missingness
- mean and median, SD, CV (state whether CV calculated on arithmetic titre or reciprocal-transformed data)
- geometric mean titre only for positive, ratio-scale, assay-derived titres; explain log transform
- min/max, Q1/Q3, selected percentiles with method label
- histogram with appropriate bins; raw data table; outlier flags that do not automatically delete values
- paired analyses only using stable bird IDs: paired delta, log-fold changes, fourfold rise fraction, confidence interval where assumptions/units valid
- longitudinal analysis: plot actual sample ages, units, kit/lot and vaccine events; slope, fit and R² are descriptive; avoid interpreting repeated cross-sectional samples as paired individual response
- responders only with user-entered protocol threshold, source and unit; never label universal protective threshold
- for proportion/prevalence goals, sample-size design must consider expected prevalence, confidence, precision, assay sensitivity/specificity and clustering; for mean titre goals, consider variability, CV and flock history. Do not use one universal n rule.
BioChek RevB 2025 mentions 23 optimal and 18 minimum samples for its specified quantitative flock titre assessment; that guidance must remain kit/purpose-specific. Small n can run exploratory, with visible caution, not flock-level certainty.

## Disease engines and feature boundaries
### IBD
- conventional live vaccine Deventer-style timing: only when exact assay scale, compatible product, BTT, half-life, age, sample and product guidance are verified.
- vaccine platforms: conventional live; intermediate/intermediate-plus; immune-complex; HVT-VP2; other vector/recombinant; inactivated; unknown. Each platform has a separate model eligibility gate.
- support day-of-hatch/early MDA assessment separate from vaccination timing.
- output: distribution, GMT/mean, CV, sample size, percentile/selected titer, threshold crossing and sensitivity table; assumptions and source.
- do not use conventional Deventer for immune-complex/HVT-VP2 without platform-specific validated model.
### ND
- HI: endpoint/log2, antigen strain, HAU, RBC, SOP, lab, baseline/post sampling, matched bird IDs and dates. ELISA is a separate engine.
- descriptive statistics, histogram, paired rise and fourfold-rise only with true paired birds; thresholds are protocol-defined.
- no universal protective titre or protection score.
### IBV
- assays ELISA, HI, VN separated by scale; repeated monitoring and matched paired birds distinguished.
- vaccine strains/field lineages metadata and timing; descriptive serology not cross-protection, mucosal protection or strain identification.
- clinical, PCR, sequencing and production information are context evidence, not automatically inferable from titre.
### AIV
- assay target NP/HA/subtype and method metadata; serology/HI screening is surveillance evidence.
- active infection/subtype/pathogenicity require appropriate molecular/virological and official testing. Avoid automatic diagnostic certainty.
- capture vaccination, symptoms, mortality, PCR, subtype/clade and exposure; priority status must show why and be configurable.
### Extensible diseases
Disease registry should support adding ART, AE, CAV, ILT, ORT, Mycoplasma, REO, FAdV etc., but each disease requires assay, evidence, unit, intended use and validation. Catalog inclusion alone is not a calculator.

## Dashboard/report design inspired by manufacturer software
- flock/farm overview and recent runs
- assay and sample metadata/QC status
- histogram, box plot, trend graph and comparison of flocks/houses
- table of per-sample raw and derived values
- vaccine/field exposure timeline overlay
- control tracking by kit lot and run (control values, variation, drift)
- comparison across farms/flocks only after assay/unit/method harmonization and metadata matching
- report builder: executive summary, findings, caution/limitations, next sampling recommendation (rule-based and source-backed), data table and graphs; PDF/print and CSV export
- configurable thresholds and baselines, clearly labeled local baselines; preserve default manufacturer reference separately
- provenance: model version, formula, source, date, parameter inputs, overrides and user who entered them
- audit trail for edited/excluded values.

## Import and interoperability
1. Start with template CSV/Excel schema; sample ID, flock ID, date/age, assay, kit/lot, raw OD, S/P, titer, units, result and QC fields.
2. Preview mapping and validation before import; duplicate detection, unknown columns and bad values; never silently overwrite.
3. Add vendor-specific adapters only after real anonymized sample exports from BioChek II and IDEXX xChekPlus are supplied. Do not invent parser compatibility or claim automatic reader integration.
4. Preserve original file/hash and import mapping, with manual correction and export to CSV.
5. Offline-first: queued imports and runs; clear sync status/conflict handling.

## Scientific interpretation contract
Every report must separate:
- Observed facts (actual values)
- Calculated statistics
- Trends / statistical signals
- Hypotheses (possible explanations, not diagnoses)
- Limitations / missing evidence
- Suggested next investigation
Do not say protection, field infection, vaccine failure or cross-protection solely from titres. Present alternative explanations: vaccination date/route/take, sampling variation, maternal antibodies, assay/lot differences, disease exposure, timing, immunosuppression, bird type, environment, sample quality and lab variation. Do not rank hypotheses without evidence.

## Prioritized implementation backlog
P0 correctness:
- fix latest strainRegistry test failure; rerun CI
- fix all scientific/unit validation gates
- ensure sample age from sample date/hatch date with explicit override and no false date mismatch for MDA
- persist MDA input/output, source, assay, half-life, threshold, unit, strain metadata and model version
- true paired analysis requires IDs; array position alone must not be called pairing
- report data quality, missing values, excluded samples, assumptions and source
P1 user value:
- common strain registry expansion with manual entry and editing
- robust histograms/boxplots/trends/house comparison
- per-kit QC/control tracking and baseline management
- import template/preview/validation
- PDF/print and CSV export
P2 research/validation:
- MDA uncertainty/sensitivity; fit to multi-age same-bird data
- IBD platform-specific model research
- ND HI and ELISA separate validation
- IBV trend model validation
- AIV surveillance evidence rules
- local Iranian flock baselines with prospective validation
- independent expert review and test data sets
P3 operations:
- mobile manual test, offline/sync, accounts and backup/restore
- audit trail, role permissions, dataset encryption/security review
- release tags, changelog, reproducible lockfile install, dependency security

## Test gates
- MDA ages 0–4: roundtrip at sampling day; age 0 no back-correction; age 2 mathematically reconstructs; age 4 accepted; age 5 rejected.
- Units: cross-kit or ELISA/HI/VN mixing blocked.
- Paired: same bird IDs accepted; mismatched/absent IDs show unpaired and disable paired claims.
- QC: invalid plate blocks analysis; raw data preserved; control drift warning.
- Stats: all metrics independently tested, zero/negative validation and small-n warnings.
- strain: 4/91, 793B alias; CR88121 distinct; manual additions preserved; disease filters.
- import: preview, invalid rows, duplicates, missing metadata, Unicode/Persian digits, manual override.
- UI: RTL, mobile, charts labels, empty state, keyboard/accessibility, offline refresh.
- regression: IBD tests; ND/IBV/AIV gates; backup/sync.
Release must remain Draft until CI is green, manual device tests and scientific review are complete.

## References (vendor/product and applied science)
- BioChek Poultry ELISA Interpretation Manual RevB 2025: https://www.biochek.com/wp-content/uploads/2025/11/BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf
- BioChek monitoring software/report features: https://www.biochek.com/software/
- BioChek poultry ELISA portfolio: https://www.biochek.com/poultry/poultry-elisa/
- IDEXX xChekPlus: https://www.idexx.com/en/livestock/xchekplus-software/
- IDEXX QC/control tracking tips: https://www.idexx.com/en/livestock/resources-support/
- UF/IFAS Diagnostic and Monitoring Serology in Commercial Poultry Integrations: https://ask.ifas.ufl.edu/publication/VM102
- WOAH diagnostic kit register: https://www.woah.org/en/what-we-offer/quality-veterinary-products/diagnostic-kits/the-register-of-diagnostic-kits/
- IBDV vaccination protocol/serology comparison: https://pmc.ncbi.nlm.nih.gov/articles/PMC11545246/
- IBV review/strain context: https://pmc.ncbi.nlm.nih.gov/articles/PMC10221305/
- IBDV genogroup historical classification: https://doi.org/10.1007/s00705-017-3500-4

## Current implementation truth
As of the audit, current branch contains the four-step wizard, local strain metadata selector, day 0–4 exploratory MDA model, ND-HI descriptive monitor, IBV trend monitor and AIV evidence triage. The model is not a validated commercial or clinical serology system. Vendor-specific raw imports, QC tracking reports, robust uncertainty, true matched paired analyses and full exportable scientific reports are not complete.
