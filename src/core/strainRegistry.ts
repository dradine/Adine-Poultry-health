export type StrainDisease = 'IBD' | 'ND' | 'IBV' | 'AIV'
export type StrainRole = 'vaccine' | 'assay-antigen' | 'field-reference' | 'vector' | 'platform'
export type StrainRecord = {
  id:string; disease:StrainDisease; name:string; category:string; role:StrainRole[];
  antigenTarget?:string; genotypeOrSubtype?:string; evidence:'common-reference'|'manufacturer-reference'|'user-added';
  caution?:string; source?:string
}
export const STRAIN_BANK:StrainRecord[]=[
 {id:'ibd-d78',disease:'IBD',name:'D78',category:'Intermediate vaccine',role:['vaccine'],evidence:'common-reference',caution:'Class/strength and product-specific label must be verified.'},
 {id:'ibd-228e',disease:'IBD',name:'228E',category:'Intermediate vaccine',role:['vaccine'],evidence:'common-reference'},
 {id:'ibd-w2512',disease:'IBD',name:'Winterfield 2512 / W2512',category:'Intermediate vaccine',role:['vaccine'],evidence:'common-reference'},
 {id:'ibd-lukert',disease:'IBD',name:'Lukert',category:'Intermediate vaccine',role:['vaccine'],evidence:'common-reference'},
 {id:'ibd-bursine2',disease:'IBD',name:'Bursine 2',category:'Intermediate vaccine',role:['vaccine'],evidence:'manufacturer-reference'},
 {id:'ibd-variant',disease:'IBD',name:'IBDV Variant (specify isolate)',category:'Variant / field',role:['field-reference','assay-antigen'],evidence:'common-reference',caution:'Variant designation is not a unique isolate; record isolate/genotype and source.'},
 {id:'ibd-immune-complex',disease:'IBD',name:'Immune-complex platform (product-specific)',category:'Immune-complex',role:['platform','vaccine'],evidence:'manufacturer-reference',caution:'Do not use conventional live-vaccine Deventer estimator without platform-specific validation.'},
 {id:'ibd-hvt-vp2',disease:'IBD',name:'HVT-VP2 vector',category:'Viral vector',role:['platform','vector','vaccine'],evidence:'manufacturer-reference',caution:'Anti-VP2 response and anti-HVT vector antibody are not the same assay target; no conventional Deventer calculation.'},
 {id:'ibd-genogroup-g2',disease:'IBD',name:'Genogroup G2 (reference)',category:'Genogroup / molecular reference',role:['field-reference','assay-antigen'],evidence:'common-reference',caution:'Genogroup is a molecular classification, not an individual strain or vaccine label.'},
 {id:'ibd-genogroup-g7',disease:'IBD',name:'Genogroup G7 (reference)',category:'Genogroup / molecular reference',role:['field-reference','assay-antigen'],evidence:'common-reference',caution:'Genogroup is a molecular classification, not an individual strain or vaccine label.'},
 {id:'ibd-other',disease:'IBD',name:'Other / custom IBDV strain',category:'Manual entry',role:['vaccine','assay-antigen','field-reference'],evidence:'user-added'},
 {id:'nd-lasota',disease:'ND',name:'LaSota',category:'Live vaccine reference',role:['vaccine','assay-antigen'],evidence:'common-reference',source:'https://www.aphis.usda.gov/product-summaries-animal-species-chicken'},
 {id:'nd-b1',disease:'ND',name:'Hitchner B1',category:'Live vaccine reference',role:['vaccine','assay-antigen'],evidence:'common-reference',source:'https://www.aphis.usda.gov/product-summaries-animal-species-chicken'},
 {id:'nd-clone30',disease:'ND',name:'Clone 30',category:'Live vaccine reference',role:['vaccine','assay-antigen'],evidence:'common-reference'},
 {id:'nd-vg-ga',disease:'ND',name:'VG/GA',category:'Live vaccine reference',role:['vaccine'],evidence:'manufacturer-reference'},
 {id:'nd-ulster2c',disease:'ND',name:'Ulster 2C',category:'Live vaccine reference',role:['vaccine'],evidence:'manufacturer-reference'},
 {id:'nd-komarov',disease:'ND',name:'Komarov',category:'Vaccine reference',role:['vaccine'],evidence:'common-reference'},
 {id:'nd-mukteswar',disease:'ND',name:'Mukteswar',category:'Vaccine reference',role:['vaccine'],evidence:'common-reference',caution:'Higher virulence/pathogenicity profile; record only for documentation, not a vaccine recommendation.'},
 {id:'nd-genotype7',disease:'ND',name:'Genotype VII (field/reference)',category:'Field genotype',role:['field-reference','assay-antigen'],evidence:'common-reference',caution:'Genotype is not an isolate name; add sequence/isolate ID and collection date.'},
 {id:'nd-other',disease:'ND',name:'Other / custom isolate',category:'Manual entry',role:['vaccine','assay-antigen','field-reference'],evidence:'user-added'},
 {id:'ibv-h120',disease:'IBV',name:'H120',category:'Massachusetts vaccine',role:['vaccine','assay-antigen'],evidence:'common-reference',source:'https://doi.org/10.3390/ani10112058'},
 {id:'ibv-h52',disease:'IBV',name:'H52',category:'Massachusetts vaccine',role:['vaccine','assay-antigen'],evidence:'common-reference',source:'https://doi.org/10.3390/ani10112058'},
 {id:'ibv-ma5',disease:'IBV',name:'Ma5',category:'Massachusetts vaccine',role:['vaccine','assay-antigen'],evidence:'common-reference',source:'https://doi.org/10.3390/ani10112058'},
 {id:'ibv-m41',disease:'IBV',name:'M41',category:'Massachusetts vaccine',role:['vaccine','assay-antigen'],evidence:'common-reference',source:'https://doi.org/10.3390/ani10112058'},
 {id:'ibv-491',disease:'IBV',name:'4/91',category:'Variant vaccine',role:['vaccine','assay-antigen'],evidence:'common-reference',caution:'Verify product label and isolate; vaccine lineage designation does not guarantee cross-protection against field variants.'},
 {id:'ibv-qx',disease:'IBV',name:'QX / QX-like',category:'Field genotype reference',role:['field-reference','assay-antigen'],evidence:'common-reference',caution:'Genotype/variant reference, not interchangeable with vaccine strain.'},
 {id:'ibv-variant2',disease:'IBV',name:'Variant 2',category:'Variant vaccine/reference',role:['vaccine','field-reference','assay-antigen'],evidence:'common-reference'},
 {id:'ibv-b793',disease:'IBV',name:'B793 / 793B (verify label)',category:'Vaccine/variant reference',role:['vaccine','field-reference','assay-antigen'],evidence:'common-reference',caution:'Do not assume equivalence to 4/91 without product-specific evidence.'},
 {id:'ibv-ark',disease:'IBV',name:'Arkansas (Ark-type)',category:'Variant vaccine',role:['vaccine','field-reference','assay-antigen'],evidence:'common-reference'},
 {id:'ibv-conn',disease:'IBV',name:'Connecticut (Conn-type)',category:'Variant vaccine',role:['vaccine','field-reference','assay-antigen'],evidence:'common-reference'},
 {id:'ibv-d274',disease:'IBV',name:'D274',category:'Vaccine/reference strain',role:['vaccine','field-reference','assay-antigen'],evidence:'common-reference',source:'https://doi.org/10.3390/ani10112058'},
 {id:'ibv-196',disease:'IBV',name:'1/96',category:'Vaccine strain',role:['vaccine','assay-antigen'],evidence:'common-reference',source:'https://doi.org/10.3390/ani10112058'},
 {id:'ibv-dmv',disease:'IBV',name:'DMV/1639-like',category:'Field genotype reference',role:['field-reference','assay-antigen'],evidence:'common-reference'},
 {id:'ibv-other',disease:'IBV',name:'Other / custom isolate',category:'Manual entry',role:['vaccine','assay-antigen','field-reference'],evidence:'user-added'},
 {id:'aiv-h5',disease:'AIV',name:'H5 (specify clade/lineage)',category:'Subtype',role:['vaccine','assay-antigen','field-reference'],genotypeOrSubtype:'H5',evidence:'common-reference',caution:'Subtype alone is insufficient: record clade, isolate, date, and HA/NP target when available.'},
 {id:'aiv-h9',disease:'AIV',name:'H9N2 (specify lineage)',category:'Subtype',role:['vaccine','assay-antigen','field-reference'],genotypeOrSubtype:'H9N2',evidence:'common-reference',caution:'Subtype alone is insufficient: record lineage and isolate.'},
 {id:'aiv-h7',disease:'AIV',name:'H7 (specify subtype)',category:'Subtype',role:['assay-antigen','field-reference'],genotypeOrSubtype:'H7',evidence:'common-reference'},
 {id:'aiv-h6',disease:'AIV',name:'H6 (specify subtype)',category:'Subtype',role:['assay-antigen','field-reference'],genotypeOrSubtype:'H6',evidence:'common-reference'},
 {id:'aiv-np',disease:'AIV',name:'Influenza A NP antigen (broad antibody target)',category:'Antigen target',role:['assay-antigen'],antigenTarget:'NP',evidence:'manufacturer-reference',caution:'NP serology does not identify subtype or establish active infection.'},
 {id:'aiv-ha',disease:'AIV',name:'HA / subtype-specific antigen (specify)',category:'Antigen target',role:['assay-antigen'],antigenTarget:'HA',evidence:'manufacturer-reference'},
 {id:'aiv-other',disease:'AIV',name:'Other subtype / isolate',category:'Manual entry',role:['vaccine','assay-antigen','field-reference'],evidence:'user-added'}
]
export const strainsForDisease=(disease:StrainDisease,role?:StrainRole)=>STRAIN_BANK.filter(s=>s.disease===disease&&(!role||s.role.includes(role)))
export const strainById=(id:string)=>STRAIN_BANK.find(s=>s.id===id)
