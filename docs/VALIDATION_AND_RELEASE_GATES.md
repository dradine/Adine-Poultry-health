# Validation and release gates — poultry vaccination decision support

Last reviewed: 2026-11-16. This is a software verification plan, not evidence of clinical validation.

## 1. Validation layers (must not be conflated)

1. **Code/unit verification:** deterministic input checks, nearest-rank selection, formula arithmetic, Persian/Arabic digit parsing, sensitivity calculations, persistence and backup rollback.
2. **Reference reproduction:** independently transcribed worked examples from an identified product label/manual, retaining exact assay scale, vaccine product, age correction, sample size and percentile definition.
3. **Analytical validation:** reader/kit/lot precision, repeatability, reproducibility, dilution/linearity, range, controls, outliers and data import reconciliation under the laboratory's IFU/SOP. This app currently does not read raw plate-reader data.
4. **Clinical validation:** prospective/retrospective flock datasets, paired assay and vaccination records, vaccine response and relevant outcomes (e.g., bursal lesions/clinical disease/PCR where appropriate), calibration and external validation in the target population.
5. **Operational validation:** install/update, first online load then offline cold launch, data persistence, export/import, interrupted storage write, mobile viewport, accessibility and browser compatibility.
6. **Release governance:** named reviewer, signed model/configuration version, source/IFU revision, known limitations and release notes. A green CI build alone is not a clinical release approval.

## 2. IBD calculation contract

- Eligible only for a conventional live IBD vaccine and a documented compatible assay/BTT pair. Immune-complex, HVT-VP2, inactivated products and other diseases remain blocked unless a separate model is scientifically specified and validated.
- Preserve original per-bird numerical titres and metadata; never mix OD, S/P, titre, kits, reader conversions or assay versions.
- Use an observed nearest-rank order statistic, with the percentile and selected rank displayed. The selected lower tail is sensitive to sample size; report alternative susceptible fractions rather than silently asserting one universal target.
- Record flock type/age, sampling date/age, sample design, kit/catalogue/lot, IFU and software revision, vaccine/product/strain, BTT source/scale, half-life source/population, correction source and reviewer.
- If threshold has already been reached at sampling, do not display it as a future vaccination date.
- A manually checked QC gate is an attestation, not automated laboratory QC. It must never be represented as an assay result.

## 3. Automated test matrix

| Area | Required assertions |
|---|---|
| Inputs | Reject NaN/Infinity, zero/negative titres and BTT, invalid percent, half-life, age, correction, sample minimum |
| Statistics | Deterministic order statistic with ties; rank boundaries; median; GMT; log2 SD; CV; min/max |
| Time estimate | Reproduce sourced reference example; threshold-at-sampling returns null; correction only in permitted sampling window |
| Sensitivity | Ordered and distinct outputs for increasing susceptible fractions when data permit; invalid fraction fails closed |
| Localization | Persian and Arabic digits, decimal marks, separators; malformed tokens remain invalid |
| QC | Any missing gate prevents calculation; gate is explicit user attestation |
| Local data | Empty, malformed and quota-limited storage; merge IDs; duplicate IDs in backup; rollback; version mismatch |
| PWA | Build assets cached; first online install; offline navigation; cache update; app shell fallback |
| UX | No result with incomplete provenance; no destructive restore; readable warnings; mobile/desktop RTL |

## 4. Required independent review before clinical use

- One poultry immunologist/vaccine specialist reviews model assumptions and target flock coverage.
- One laboratory lead reviews assay identity, IFU interpretation, plate acceptance, titre calculation and import contract.
- A second person independently recomputes each reference case (spreadsheet or script) and compares exact selected rank, titre and vaccination-age arithmetic.
- Model version and test fixture are frozen together; any formula, assay scale, BTT or percentile change requires a new model version and regression run.
- Report prediction error and confidence/uncertainty where a defensible validation dataset exists; do not label a single point estimate as a validated vaccine date.

## 5. Release blockers (current scope)

- No authenticated Supabase sync or multi-device conflict handling.
- No raw reader-file parser or automatic plate QC.
- No independent field validation in Iranian commercial flocks.
- No disease-specific ND/IBV/AIV timing models.
- No clinical protection prediction from ELISA/HI alone.
- The IBD engine is a transparent mathematical estimator, not a clinical recommendation system.

These blockers must remain visible in release notes and UI until evidence and implementation resolve them.
