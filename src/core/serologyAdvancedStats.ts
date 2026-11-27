export type MeanInterval = { n:number; mean:number; sd:number; lower:number; upper:number; confidenceLevel:number }
export type PairedAnalysis = {
  n:number; unmatchedPrevious:number; unmatchedCurrent:number
  meanDifference:number|null; differenceInterval:MeanInterval|null
  geometricMeanFoldChange:number|null; foldChangeInterval:MeanInterval|null
  increased:number; decreased:number; unchanged:number
  fourFoldOrGreater:number|null; quarterOrLess:number|null
}
const T95=[0,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131,2.120,2.110,2.101,2.093,2.086,2.080,2.074,2.069,2.064,2.060,2.056,2.052,2.048,2.045,2.042]
export function tCritical95(df:number):number {
  if(!Number.isInteger(df)||df<1) throw new Error('درجه آزادی باید عدد صحیح مثبت باشد.')
  if(df<=30)return T95[df]
  const z=1.959963984540054,nu=df,z2=z*z,z3=z2*z,z5=z3*z2,z7=z5*z2
  return z+(z3+z)/(4*nu)+(5*z5+16*z3+3*z)/(96*nu**2)+(3*z7+19*z5+17*z3-15*z)/(384*nu**3)
}
export function meanConfidenceInterval(values:number[],confidenceLevel=0.95):MeanInterval|null {
  if(!Number.isFinite(confidenceLevel)||confidenceLevel!==0.95) throw new Error('در این نسخه فقط فاصله اطمینان ۹۵٪ پیاده‌سازی شده است.')
  if(values.length<2||values.some(v=>!Number.isFinite(v))) return null
  const n=values.length,mean=values.reduce((a,b)=>a+b,0)/n
  const variance=values.reduce((a,v)=>a+(v-mean)**2,0)/(n-1),sd=Math.sqrt(variance)
  const margin=tCritical95(n-1)*sd/Math.sqrt(n)
  return {n,mean,sd,lower:mean-margin,upper:mean+margin,confidenceLevel}
}
export function geometricMeanConfidenceInterval(titres:number[]):MeanInterval|null {
  if(titres.length<2||titres.some(v=>!Number.isFinite(v)||v<=0)) return null
  const logs=titres.map(Math.log2),ci=meanConfidenceInterval(logs)
  if(!ci)return null
  return {n:ci.n,mean:2**ci.mean,sd:ci.sd,lower:2**ci.lower,upper:2**ci.upper,confidenceLevel:ci.confidenceLevel}
}
export function analyzePairedRounds(previousValues:number[],previousIds:string[],currentValues:number[],currentIds:string[],scale:'titre'|'continuous',fourFoldEnabled=true):PairedAnalysis|null {
  if(previousIds.length!==previousValues.length||currentIds.length!==currentValues.length||!previousIds.length||!currentIds.length) return null
  if(new Set(previousIds).size!==previousIds.length||new Set(currentIds).size!==currentIds.length) return null
  if(previousValues.some(v=>!Number.isFinite(v)||(scale==='titre'?v<=0:v<0))||currentValues.some(v=>!Number.isFinite(v)||(scale==='titre'?v<=0:v<0))) return null
  const old=new Map(previousIds.map((id,i)=>[id,previousValues[i]]))
  const now=new Map(currentIds.map((id,i)=>[id,currentValues[i]]))
  const ids=previousIds.filter(id=>now.has(id))
  if(ids.length<2)return null
  const pairs=ids.map(id=>({old:old.get(id) as number,next:now.get(id) as number}))
  const changes=pairs.map(p=>scale==='titre'?Math.log2(p.next/p.old):p.next-p.old)
  const ci=meanConfidenceInterval(changes)
  const increased=pairs.filter(p=>p.next>p.old).length,decreased=pairs.filter(p=>p.next<p.old).length
  const base={n:pairs.length,unmatchedPrevious:previousIds.length-ids.length,unmatchedCurrent:currentIds.length-ids.length,meanDifference:scale==='continuous'?ci?.mean??null:null,differenceInterval:scale==='continuous'?ci:null,geometricMeanFoldChange:scale==='titre'&&ci?2**ci.mean:null,foldChangeInterval:scale==='titre'&&ci?{...ci,mean:2**ci.mean,lower:2**ci.lower,upper:2**ci.upper}:null,increased,decreased,unchanged:pairs.length-increased-decreased}
  return scale==='titre'?{...base,fourFoldOrGreater:fourFoldEnabled?pairs.filter(p=>p.next/p.old>=4).length:null,quarterOrLess:fourFoldEnabled?pairs.filter(p=>p.next/p.old<=0.25).length:null}:{...base,fourFoldOrGreater:null,quarterOrLess:null}
}
export function wilsonInterval(successes:number,total:number,z=1.96):{lower:number;upper:number}|null {
  if(!Number.isInteger(successes)||!Number.isInteger(total)||total<1||successes<0||successes>total)return null
  const p=successes/total,z2=z*z,den=1+z2/total,center=(p+z2/(2*total))/den
  const half=z*Math.sqrt((p*(1-p)+z2/(4*total))/total)/den
  return {lower:Math.max(0,center-half),upper:Math.min(1,center+half)}
}
export function calculateSeropositivity(values:number[],cutoff:number,direction:'above'|'below',cutoffSource:string):{positive:number;total:number;percent:number;interval:{lower:number;upper:number}}|null {
  if(!Number.isFinite(cutoff)||!cutoffSource.trim()||!values.length||values.some(v=>!Number.isFinite(v)))return null
  const positive=values.filter(v=>direction==='above'?v>=cutoff:v<=cutoff).length
  const interval=wilsonInterval(positive,values.length)
  return interval?{positive,total:values.length,percent:positive/values.length*100,interval:{lower:interval.lower*100,upper:interval.upper*100}}:null
}


export type IndependentRoundComparison = {
  nPrevious:number; nCurrent:number
  meanDifference:number; standardError:number; degreesFreedom:number
  lower:number; upper:number; hedgesG:number|null
  geometricMeanPrevious:number|null; geometricMeanCurrent:number|null
  geometricMeanFoldChange:number|null; foldChangeLower:number|null; foldChangeUpper:number|null
}
/**
 * Welch comparison for two independent rounds. Titre values are analysed on log2 scale.
 * Intended for explicitly independent samples; this is not a paired-bird analysis.
 */
export function compareIndependentRounds(previous:number[],current:number[],scale:'titre'|'continuous'):IndependentRoundComparison|null {
  if(previous.length<2||current.length<2)return null
  const valid=(xs:number[])=>xs.every(v=>Number.isFinite(v)&&(scale==='titre'?v>0:v>=0))
  if(!valid(previous)||!valid(current))return null
  const transform=(xs:number[])=>scale==='titre'?xs.map(Math.log2):xs
  const a=transform(previous),b=transform(current)
  const mean=(xs:number[])=>xs.reduce((s,v)=>s+v,0)/xs.length
  const variance=(xs:number[])=>xs.reduce((s,v)=>s+(v-mean(xs))**2,0)/(xs.length-1)
  const ma=mean(a),mb=mean(b),va=variance(a),vb=variance(b)
  const aa=va/a.length,bb=vb/b.length,se=Math.sqrt(aa+bb)
  const denominator=(aa*aa)/(a.length-1)+(bb*bb)/(b.length-1)
  const df=denominator>0?((aa+bb)**2)/denominator:a.length+b.length-2
  const critical=tCritical95(Math.max(1,Math.floor(df)))
  const difference=mb-ma,lower=difference-critical*se,upper=difference+critical*se
  const pooledVariance=((a.length-1)*va+(b.length-1)*vb)/(a.length+b.length-2)
  const pooledSd=Math.sqrt(pooledVariance)
  const correction=1-3/(4*(a.length+b.length)-9)
  const hedgesG=pooledSd>0?correction*difference/pooledSd:null
  if(scale==='titre')return {
    nPrevious:previous.length,nCurrent:current.length,meanDifference:difference,standardError:se,degreesFreedom:df,
    lower,upper,hedgesG,
    geometricMeanPrevious:2**ma,geometricMeanCurrent:2**mb,
    geometricMeanFoldChange:2**difference,foldChangeLower:2**lower,foldChangeUpper:2**upper,
  }
  return {
    nPrevious:previous.length,nCurrent:current.length,meanDifference:difference,standardError:se,degreesFreedom:df,
    lower,upper,hedgesG,
    geometricMeanPrevious:null,geometricMeanCurrent:null,geometricMeanFoldChange:null,foldChangeLower:null,foldChangeUpper:null,
  }
}


export type BootstrapInterval = {
  n:number; mean:number; lower:number; upper:number
  confidenceLevel:number; replicates:number; seed:string
}
function seededRandom(seed:string):()=>number {
  let state=2166136261
  for(let i=0;i<seed.length;i++)state=Math.imul(state^seed.charCodeAt(i),16777619)>>>0
  return ()=>{
    state=(state+0x6D2B79F5)>>>0
    let t=state
    t=Math.imul(t^(t>>>15),t|1)
    t^=t+Math.imul(t^(t>>>7),t|61)
    return ((t^(t>>>14))>>>0)/4294967296
  }
}
function percentile(sorted:number[],p:number):number {
  const position=(sorted.length-1)*p,lower=Math.floor(position)
  return sorted[lower]+(sorted[Math.ceil(position)]-sorted[lower])*(position-lower)
}
/** Deterministic percentile bootstrap CI; seed should be a stable run identifier. */
export function bootstrapMeanConfidenceInterval(values:number[],seed:string,replicates=2000):BootstrapInterval|null {
  if(values.length<2||values.some(v=>!Number.isFinite(v))||!seed.trim())return null
  if(!Number.isInteger(replicates)||replicates<500||replicates>20000)throw new Error('تعداد بازنمونه‌گیری باید عدد صحیح بین ۵۰۰ تا ۲۰۰۰۰ باشد.')
  const random=seededRandom(seed),n=values.length
  const mean=values.reduce((a,b)=>a+b,0)/n
  const estimates=Array.from({length:replicates},()=>{
    let total=0
    for(let i=0;i<n;i++)total+=values[Math.floor(random()*n)]
    return total/n
  }).sort((a,b)=>a-b)
  return {n,mean,lower:percentile(estimates,.025),upper:percentile(estimates,.975),confidenceLevel:.95,replicates,seed}
}
export function bootstrapGeometricMeanConfidenceInterval(titres:number[],seed:string,replicates=2000):BootstrapInterval|null {
  if(titres.length<2||titres.some(v=>!Number.isFinite(v)||v<=0))return null
  const ci=bootstrapMeanConfidenceInterval(titres.map(Math.log2),seed+':log2',replicates)
  if(!ci)return null
  return {...ci,mean:2**ci.mean,lower:2**ci.lower,upper:2**ci.upper,seed}
}
