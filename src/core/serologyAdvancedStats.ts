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
export function analyzePairedRounds(previousValues:number[],previousIds:string[],currentValues:number[],currentIds:string[],scale:'titre'|'continuous'):PairedAnalysis|null {
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
  return scale==='titre'?{...base,fourFoldOrGreater:pairs.filter(p=>p.next/p.old>=4).length,quarterOrLess:pairs.filter(p=>p.next/p.old<=0.25).length}:{...base,fourFoldOrGreater:null,quarterOrLess:null}
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
