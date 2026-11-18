export type DiagnosticKit = {
  id: string
  disease: 'IBD' | 'ND' | 'IBV' | 'AIV'
  brand: string
  catalog: string
  assay: string
  format: string
  sample: string
  intendedUse: string
  documentedSource: string
  sourceUrl: string
  evidenceStatus: 'manufacturer-source' | 'manufacturer-catalog' | 'market-not-confirmed'
  iranMarket: 'not-confirmed' | 'reported-in-publication'
  notes: string
}

// Seed catalog only: product-level specifications must be checked against the current IFU/version.
// "Market not confirmed" intentionally does not imply availability in Iran.
export const diagnosticKitCatalog: DiagnosticKit[] = [
  {
    id: 'biochek-ck113-ibd', disease: 'IBD', brand: 'BioChek', catalog: 'CK113',
    assay: 'IBD antibody', format: 'Indirect ELISA', sample: 'Chicken serum',
    intendedUse: 'Antibody monitoring; vaccine response/flock monitoring; vaccination-date prediction (manufacturer describes this use)',
    documentedSource: 'BioChek product page',
    sourceUrl: 'https://www.biochek.com/products/infectious-bursal-disease-virus-antibody-test-kit/',
    evidenceStatus: 'manufacturer-source', iranMarket: 'reported-in-publication',
    notes: 'Do not transfer BTT/thresholds between kits. Confirm current IFU, antigen and calibration.'
  },
  {
    id: 'idexx-ibd-ab', disease: 'IBD', brand: 'IDEXX', catalog: '99-09260',
    assay: 'IBD antibody', format: 'Indirect ELISA', sample: 'Chicken serum',
    intendedUse: 'Quantitative antibody measurement; immune status monitoring and vaccine timing support',
    documentedSource: 'IDEXX product page',
    sourceUrl: 'https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ibd-ab-test/',
    evidenceStatus: 'manufacturer-source', iranMarket: 'not-confirmed',
    notes: 'Confirm current kit-specific software, reference ranges and manual.'
  },
  {
    id: 'biochek-ck119-ibv', disease: 'IBV', brand: 'BioChek', catalog: 'CK119',
    assay: 'IBV antibody', format: 'Indirect ELISA', sample: 'Chicken serum',
    intendedUse: 'Field infection screening, vaccine-response monitoring and flock monitoring over time',
    documentedSource: 'BioChek product page',
    sourceUrl: 'https://www.biochek.com/products/ibv-infectious-bronchitis-virus-antibody-test-kit/',
    evidenceStatus: 'manufacturer-source', iranMarket: 'reported-in-publication',
    notes: 'Antibody results are assay-specific; avoid interpreting ELISA titres as strain-specific protection.'
  },
  {
    id: 'biochek-ck116-ndv', disease: 'ND', brand: 'BioChek', catalog: 'CK116',
    assay: 'NDV antibody', format: 'Indirect ELISA', sample: 'Chicken serum',
    intendedUse: 'Field infection screening, vaccine-response monitoring and flock monitoring over time',
    documentedSource: 'BioChek product page',
    sourceUrl: 'https://www.biochek.com/products/newcastle-disease-virus-antibody-test-kit/',
    evidenceStatus: 'manufacturer-source', iranMarket: 'not-confirmed',
    notes: 'Manufacturer reports correlation with HI; ELISA is not itself a direct protection test.'
  },
  {
    id: 'idexx-ai-ab', disease: 'AIV', brand: 'IDEXX', catalog: '99-09269',
    assay: 'Avian influenza antibody', format: 'Indirect ELISA', sample: 'Chicken serum',
    intendedUse: 'Detection/monitoring of antibodies to avian influenza viruses',
    documentedSource: 'IDEXX product page',
    sourceUrl: 'https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ai-ab-test/',
    evidenceStatus: 'manufacturer-source', iranMarket: 'not-confirmed',
    notes: 'Serology alone is not confirmation of current infection; interpret with surveillance, vaccination and molecular/official testing.'
  },
  {
    id: 'idexx-ai-multis', disease: 'AIV', brand: 'IDEXX', catalog: '99-12119',
    assay: 'Avian influenza antibody multi-species', format: 'Blocking ELISA', sample: 'Serum from multiple avian species',
    intendedUse: 'Detection of avian influenza antibodies across multiple avian species',
    documentedSource: 'IDEXX product page',
    sourceUrl: 'https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ai-multis-screen-ab-test/',
    evidenceStatus: 'manufacturer-source', iranMarket: 'not-confirmed',
    notes: 'Different species and assay format can affect interpretation; check current IFU.'
  },
  {
    id: 'biochek-ck121-aiv', disease: 'AIV', brand: 'BioChek', catalog: 'CK121',
    assay: 'Avian influenza type A antibody', format: 'Indirect ELISA', sample: 'Chicken serum',
    intendedUse: 'Screening for exposure to type A AI and monitoring inactivated vaccination',
    documentedSource: 'BioChek product page; WOAH register',
    sourceUrl: 'https://www.biochek.com/products/avian-influenza-antibody-test-kit/',
    evidenceStatus: 'manufacturer-source', iranMarket: 'not-confirmed',
    notes: 'WOAH validation status must be verified against the current register and intended purpose before presenting as an official status.'
  },
  {
    id: 'idvet-aiv-ab', disease: 'AIV', brand: 'IDvet / ID Screen', catalog: 'Catalog number to verify',
    assay: 'Influenza A NP antibody', format: 'Competitive ELISA', sample: 'Serum',
    intendedUse: 'Antibody screening for Influenza A',
    documentedSource: 'IDvet/ID Screen product family and published use',
    sourceUrl: 'https://www.id-vet.com/',
    evidenceStatus: 'manufacturer-catalog', iranMarket: 'not-confirmed',
    notes: 'Exact product number, IFU, cut-off and distribution must be verified before this entry is selectable for calculations.'
  }
]

export const diseaseCatalogMeta = {
  IBD: { title: 'گامبورو', availableMethods: ['ELISA antibody'], methodWarning: 'Deventer-style model requires kit-specific titre scale, BTT and half-life evidence.' },
  ND: { title: 'نیوکاسل', availableMethods: ['HI', 'ELISA antibody'], methodWarning: 'HI log2 endpoint and ELISA titre are not interchangeable. HI antigen/strain and laboratory SOP should be recorded.' },
  IBV: { title: 'برونشیت عفونی', availableMethods: ['ELISA antibody', 'HI-log2', 'VN'], methodWarning: 'Different assay methods and units must not be combined in a single trend.' },
  AIV: { title: 'آنفلوانزا', availableMethods: ['Indirect ELISA', 'Competitive ELISA', 'Blocking ELISA', 'HI', 'RT-PCR'], methodWarning: 'Serology is surveillance evidence; it does not confirm active infection or pathogenicity.' }
} as const
