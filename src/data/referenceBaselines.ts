/**
 * Source-traceable poultry serology reference baselines.
 * Numeric entries are examples/guidance only; never universal protection cutoffs.
 */
export type ReferenceBaseline = {
  id: string
  vendor: string
  disease: string
  assayOrKit: string
  population: string
  ageWindow?: string
  vaccineProgram?: string
  numericRange?: { low: number; high: number; unit: string; method: string }
  sampleGuidance?: string[]
  limitations: string[]
  method?: 'ELISA' | 'HI' | 'VN'
  catalog?: string
  assayVersion?: string
  numericComparisonEligible?: boolean
  evidence: 'manufacturer-manual' | 'manufacturer-document-listed-unparsed'
  sourceTitle: string
  sourceVersion: string
  sourceUrl: string
  sourcePage?: string
  verificationDate: string
}

export const REFERENCE_BASELINES: ReferenceBaseline[] = [
  {
    id: 'biochek-ibd-broiler-35-45d-program123-95ci',
    vendor: 'BioChek',
    disease: 'IBD',
    assayOrKit: 'BioChek IBD ELISA family; exact kit calibration must match current IFU',
    population: 'Broiler flocks classified N (normal/healthy), database sample code N',
    ageWindow: '35–45 days at sampling',
    vaccineProgram: 'Worked example: vaccination program 123 Broilers',
    method: 'ELISA',
    numericComparisonEligible: false,
    numericRange: { low: 7000, high: 14000, unit: 'BioChek kit-specific titre', method: 'Worked example using mean ± 1.96 SD (95% interval), rounded by the manual to 7,000–14,000' },
    sampleGuidance: [
      'For quantitative flock mean/profile or baseline creation: target at least 23 birds per flock; the manual describes 18 as a minimum in its interpretation checklist, not an ideal target.',
      'For building a baseline: 20–30 qualifying flocks when between-flock CV is <40%; if CV is ≥40%, ideally >100 flocks.',
      'Only healthy/normal flocks should be included when constructing a normal vaccination baseline.',
      'After a baseline already exists, 15 birds may help identify trend/titer-group patterns but are insufficient for quantitative analysis.',
    ],
    limitations: [
      'This is a worked example, not a universal IBD target or protective titre.',
      'It applies only to the stated age, bird type, flock health classification, vaccination program, and BioChek titre scale.',
      'Do not transfer this numeric range to IDvet, IDEXX, another BioChek kit version, or another assay calibration.',
      'The manual also presents a narrower alternative example range of 8,500–14,000 using a different lower-bound rule; that is a separate method, not a correction to the 95% interval.',
    ],
    evidence: 'manufacturer-manual',
    sourceTitle: 'BioChek Poultry ELISA Interpretation Manual',
    sourceVersion: 'RevB, 2025, sections 2.1, 3.4, 4 and Appendix I',
    sourceUrl: 'https://www.biochek.com/download/biochek-poultry-elisa-interpretation-manual/?filename=BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf&ind=17830&refresh=692cdf76bb4941764548470&wpdmdl=17825',
    sourcePage: 'PDF pages 11–12, 19, 24–28',
    verificationDate: '2026-11-18',
  },
  {
    id: 'biochek-ibd-broiler-35-45d-program123-narrow-example',
    vendor: 'BioChek',
    disease: 'IBD',
    assayOrKit: 'BioChek IBD ELISA family; exact kit calibration must match current IFU',
    population: 'Broiler flocks classified N (normal/healthy), database sample code N',
    ageWindow: '35–45 days at sampling',
    vaccineProgram: 'Worked example: vaccination program 123 Broilers',
    method: 'ELISA',
    numericComparisonEligible: false,
    numericRange: { low: 8500, high: 14000, unit: 'BioChek kit-specific titre', method: 'Alternative narrower example: lower = mean − 1 SD; upper = mean + 1.96 SD' },
    sampleGuidance: [
      'Baseline construction: 20–30 qualifying flocks if between-flock CV <40%; ideally >100 if CV ≥40%.',
      'At least 23 birds per flock is the ideal sample size for baseline/profile construction.',
    ],
    limitations: [
      'Alternative calculation example in the same BioChek manual; not interchangeable with the 95% interval above.',
      'Not a universal cutoff, protection threshold, or target for other age groups/programs/kits.',
    ],
    evidence: 'manufacturer-manual',
    sourceTitle: 'BioChek Poultry ELISA Interpretation Manual',
    sourceVersion: 'RevB, 2025, section 4',
    sourceUrl: 'https://www.biochek.com/download/biochek-poultry-elisa-interpretation-manual/?filename=BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf&ind=17830&refresh=692cdf76bb4941764548470&wpdmdl=17825',
    sourcePage: 'PDF page 25',
    verificationDate: '2026-11-18',
  },
]

export const UNPARSED_REFERENCE_DOCUMENTS = [
  {
    id: 'idvet-poultry-general-baselines-march2026',
    vendor: 'Innovative Diagnostics / IDvet',
    title: 'IDvet Poultry General Baselines',
    version: 'March 2026, English doc17201 (760 KB); Russian doc17202 (860 KB), listed in the official Pro Access portal',
    status: 'The official portal search index lists the March 2026 English and Russian PDFs. The PDF payload was not retrievable for independent transcription in this review; numeric tables have NOT been transcribed or activated. This supersedes the stale June 2025 listing previously recorded in this project.',
    sourceUrl: 'https://www.innovative-diagnostics.com/pro-access-en/',
    requiredNextStep: 'Obtain the March 2026 English PDF and transcribe every poultry row with disease, assay code, bird type, age, vaccine type/program, post-vaccination interval, titre scale, sample size, population and footnotes. Independently double-enter and verify every numeric cell before enabling comparisons.'
  {
    id: 'idvet-avian-kit-matrices',
    vendor: 'Innovative Diagnostics / IDvet',
    title: 'Official avian Excel interpretation matrices',
    version: 'Portal-listed files; versions vary by assay',
    status: 'Official portal lists separate English matrices: IBDS (ver0416), IBDVP2 (ver0916), IBVC (ver0217), IBVS (ver0416), IBVARSV2 (ver0223), NDVC (ver0417), NDVS (ver0416), NDVS-CV (ver0416), FLUACA (ver0917), FLUACH5 (ver0215), FLUACH9 (ver0616), FLUH9S (ver0620), and FLUNPS (ver0620). Their filenames and existence are verified; the spreadsheet payloads could not be downloaded/inspected in this session, so no numeric matrices or equations have been imported or activated.',
    sourceUrl: 'https://www.innovative-diagnostics.com/pro-access-en/',
    requiredNextStep: 'Acquire each applicable workbook, inspect hidden sheets/formulas/locked ranges and IFU pairing, then implement only exact version-specific calculation logic with test fixtures.',
  },
]

export const BASELINE_INTERPRETATION_RULES = [
  'A manufacturer baseline is a reference distribution/range for a defined population and intended purpose, not proof of individual-bird protection.',
  'Never compare raw OD, S/P, kit titre, HI log2, reciprocal HI or VN values unless a validated calibration/bridging study supports the conversion.',
  'Baseline matching requires disease, species/type, age at sampling, kit and version, assay scale, vaccine product/platform/program, route, post-vaccination interval, health status, and geography/population where specified.',
  'Keep manufacturer reference ranges separate from locally derived baselines; local baselines require pre-defined inclusion/exclusion criteria and adequate independent flocks.',
  'A change in kit, lot, reader, protocol or lab requires comparability/lot-bridging assessment before extending an existing trend.',
  'Do not pool healthy and problem flocks when constructing a normal reference baseline; retain problem flocks as a separate comparison cohort.',
]
