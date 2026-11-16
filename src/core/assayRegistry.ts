/** Assay discovery registry. Catalog-only entries never unlock clinical calculations. */
export type AssayCatalogEntry = {
 id:string; disease:'IBD'|'ND'|'IBV'|'AIV'|'AE'|'ALV'|'MG'|'MS'|'REO';
 manufacturer:string; name:string; catalog?:string; country?:string;
 method:'ELISA'|'HI'|'VN'|'AGID'|'PCR';
 status:'documented'|'catalog-only'|'local-validation-required';
 source:string; note:string;
};
export const ASSAY_CATALOG:AssayCatalogEntry[]=[
{id:'biochek-ck113-ibd',disease:'IBD',manufacturer:'BioChek',name:'FlockChek IBD ELISA',catalog:'CK113',method:'ELISA',status:'documented',source:'https://www.biochek.com/products/infectious-bursal-disease-virus-antibody-test-kit/',note:'IFU/RevB 2025; assay-specific scale/equation.'},
{id:'avivac-ibd',disease:'IBD',manufacturer:'AVIVAC',name:'ELISA-IBD',method:'ELISA',country:'Russia; Iran availability/registration to verify',status:'catalog-only',source:'AVIVAC official catalogue',note:'Exact IFU, conversion algorithm and BTT compatibility pending.'},\n{id:'idexx-ibd-9909260',disease:'IBD',manufacturer:'IDEXX',name:'IDEXX IBD Ab Test',catalog:'99-09260',method:'ELISA',status:'documented',source:'https://www.idexx.com/en/livestock/livestock-tests/poultry-tests/idexx-ibd-ab-test/',note:'Insert 06-01129-18; approximate titre conversion only.'},
{id:'avivac-ib',disease:'IBV',manufacturer:'AVIVAC',name:'ELISA-IB',method:'ELISA',country:'Russia; Iran availability/registration to verify',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Exact IFU/version/formula required.'},
{id:'avivac-nd',disease:'ND',manufacturer:'AVIVAC',name:'ELISA-ND',method:'ELISA',country:'Russia; Iran availability/registration to verify',status:'catalog-only',source:'AVIVAC official English catalogue',note:'ELISA titer is not HI or universal protection threshold.'},
{id:'avivac-aiv',disease:'AIV',manufacturer:'AVIVAC',name:'ELISA-AI',method:'ELISA',country:'Russia; Iran availability/registration to verify',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Specify target antigen (NP/HA), subtype and DIVA intent.'},
{id:'avivac-reo',disease:'REO',manufacturer:'AVIVAC',name:'ELISA-REO',method:'ELISA',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Exact IFU required.'},
{id:'avivac-ae',disease:'AE',manufacturer:'AVIVAC',name:'ELISA-IE/AE',method:'ELISA',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Confirm target and exact IFU.'},
{id:'avivac-alv',disease:'ALV',manufacturer:'AVIVAC',name:'ELISA-ALV',method:'ELISA',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Avian leukosis virus; exact IFU required.'},
{id:'avivac-mg',disease:'MG',manufacturer:'AVIVAC',name:'ELISA-MG',method:'ELISA',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Exact IFU required.'},
{id:'avivac-ms',disease:'MS',manufacturer:'AVIVAC',name:'ELISA-MS',method:'ELISA',status:'catalog-only',source:'AVIVAC official English catalogue',note:'Exact IFU required.'},
{id:'pasouk-nd-hi-antigen',disease:'ND',manufacturer:'Pasouk',name:'ND HI antigen/reagent',method:'HI',country:'Iran',status:'catalog-only',source:'Pasouk company profile',note:'Reagent/antigen, not a complete ELISA kit; validate HAU/RBC/protocol.'},
{id:'pasouk-aiv-hi-antigen',disease:'AIV',manufacturer:'Pasouk',name:'AI HI antigen/reagent',method:'HI',country:'Iran',status:'catalog-only',source:'Pasouk company profile',note:'Specify subtype/strain and validate HAU/RBC/protocol.'}
];
export const findAssayCatalogEntry=(id:string)=>ASSAY_CATALOG.find(x=>x.id===id);
