# Clinical serology interpretation engine — evidence and limitations

Updated: 2026-11-18

## Scope

The report engine generates a structured, disease-specific differential interpretation for Newcastle disease (ND), avian influenza (AIV), infectious bronchitis (IBV), and infectious bursal disease (IBD). It separates:
1. observations calculated from the entered sample set;
2. biological/diagnostic hypotheses compatible with the observations;
3. evidence that would strengthen or weaken each hypothesis;
4. conditional outlook (not a numerical forecast);
5. prioritized confirmatory or management checks;
6. missing metadata and source references.

The engine is decision support, not an autonomous diagnosis or vaccine prescription.

## Core scientific rules

- A single antibody titre is not a direct measure of clinical protection, sterilizing immunity, active infection, or future disease probability.
- A trend requires compatible assays, antigen, method, units, laboratory/reader, protocol, sampling purpose, vaccine context, and appropriate time points.
- Sampling representativeness and sample size are purpose- and variance-dependent. No universal flock sample-count cutoff is applied by the clinical engine.
- Raw-reader QC failure or missing QC limits the weight of all downstream interpretations.
- A numerical future-risk score is not produced. It would require validated prospective datasets linking serology, clinical outcomes, exposure pressure, vaccine program, and farm-level covariates.

## Disease-specific evidence map

### Newcastle disease (ND)
- HI/ELISA antibodies in vaccinated flocks cannot by themselves distinguish vaccination, vaccine-virus exposure, maternal antibody, natural APMV-1 exposure, or nonspecific reaction.
- HI is affected by antigen selection and assay conditions; vaccination route, vaccine quality, and individual/environmental factors influence flock response.
- Viral RNA detection and characterization are required to establish infection and assess virulence; serology does not establish a virulent field strain.
- The report only displays the illustrative 1:4 / 1:16 distribution grouping when HI and the 4-HAU condition are explicitly recorded. This is not a protective threshold or a clinical classification.

Sources:
- WOAH Terrestrial Code, Chapter 10.9 (2024): https://www.woah.org/fileadmin/Home/eng/Health_standards/tahc/2024/en_chapitre_nd.pdf
- WOAH Terrestrial Manual, Chapter 3.3.10: https://www.woah.org/fileadmin/Home/eng/Health_standards/tahm/3.03.10_NEWCASTLE_DIS.pdf
- Merck Veterinary Manual: https://www.merckvetmanual.com/poultry/newcastle-disease-and-other-avian-paramyxovirus-infections/newcastle-disease-in-poultry

### Avian influenza (AIV)
- HI is HA/subtype/antigen-specific; antigenic mismatch can produce low or negative titres despite antibodies to a different antigen.
- NP ELISA is a group-reactive antibody test and does not independently identify H5/H9. DIVA interpretation is valid only with a compatible vaccine strategy and validated test.
- EFSA 2024 describes vaccine-response monitoring windows and the possible significance of a 2–3 log2 HI rise after a stable plateau without a booster, but emphasizes the assumptions (stable homogeneous flock baseline, short enough sampling intervals) and need for virological follow-up. This rule is not generalized by the software to single samples.
- Serology alone is not adequate to demonstrate absence of active circulation.

Sources:
- WOAH Terrestrial Manual, Chapter 3.3.4: https://www.woah.org/fileadmin/Home/eng/Health_standards/tahm/3.03.04_AI.pdf
- EFSA 2024, HPAI vaccination Part 2: https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2024.8755
- WOAH Terrestrial Code, Chapter 10.4: https://www.woah.org/fileadmin/Home/eng/Health_standards/tahc/2024/en_chapitre_avian_influenza_viruses.htm

### Infectious bronchitis (IBV)
- Commercial ELISA commonly reflects broad/poly-clonal antibody response and is not a strain/genotype test.
- High or rising titres may be compatible with vaccination or field exposure; interpretation requires flock baseline, vaccination history, clinical context, and paired samples.
- HI/VN may provide antigenic information, but cross-reactions and assay limitations remain. RT-PCR plus S1 sequencing/genotyping is used for virus detection and characterization.
- PCR positivity alone does not prove viable virus or active disease.

Sources:
- WOAH Terrestrial Manual, Chapter 3.3.2: https://www.woah.org/fileadmin/Home/eng/Health_standards/tahm/3.03.02_AIB.pdf
- Infectious Bronchitis Virus Evolution, Diagnosis and Control (review): https://pmc.ncbi.nlm.nih.gov/articles/PMC7356646/
- Merck Veterinary Manual: https://www.merckvetmanual.com/poultry/infectious-bronchitis/infectious-bronchitis-in-chickens

### Infectious bursal disease (IBD)
- In young chicks, measurable antibody may be maternal; one titre cannot estimate MDA half-life or vaccine breakthrough timing.
- Deventer calculations require the relevant ELISA system, age at sampling, maternal antibody distribution, half-life assumptions, vaccine breakthrough titre, vaccine strain/type, and target fraction of birds.
- Live attenuated, immune-complex, and HVT-VP2 vaccines have different interactions with MDA and must not be treated as one platform.
- Bursa gross/histopathology and RT-PCR/VP2 sequencing provide evidence not available from serum titre alone.

Sources:
- WOAH Terrestrial Manual, Chapter 3.3.12: https://www.woah.org/fileadmin/Home/eng/Health_standards/tahm/3.03.12_IBD.pdf
- Merck Veterinary Manual: https://www.merckvetmanual.com/poultry/infectious-bursal-disease/infectious-bursal-disease-in-poultry
- Field study on IBD vaccination timing and MDA: https://pubmed.ncbi.nlm.nih.gov/17899465/

## Cross-disease sampling and baseline principles
- Representative/random sampling, flock purpose, age, breed, vaccination schedule, and historical baseline matter.
- BioChek's 2025 manual explicitly states that interpretation requires valid assay controls, suitable sample numbers, and full flock information; it recommends building farm/program-specific baselines rather than assuming a universal protective titre.
- UF/IFAS diagnostic monitoring guidance emphasizes paired sera and trends, representative samples, and limitations of antibody-only interpretation.

Sources:
- BioChek Poultry ELISA Interpretation Manual RevB (2025): https://www.biochek.com/wp-content/uploads/2025/11/BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf
- UF/IFAS Diagnostic and Monitoring Serology in Commercial Poultry Integrations: https://ask.ifas.ufl.edu/publication/VM102

## Explicitly not implemented / validation still required

- No universal protective titre cutoffs.
- No probability-of-outbreak, time-to-outbreak, or mortality forecast.
- No automatic diagnosis of vaccine failure or field infection from a single sample round.
- No automatic Deventer calculation in this report engine.
- No manufacturer-specific IFU/reader QC algorithms beyond the current generic raw-import checks.
- No automatic extraction of clinical signs, mortality, production, water/feed intake, house-level strata, or complete multi-dose vaccine history unless these are explicitly captured in the record.
- The disease-specific scenario text requires expert review against local epidemiology, vaccine products, and current IFUs before clinical deployment. The software must show assumptions and missing information rather than silently filling them.

## Next validation milestones
1. Review each scenario with poultry diagnosticians and a reference laboratory.
2. Add structured clinical and production inputs, house-level sample stratification, and complete vaccine event timeline.
3. Add a literature/IFU version registry with exact citations and effective dates.
4. Validate each disease/method/assay pathway against retrospective farm datasets and prospectively collected paired sera.
5. Lock only those numerical thresholds that are assay-, antigen-, vaccine-, population-, and outcome-validated.
