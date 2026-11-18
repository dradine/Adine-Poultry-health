# بررسی بانک کیت‌ها و نرم‌افزارهای تحلیل سرولوژی طیور — 2026-11-18

## دامنه و محدودیت
این گزارش منابع سازنده، کاتالوگ‌ها، منابع فارسی و مقالات را برای شروع بانک کیت جمع‌بندی می‌کند. درج نام یک محصول به معنی موجود بودن فعلی در ایران، مجوز واردات، اعتبارسنجی برای هدف خاص، یا تایید خودکار IFU جاری نیست. قبل از انتخاب برای محاسبه، نام/شماره محصول، نسخه IFU، lot، روش، واحد، cut-off و کاربرد intended-use باید توسط کاربر یا مدیر علمی ثبت/تایید شود.

## Seed kits (initial candidates)

| Disease | Manufacturer / kit | Method | Evidence & intended-use notes |
|---|---|---|---|
| IBD | BioChek CK113 | Indirect ELISA | antibody monitoring; vaccine monitoring and vaccination date prediction are listed by manufacturer; verify IFU and exact kit-specific values |
| IBD | IDEXX IBD Ab 99-09260 | Indirect ELISA | manufacturer describes antibody measurement and immune-status/vaccine-timing support |
| IBV | BioChek CK119 | Indirect ELISA | field infection screening, vaccine response and flock status trend |
| ND | BioChek CK116 | Indirect ELISA | field infection screening, vaccination monitoring and flock trends; manufacturer reports strong correlation with HI |
| AIV | BioChek CK121 | Indirect ELISA | type A AI antibody screening and monitoring; consult current WOAH register and intended-purpose limitations |
| AIV | IDEXX AI Ab 99-09269 | Indirect ELISA | antibody screening in chicken serum |
| AIV | IDEXX AI MultiS-Screen 99-12119 | Blocking ELISA | multi-species antibody test; do not mix with other assay formats |
| AIV | IDvet / ID Screen Influenza A NP Ab (exact catalog to verify) | Competitive ELISA | do not select for calculations until exact product number, IFU and validation status are captured |

## Market in Iran
Public Persian sources and Iranian research show use of BioChek kits for IBV and IBD serology, and ELISA/HI use for ND and AIV. These sources establish historical/publication use, not current retail stock or authorized distribution. Catalog entries therefore intentionally keep Iran availability as unconfirmed until a dated supplier, importer, price/stock quote, registration record, or product label is verified.

Sources:
- Persian research summary on BioChek ELISA usage: https://www.magiran.com/author/وحید-نعمان
- Persian study reporting laboratory variation/reproducibility in ND HI: https://www.magiran.com/author/امیر-مدیری-همدان
- Iranian laboratory information on ND serology using ELISA or HI: https://t.me/s/kowsarlaboratory?q=%23بیماری_ویروسی

## Vendor software reviewed
- IDEXX xChekPlus: assay library, data interpretation, reporting and flock data management; plugin architecture and assay/report/reader/language additions; RTL language support noted by manufacturer. https://www.idexx.com/en/livestock/xchekplus-software/
- BioChek Monitoring Software / BioChek II: trends, farm histograms, control tracking, vaccination-date prediction, automated validated results, flock database and monitoring reports. https://www.biochek.com/software/
- IDsoft (IDvet): manufacturer product-list brochure describes titre, vaccination-age and baseline analysis, data import from plate reader/Excel/manual entry and report customization. Product availability/version should be verified. https://www.id-vet.com/

## Sample size and interpretation
BioChek 2025 ELISA Interpretation Manual RevB states for flock mean quantitative titre estimation: optimal n=23, minimum n=18, and sample-size needs depend on flock uniformity (CV) and historical flock data. This is specific to BioChek guidance/use and must not be turned into a universal rule for every kit, disease, assay or purpose.

Small samples such as 5–10 should not be blocked automatically. They may be used for exploratory/descriptive summaries, with a visible caution that uncertainty and representativeness are limited. Do not infer flock-wide status, protection or population prevalence from small convenience samples. If the goal is prevalence, sample size should be designed for expected prevalence, confidence, precision, sensitivity/specificity and clustering/house effects. If the goal is titre mean/trend, design must consider titre variability, CV, historical data and repeated measures.

## Interpretation guardrails
1. Never merge OD, S/P, kit titre, HI log2, VN or different assay calibrations without a validated conversion.
2. For ND HI, antigen/strain and laboratory SOP matter; Iranian publications report variability among laboratories and repeated results. The software must preserve antigen and assay metadata and label results as serological response, not proof of clinical protection.
3. For IBV, antibody titres are not necessarily strain-specific protection; record assay type, vaccine strains and sample timing.
4. For AIV, antibody ELISA/HI is surveillance evidence. Active infection confirmation and subtype/pathogenicity classification require appropriate virological/molecular testing and official pathways; serology alone cannot diagnose active HPAI.
5. Keep controls, lot, plate validity, raw data, excluded samples, sampling date/age, sampling design, vaccination history, and IFU version with every analysis.

## Primary product/software sources
- BioChek CK113 IBD: https://www.biochek.com/products/infectious-bursal-disease-virus-antibody-test-kit/
- IDEXX IBD Ab: https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ibd-ab-test/
- BioChek CK119 IBV: https://www.biochek.com/products/ibv-infectious-bronchitis-virus-antibody-test-kit/
- BioChek CK116 NDV: https://www.biochek.com/products/newcastle-disease-virus-antibody-test-kit/
- BioChek CK121 AI: https://www.biochek.com/products/avian-influenza-antibody-test-kit/
- IDEXX AI Ab: https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ai-ab-test/
- IDEXX AI MultiS-Screen: https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ai-multis-screen-ab-test/
- WOAH register: https://www.woah.org/en/what-we-offer/quality-veterinary-products/diagnostic-kits/the-register-of-diagnostic-kits/
- BioChek interpretation manual RevB 2025: https://www.biochek.com/wp-content/uploads/2025/11/BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf
- IDsoft brochure (catalog listing): https://chakmartin.net/wp-content/uploads/2024/10/IDvet-Product-list_SWINE_PCR-AND-ELISA_EN_09-AUG-24_Lr01.pdf

## Research expansion and implementation update — 18 Nov 2026

### Additional kit identifiers verified
The BioChek manufacturer SDS (revision dated 16 April 2025) identifies these kit families/catalog numbers: CK108 ORT, CK109 Mm, CK110 REO, CK112 EDS, CK113 IBD, CK114 Mg, CK115 Ms, CK116 NDV, CK117 Salmonella Group D, CK118 Salmonella Group B, CK119 IBV, CK120 ART, CK121 AI, CK122 NDV-F, CK123 AE, CK124 ILT, CK125 REV, CK126 CAV, CK128 AI, CK129 AI/EDS, CK130 AI, CK131 BLS, CK132 FAdV, CK133 Chicken Astrovirus B, KIT6073 influenza NP antibody, CK215/230/231 combined Mg-Ms, CK218 Salmonella B/D, CK301 AI antigen, and CK401 multispecies influenza A. Codes in the SDS are catalogue identifiers; this does not by itself confirm active availability, current IFU, market status, validated use, or interpretation algorithm.

The app catalog now contains 24 records focused on IBD/ND/IBV/AIV, including eight additions in the latest expansion: AVIVAC IBD/IB/ND/AI catalog entries, Pasouk HI reagent entries for ND and AIV, IDEXX NDV ELISA 06-01096-17 (public accredited-lab scope), and IDvet FLUH9S H9 antibody (public accredited-lab scope). The new additions include IDEXX IBV 99-09262, BioChek NDV-F CK122, BioChek AI antigen CK301, multispecies influenza CK401, combined AI/EDS CK129, NP antibody KIT6073, and AI identifiers CK128/CK130. Several entries are intentionally marked manufacturer-catalog rather than full manufacturer-product IFU evidence; the user interface does not treat these as automatically calculation-ready.

### Kit software comparison
- **BioChek Monitoring Software**: farm/house flock database, ELISA/PCR data handling, trend and histogram reports, control tracking and standardized result/reporting. Useful inspiration for per-kit QC and repeat-run tracking.
- **IDEXX xChekPlus**: assay-library/reporting and livestock data workflows; manufacturer supports software expansion and multilingual presentation. Useful inspiration for method-specific plugins, consistent reports and lab workflows.
- **IDsoft (IDvet)**: product brochure lists titre/age/baseline analysis, reader/Excel/manual import and report customization; exact current version, kit support and access should be checked before relying on it.
The Adine app should not claim it has reproduced the vendor-validated calculation logic unless the exact kit algorithm/IFU is reviewed and tested. These commercial software products are references for workflow design, not independent validation of our model.

### Current UI/implementation status
- A four-step wizard has been added: flock information → disease → kit/method → analysis.
- Disease and kit catalog selection are separated from data entry.
- Custom kits can be added and managed in a collapsed accordion, stored locally in the browser.
- Kit provenance (brand/catalog/assay/format/sample/source/evidence status) is attached to ND/IBV/AIV saved monitoring inputs.
- ND HI engine blocks ELISA/other kit selections as mismatched input; it expects HI endpoint log2 data.
- IBV trend engine checks the selected kit/method against the chosen data unit.
- IBD kit details and lab QC confirmations are now grouped in collapsible panels to reduce clutter.
- IBD calculations with fewer than the selected sample guidance can run exploratorily when at least two valid titers are present; they carry explicit low-n warnings. The sample-size guidance remains kit-/goal-specific.

### Remaining limitations (must be shown to testers)
- The four-step wizard and custom-kit catalog are code-complete as an initial UI implementation, but no manual iOS/Android browser test has been completed.
- Kit catalog selection for non-IBD diseases is metadata/provenance. It does not make an ELISA result into HI log2, nor does it independently validate an assay.
- Custom kit records do not unlock clinical calculations by themselves.
- IBD calculations still depend on selecting a documented compatible assay, entering exact vaccine/BTT/half-life provenance, and confirming QC/sample assumptions. The current model remains a mathematical Deventer-style estimator, not a validated vaccination prescription.
- No current Iran inventory, importer, registration, or pricing claim is made without date-specific verification.

### Sources for expanded catalogue
- BioChek SDS Revision 05 (16 April 2025): https://www.biochek.com/wp-content/uploads/2025/05/BC-ELISA-SDS-rev05.pdf
- BioChek poultry ELISA portfolio: https://www.biochek.com/poultry/poultry-elisa/
- BioChek CK108 ORT product page: https://www.biochek.com/products/ornithobacterium-rhinotracheale-antibody-test-kit/
- BioChek CK124 ILT product page: https://www.biochek.com/products/infectious-laryngotracheitis-antibody-test-kit/
- BioChek CK126 CAV product page: https://www.biochek.com/products/chicken-anemia-virus-antibody-test-kit/
- BioChek CK132 FAdV product page: https://www.biochek.com/products/fowl-adenovirus-group-1-antibody-test-kit/
- BioChek CK301/CK401 catalogue and product family: https://www.biochek.com/poultry/poultry-elisa/
- IDEXX IBV 99-09262: https://ca.idexx.com/en-ca/livestock/livestock-tests/poultry-tests/idexx-ibv-ab-test/

## Final test gate
The next release should be marked ready for user testing only after the latest CI run passes (tests, TypeScript build, Vite build, Pages base-path build, Supabase smoke, Service Worker and manifest checks) and the user performs a real browser/mobile walkthrough.
