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

## Next development gate
Research seed catalog is not yet an integrated, user-editable catalog UI. The next implementation should create kit records through the application, persist custom kits, disease-filter catalog selection, attach IFU/lot/source and market status, and enforce kit-specific interpretation/calculation gates. The four-step wizard separation is also still a separate UI refactor and must not be marked complete until code changes and browser/mobile tests pass.
