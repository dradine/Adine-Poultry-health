/**
 * Assay catalog seed for UI discovery. Entries marked catalog-only are selectable
 * for descriptive analysis/import mapping, but must NOT unlock numeric vaccination
 * calculations until the exact IFU, kit lot/version and method are validated.
 */
export type AssayCatalogEntry = {
  id: string; disease: 'IBD'|'ND'|'IBV'|'AIV'|'AE'|'MG'|'MS'|'REO';
  manufacturer: string; name: string; catalog?: string; country?: string;
  method: 'ELISA'|'HI'|'VN'|'AGID'|'PCR';
  status: 'documented'|'catalog-only'|'local-validation-required';
  source: string; note: string;
};
export const ASSAY_CATALOG: AssayCatalogEntry[] = [
 {id:'biochek-ck113-ibd',disease:'IBD',manufacturer:'BioChek',name:'FlockChek IBD ELISA',catalog:'CK113',method:'ELISA',status:'documented',source:'https://www.biochek.com/products/infectious-bursal-disease-virus-antibody-test-kit/',note:'IFU/RevB 2025; use its own assay scale and x/y equation.'},
 {id:'idexx-ibd-9909260',disease:'IBD',manufacturer:'IDEXX',name:'IDEXX IBD Ab Test',catalog:'99-09260',method:'ELISA',status:'documented',source:'https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ibd-ab-test/',note:'Insert 06-01129-18; rough titre conversion, no universal protection inference.'},
 {id:'avivac-ib',disease:'IBV',manufacturer:'AVIVAC',name:'ELISA-IB',method:'ELISA',country:'Russia (distributed in Iran; verify local registration)',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Exact product IFU, version and titer formula required before quantitative use.'},
 {id:'avivac-nd',disease:'ND',manufacturer:'AVIVAC',name:'ELISA-ND',method:'ELISA',country:'Russia (distributed in Iran; verify local registration)',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Do not equate ELISA titers with HI or protection threshold.'},
 {id:'avivac-aiv',disease:'AIV',manufacturer:'AVIVAC',name:'ELISA-AI',method:'ELISA',country:'Russia (distributed in Iran; verify local registration)',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Specify antigen subtype/target (NP vs HA) and intended DIVA use.'},
 {id:'avivac-reo',disease:'REO',manufacturer:'AVIVAC',name:'ELISA-REO',method:'ELISA',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Exact IFU needed.'},
 {id:'avivac-ae',disease:'AE',manufacturer:'AVIVAC',name:'ELISA-IE/AE',method:'ELISA',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Confirm naming/target and exact IFU.'},
 {id:'avivac-alv',disease:'AE',manufacturer:'AVIVAC',name:'ELISA-ALV',method:'ELISA',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Avian leukosis virus; disease mapping must be corrected to ALV in production catalog.'},
 {id:'avivac-mg',disease:'MG',manufacturer:'AVIVAC',name:'ELISA-MG',method:'ELISA',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Exact IFU needed.'},
 {id:'avivac-ms',disease:'MS',manufacturer:'AVIVAC',name:'ELISA-MS',method:'ELISA',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Exact IFU needed.'},
 {id:'pasouk-nd-hi-antigen',disease:'ND',manufacturer:'Pasouk',name:'ND HI antigen (diagnostic reagent)',method:'HI',country:'Iran',status:'catalog-only',source:'Pasouk company profile',note:'This is antigen/reagent, not a ready-to-run ELISA kit; protocol/HAU/RBC validation required.'},
 {id:'pasouk-aiv-hi-antigen',disease:'AIV',manufacturer:'Pasouk',name:'AI HI antigen (diagnostic reagent)',method:'HI',country:'Iran',status:'catalog-only',source:'Pasouk company profile',note:'Specify subtype/strain, HAU and RBC protocol; reagent is not itself a complete assay kit.'},
];
export function findAssayCatalogEntry(id: string) { return ASSAY_CATALOG.find(x=>x.id===id); }
