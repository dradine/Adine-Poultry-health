# Vendor software review for poultry serology (16 Nov 2026)

This review is for architecture and workflow inspiration, not reverse-engineering proprietary algorithms or copying protected code.

## Verified manufacturer workflows

### BioChek II
Official BioChek description: flock/herd records, trend analysis and customized reports, online database, barcode sample forms and LIMS interface. Its 2025 ELISA interpretation manual recommends Deventer for IBD vaccination-date prediction and documents species/age-specific maternal-antibody half-life references. The manual does not make its numeric assumptions universal for every assay or vaccine.

### IDEXX xChekPlus
Official IDEXX software manages poultry flock information, reads/interprets ELISA results, supports case/sample entry, assay plug-ins, control placement, multilingual/RTL/date formats, reports and data exports. IDEXX also provides a Case Import Guide and assay packages. Its control-tracking guidance emphasizes repeated positive/negative control reproducibility and lot tracking; the cited technical tip recommends control replicate difference no greater than 20% (specific IDEXX guidance, not a universal acceptance rule for all assays).

### IDvet IDsoft
Official product material describes importing plate-reader data or Excel, manual entry, test/sample scheduling, calculation of titers, vaccination age and baselines for ID Screen assays, export, multi-workstation use and customizable reports. Its software is assay-family-specific; output algorithms must not be treated as transferable to unrelated kits.

## Architectural decisions for Adine
- Keep raw observations (OD, dilution, plate/well, controls) separate from derived titers and interpretations.
- Store immutable assay identity: manufacturer, SKU/catalog code, IFU revision, lot, method, species/specimen, reader wavelength, units, formula version and source hash.
- Import formats are adapters (CSV/XLSX/reader-specific), not one generic parser. A parser must identify its template/version and reject unknown layouts rather than silently map columns.
- QC should be rule-driven by assay IFU and plate configuration; user checkbox attestation remains explicitly distinct from automated QC.
- All calculations should be reproducible from a saved snapshot and versioned model. Preserve raw data and model inputs for audit/recalculation.
- Results must show source/uncertainty, warnings, model version and a non-diagnostic clinical review status.
- No hidden proprietary vendor software algorithm is copied. Only published, documented equations/IFUs and independently validated implementation are eligible.

## Primary references
- BioChek Monitoring Software: https://www.biochek.com/software/
- BioChek ELISA Interpretation Manual Rev B 2025: https://www.biochek.com/wp-content/uploads/2025/11/BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf
- IDEXX xChekPlus official product: https://www.idexx.com/en/livestock/xchekplus-software/
- IDEXX xChekPlus resources/import guide: https://www.idexx.com/en/livestock/xchekplus-software/xchek-software-resources/
- IDEXX control tracking technical tip: https://www.idexx.com/en/livestock/resources-support/
- IDvet IDsoft official materials/product catalogue: https://www.id-vet.com/
- IDsoft product-list PDF (feature overview): https://chakmartin.net/wp-content/uploads/2024/10/IDvet-Product-list_SWINE_PCR-AND-ELISA_EN_09-AUG-24_Lr01.pdf
- De Herdt et al. 2005, ELISA vs VN and field prediction caution: https://pubmed.ncbi.nlm.nih.gov/16537166/
- Smiałek et al. 2024, protocols, assay separation and field endpoints: https://pmc.ncbi.nlm.nih.gov/articles/PMC11545246/
- Current product label example revised March 2026: https://www.vmd.defra.gov.uk/productinformationdatabase/files/SPC_Documents/SPC_2715446.PDF
