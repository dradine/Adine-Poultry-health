export type SerologyMethod = 'ELISA' | 'HI'
export type SerologyScale = 'unspecified' | 'kit-titer' | 'od' | 'sp' | 'sn' | 'hi-reciprocal'
export type SerologySummary = {
  n:number; arithmeticMean:number; median:number; sampleSd:number; cvPercent:number
  geometricMean:number|null; log2Mean:number|null; log2Sd:number|null
  minimum:number; maximum:number; p5:number; p25:number; p75:number; p90:number
  trendValue:number; trendScale:'log2-titre'|'arithmetic'
}
export function normalizeSerologyDigits(value:string):string {
  return value.replace(/[۰-۹٠-٩]/g,c => {
    const fa='۰۱۲۳۴۵۶۷۸۹'.indexOf(c)
    return String(fa>=0?fa:'٠١٢٣٤٥٦٧٨٩'.indexOf(c))
  }).replace(/[٬،]/g,',').replace(/\u066B/g,'.').replace(/\u00A0/g,' ')
}
export function parseSerologyValues(raw:string, method:SerologyMethod):number[] {
  const normalized=normalizeSerologyDigits(raw).trim()
  if(!normalized) throw new Error('تیترها وارد نشده‌اند.')
  const tokens=normalized.split(/[\s,;؛]+/).filter(Boolean)
  const values=tokens.map((token,index)=>{
    let valueToken=token
    if(method==='HI' && /^1[:/]\d+(?:\.\d+)?$/.test(token)) valueToken=token.slice(2)
    else if(token.includes(':')||token.includes('/')) throw new Error('قالب مقدار شماره '+(index+1)+' نامعتبر است. برای HI از عدد معکوس مانند 16 یا قالب 1:16 استفاده کنید.')
    const value=Number(valueToken)
    if(!Number.isFinite(value)||value<=0) throw new Error('مقدار شماره '+(index+1)+' مثبت و عددی نیست؛ مقادیر نامعتبر بی‌صدا حذف نمی‌شوند.')
    return value
  })
  return values
}
function percentile(sorted:number[],p:number):number {
  return sorted[Math.max(0,Math.ceil(p*sorted.length)-1)]
}
export function summarizeSerology(values:number[],scale:SerologyScale):SerologySummary {
  // Unspecified ELISA values remain eligible for arithmetic descriptive statistics only.
  if(values.length<2) throw new Error('برای خلاصه آماری حداقل دو نمونه لازم است.')
  const isTitre=scale==='kit-titer'||scale==='hi-reciprocal'
  if(values.some(v=>!Number.isFinite(v)||(isTitre?v<=0:v<0))) throw new Error(isTitre?'تیترهای ratio-scale باید مثبت باشند؛ نتیجه صفر/زیر حد تشخیص باید با روش سانسور معتبر مدیریت شود.':'نتایج ELISA باید عددی و غیرمنفی باشند.')
  const sorted=[...values].sort((a,b)=>a-b),n=values.length
  const arithmeticMean=values.reduce((s,v)=>s+v,0)/n
  const median=n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2
  const sampleSd=Math.sqrt(values.reduce((s,v)=>s+(v-arithmeticMean)**2,0)/(n-1))
  const cvPercent=arithmeticMean?sampleSd/arithmeticMean*100:0
  const hasPositiveTitre=isTitre&&values.every(v=>v>0)
  const logs=hasPositiveTitre?values.map(Math.log2):[]
  const log2Mean=hasPositiveTitre?logs.reduce((s,v)=>s+v,0)/n:null
  const log2Sd=hasPositiveTitre&&n>1?Math.sqrt(logs.reduce((s,v)=>s+(v-(log2Mean as number))**2,0)/(n-1)):null
  const geometricMean=hasPositiveTitre?2**(log2Mean as number):null
  return {
    n,arithmeticMean,median,sampleSd,cvPercent,geometricMean,log2Mean,log2Sd,
    minimum:sorted[0],maximum:sorted[n-1],p5:percentile(sorted,.05),p25:percentile(sorted,.25),
    p75:percentile(sorted,.75),p90:percentile(sorted,.90),
    trendValue:hasPositiveTitre?(log2Mean as number):arithmeticMean,
    trendScale:hasPositiveTitre?'log2-titre':'arithmetic',
  }
}
export function parseSampleIds(raw:string):string[] {
  if(!raw.trim()) return []
  const ids=raw.split(/[\s,،;؛]+/).map(x=>x.trim()).filter(Boolean)
  if(new Set(ids).size!==ids.length) throw new Error('شناسه نمونه تکراری است؛ هر پرنده باید شناسه یکتا داشته باشد.')
  return ids
}
export function comparePairedSerology(
  previousValues:number[],previousIds:string[],currentValues:number[],currentIds:string[],scale:SerologyScale
):{n:number;increased:number;decreased:number;unchanged:number;meanFoldChange:number|null;meanDifference:number|null}|null {
  if(!previousIds.length||previousIds.length!==previousValues.length||currentIds.length!==currentValues.length) return null
  const previous=new Map(previousIds.map((id,i)=>[id,previousValues[i]]))
  if(currentIds.some(id=>!previous.has(id))||previousIds.some(id=>!currentIds.includes(id))) return null
  const pairs=currentIds.map((id,i)=>({old:previous.get(id) as number,next:currentValues[i]}))
  const increased=pairs.filter(x=>x.next>x.old).length,decreased=pairs.filter(x=>x.next<x.old).length
  const isTitre=scale==='kit-titer'||scale==='hi-reciprocal'
  return {
    n:pairs.length,increased,decreased,unchanged:pairs.length-increased-decreased,
    meanFoldChange:isTitre?2**(pairs.reduce((s,x)=>s+Math.log2(x.next/x.old),0)/pairs.length):null,
    meanDifference:isTitre?null:pairs.reduce((s,x)=>s+x.next-x.old,0)/pairs.length,
  }
}

export function calculateBioChekVI(arithmeticMean:number,cvPercent:number):number|null {
  if(!Number.isFinite(arithmeticMean)||!Number.isFinite(cvPercent)||arithmeticMean<=0||cvPercent<=0) return null
  return arithmeticMean/cvPercent
}

export type SerologyRoundIdentity={flockId:string;diseaseCode:string;input:Record<string,unknown>}
const commonComparisonFields=['population','method','assayId','kit','catalog','assayVersion','antigen','unit','scale','sampleMatrix','laboratory','readerModel','protocolVersion','kitLot']
const hiComparisonFields=['hiHAU','antigenPretreatment','serumPretreatment','dilutionFactor','rbcSource','rbcLot','rbcConcentration']
const biologicalComparisonFields=['samplingPurpose','vaccinePlatform','vaccine','vaccineStrain','vaccineProgram','vaccineDate']
function hasComparableBiologicalContext(i:Record<string,unknown>):boolean{
 if(typeof i.samplingPurpose!=='string'||!i.samplingPurpose.trim()||typeof i.vaccinePlatform!=='string'||!i.vaccinePlatform.trim()||['unknown','نامشخص','نامعلوم'].includes(i.vaccinePlatform.trim().toLowerCase())||typeof i.randomSamplingConfirmed!=='boolean')return false
 if(i.vaccinePlatform==='unvaccinated')return true
 return ['vaccine','vaccineStrain','vaccineProgram','vaccineDate'].every(k=>typeof i[k]==='string'&&String(i[k]).trim()!==''&&!['unknown','نامشخص','نامعلوم'].includes(String(i[k]).trim().toLowerCase()))
}
function vaccinationHistoryKey(i:Record<string,unknown>):string{
 const events=Array.isArray(i.vaccinationEvents)?i.vaccinationEvents.filter(x=>x&&typeof x==='object').map(x=>{const e=x as Record<string,unknown>;return {date:e.date??null,ageDays:e.ageDays??null,disease:e.disease??'',product:e.product??'',strain:e.strain??'',platform:e.platform??'',route:e.route??'',dose:e.dose??'',coveragePercent:e.coveragePercent??null}}):[]
 return JSON.stringify(events)
}
function comparisonFieldsForRound(r:SerologyRoundIdentity):string[]{
  return r.input.method==='HI'?[...commonComparisonFields,...hiComparisonFields]:commonComparisonFields
}
export function hasCompleteSerologyComparisonMetadata(r:SerologyRoundIdentity):boolean{
  const i=r.input
  if(i.method!=='ELISA'&&i.method!=='HI') return false
  const demoQc=i.demo===true&&i.qcStatus==='demo'
  const readerMeta=i.readerImportMeta&&typeof i.readerImportMeta==='object'?i.readerImportMeta as Record<string,unknown>:null
  const rawQcValid=i.rawFileImported!==true||readerMeta?.qcStatus==='pass'
  const realQc=i.demo!==true&&i.qcStatus==='pass'&&rawQcValid
  if((!demoQc&&!realQc)||typeof i.qcEvidence!=='string'||!i.qcEvidence.trim()) return false
  if(!demoQc&&!hasComparableBiologicalContext(i))return false
  return comparisonFieldsForRound(r).every(k=>{
    const v=i[k]
    return typeof v==='string'&&v.trim().length>0&&!['unknown','نامشخص','نامعلوم','not provided','n/a','na'].includes(v.trim().toLowerCase())
  })
}
export function serologyComparisonKey(r:SerologyRoundIdentity):string|null{
  if(!hasCompleteSerologyComparisonMetadata(r)) return null
  return JSON.stringify([r.flockId,r.diseaseCode,...comparisonFieldsForRound(r).map(k=>r.input[k]),...(r.input.demo===true?[]:[...biologicalComparisonFields.map(k=>r.input[k]),r.input.randomSamplingConfirmed,vaccinationHistoryKey(r.input),...(r.input.method==='ELISA'&&r.input.scale==='kit-titer'?[r.input.fourFoldComparisonSource??'']:[])])])
}
/** Technical assay comparability for descriptive longitudinal plots. Biological context is deliberately shown as annotations, not used to suppress the trend. */
export function areComparableAssayRounds(a:SerologyRoundIdentity,b:SerologyRoundIdentity):boolean{
 if(a.flockId!==b.flockId||a.diseaseCode!==b.diseaseCode)return false
 const x=a.input,y=b.input
 if(x.demo===true||y.demo===true||x.qcStatus!=='pass'||y.qcStatus!=='pass')return false
 const rawQc=(i:Record<string,unknown>)=>i.rawFileImported!==true||(i.readerImportMeta&&typeof i.readerImportMeta==='object'&&(i.readerImportMeta as Record<string,unknown>).qcStatus==='pass')
 if(!rawQc(x)||!rawQc(y))return false
 const fields=[...commonComparisonFields,...(x.method==='HI'||y.method==='HI'?hiComparisonFields:[])]
 return fields.every(k=>(x[k]??'')===(y[k]??''))&&x.method===y.method&&x.scale===y.scale
}
export function areComparableSerologyRounds(a:SerologyRoundIdentity,b:SerologyRoundIdentity):boolean{
  const ka=serologyComparisonKey(a),kb=serologyComparisonKey(b)
  return ka!==null&&ka===kb
}
function daysBetween(a:unknown,b:unknown):number|null{
  if(typeof a!=='string'||typeof b!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(a)||!/^\d{4}-\d{2}-\d{2}$/.test(b))return null
  const x=Date.parse(a+'T00:00:00Z'),y=Date.parse(b+'T00:00:00Z')
  return Number.isFinite(x)&&Number.isFinite(y)?Math.round((x-y)/86400000):null
}
/** Strict cross-flock comparability: same assay identity plus matched biological context. This is not a protection benchmark. */
export function areComparableFlockRounds(a:SerologyRoundIdentity,b:SerologyRoundIdentity):boolean{
  if(a.diseaseCode!==b.diseaseCode||a.flockId===b.flockId)return false
  const x=a.input,y=b.input
  const rawQc=(i:Record<string,unknown>)=>i.rawFileImported!==true||(i.readerImportMeta&&typeof i.readerImportMeta==='object'&&(i.readerImportMeta as Record<string,unknown>).qcStatus==='pass')
  if(x.demo===true||y.demo===true||x.qcStatus!=='pass'||y.qcStatus!=='pass'||!rawQc(x)||!rawQc(y))return false
  if(!commonComparisonFields.every(k=>typeof x[k]==='string'&&typeof y[k]==='string'&&String(x[k]).trim()!==''&&String(x[k])===String(y[k])))return false
  const ax=Number(x.samplingAgeDays),ay=Number(y.samplingAgeDays)
  if(!Number.isFinite(ax)||!Number.isFinite(ay)||Math.abs(ax-ay)>1)return false
  if(typeof x.samplingPurpose!=='string'||!x.samplingPurpose||x.samplingPurpose!==y.samplingPurpose||x.randomSamplingConfirmed!==true||y.randomSamplingConfirmed!==true)return false
  if(typeof x.vaccinePlatform!=='string'||!x.vaccinePlatform||x.vaccinePlatform!==y.vaccinePlatform||x.vaccinePlatform==='unknown')return false
  if(vaccinationHistoryKey(x)!==vaccinationHistoryKey(y))return false
  if(x.vaccinePlatform==='unvaccinated')return true
  for(const k of ['vaccine','vaccineStrain','vaccineProgram','vaccineDate'])if(typeof x[k]!=='string'||!String(x[k]).trim()||x[k]!==y[k])return false
  const dx=daysBetween(x.samplingDate,x.vaccineDate),dy=daysBetween(y.samplingDate,y.vaccineDate)
  return dx!==null&&dy!==null&&dx>=0&&dy>=0&&Math.abs(dx-dy)<=2
}
