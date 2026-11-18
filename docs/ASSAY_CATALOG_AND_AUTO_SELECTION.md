# Assay catalog and automatic assay selection

## Policy
The registry is a discovery/mapping catalog, not a clinical endorsement. Only entries marked `documented` with exact IFU/version and approved disease-platform logic can enable a quantitative model. `catalog-only` entries may be selected to identify an uploaded report or create descriptive summaries; they must not enable vaccination-date prediction, infer protection, or cross-convert titers.

## Selection workflow
1. User selects disease and laboratory method (ELISA, HI, VN, AGID, PCR).
2. Catalog filters compatible assays by disease + method.
3. A match from report metadata (manufacturer, kit/catalog code, IFU/version, lot) is preferred over fuzzy kit-name matching.
4. Exact code + version match loads assay parameters and report parser. Fuzzy matches require user confirmation and remain non-computational until exact identification.
5. Validate units, raw result type, dilution, wavelength, controls, validity flags, limits of quantification and sample quality.
6. Select disease-specific model only if assay + vaccine product/platform + threshold (where applicable) form a documented compatible tuple.
7. Unknown assay: manual descriptive entry; no numeric vaccination recommendation.

## Current catalog entries
- BioChek CK113 IBD ELISA — documented for assay-specific processing; current RevB 2025 guidance is retained. Not interchangeable with IDEXX.
- IDEXX IBD Ab Test 99-09260 — documented for its package insert formula; approximate titre conversion only, no universal protection inference.
- AVIVAC ELISA-IB, ELISA-ND, ELISA-AI, ELISA-REO, ELISA-IE/AE, ELISA-ALV, ELISA-MG, ELISA-MS — named in AVIVAC English catalogue. Catalog-only pending exact assay IFU, product/catalog code, formula, control ranges, local registration/availability verification and independent validation.
- Pasouk ND and AI HI antigens — Iranian diagnostic reagents reported by company profile. These are antigens/reagents, not automatically a full standardized kit; method, strain/subtype, HAU, RBC and SOP must be validated.

## Iranian market research notes (initial)
- Pasouk: company describes producing NDV and AIV HI antigens; catalog as reagent, not as complete ELISA kit.
- Avivac Varian: Iranian veterinary company/distributor associated with AVIVAC diagnostic kit portfolio; verify actual kit manufacturer, importer/registrant, local registration, stock and IFU for each SKU.
- Razi: domestic poultry biological/vaccine producer; do not assume it currently offers a commercial poultry antibody ELISA kit for every disease without official SKU/IFU evidence.
- Other veterinary diagnostic distributors/manufacturers must be added only after collecting a specific poultry assay SKU and documentation. Human IVD ELISA makers are not presumed to have validated poultry assays.

## Required metadata before enabling calculations
manufacturer legal entity; product/kit name; catalog number; lot; IFU version/date/language; species/sample type; target antigen; assay format; reader/wavelength; dilution; raw data and conversion formula; units; positive/negative/reference control criteria; report flags; LOD/ULOQ; precision/reproducibility; sensitivity/specificity evidence; local registration/availability evidence; source URL/file/hash; reviewer and review date; vaccine compatibility and model version.

## Evidence hierarchy
1. Exact manufacturer IFU/package insert and product SPC/label for assay-specific mechanics and product BTT.
2. Validation publications / WOAH validated-kit register (where applicable) and independent local verification.
3. Official manufacturer catalogue for product existence only.
4. Distributor/company listings for availability clues only—not validation.
5. Secondary web pages are discovery leads, never computational authority.

## Source leads
- AVIVAC official catalogue: https://avivac.com/files/eng_AVIVAC_Catalogue-_ENGLISH.pdf
- BioChek CK113: https://www.biochek.com/products/infectious-bursal-disease-virus-antibody-test-kit/
- IDEXX IBD Ab: https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ibd-ab-test/
- Pasouk company profile: https://pasouk.ir/
- Iran poultry product/registration listing (secondary discovery only): https://dralidousti.ir/poultry04.html

## Known gap
No exact AVIVAC assay IFUs or current Iranian registrations/stock records have yet been obtained. No automatic parsing of laboratory files has been enabled. Request sample anonymized CSV/XLSX/PDF from each lab; parser must be tested against the vendor software's original output.
