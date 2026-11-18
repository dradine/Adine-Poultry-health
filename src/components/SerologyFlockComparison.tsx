import type { LocalFlock,LocalModelRun } from '../core/localFirstDb'
import { areComparableFlockRounds } from '../core/serologyStats'
import { geometricMeanConfidenceInterval,meanConfidenceInterval } from '../core/serologyAdvancedStats'
const nums=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='number'&&Number.isFinite(x))?v as number[]:[]
const f=(v:number)=>v.toLocaleString('fa-IR',{maximumFractionDigits:1})
export default function SerologyFlockComparison({run,runs,flocks}:{run:LocalModelRun;runs:LocalModelRun[];flocks:LocalFlock[]}){
 const input=run.input_snapshot,scale=String(input.scale||''),isTitre=scale==='kit-titer'||scale==='hi-reciprocal'
 const candidates=runs.filter(x=>x.id!==run.id&&x.model_family==='serology-longitudinal-round'&&areComparableFlockRounds({flockId:run.flock_id,diseaseCode:run.disease_code,input},{flockId:x.flock_id,diseaseCode:x.disease_code,input:x.input_snapshot}))
 const byFlock=new Map<string,LocalModelRun>()
 for(const x of candidates){const old=byFlock.get(x.flock_id);if(!old||String(x.input_snapshot.samplingDate||'')>String(old.input_snapshot.samplingDate||''))byFlock.set(x.flock_id,x)}
 const selected=[run,...byFlock.values()].map(x=>{
  const v=nums(x.input_snapshot.titers),ci=isTitre?geometricMeanConfidenceInterval(v):meanConfidenceInterval(v)
  const mean=v.length?v.reduce((a,b)=>a+b,0)/v.length:0,sd=v.length>1?Math.sqrt(v.reduce((a,z)=>a+(z-mean)**2,0)/(v.length-1)):0
  const flock=flocks.find(z=>z.id===x.flock_id)
  return {id:x.flock_id,label:flock?.location_label?flock.flock_name+' · '+flock.location_label:flock?.flock_name||x.flock_id.slice(0,8),n:v.length,mean:ci?.mean??null,lower:ci?.lower??null,upper:ci?.upper??null,cv:mean?sd/mean*100:null}
 }).filter(x=>x.mean!==null&&x.lower!==null&&x.upper!==null)
 if(selected.length<2)return <section className="srs-chart-card"><h4>مقایسه بین گله‌ها / سالن‌ها</h4><p className="srs-note">فعلاً گله دیگری با همان آزمون، Lot، ماتریس، آنتی‌ژن، Reader، پروتکل، سن نزدیک، هدف نمونه‌گیری، برنامه واکسن و فاصله پس از واکسن و QC معتبر پیدا نشد. این محدودیت عمدی است تا گله‌های ناهمسان با هم مقایسه نشوند.</p></section>
 const min=Math.min(...selected.map(x=>x.lower as number)),max=Math.max(...selected.map(x=>x.upper as number)),span=max-min||1
 const width=600,height=selected.length*48+35,x=(v:number)=>185+(v-min)/span*370
 return <section className="srs-chart-card"><h4>مقایسه هم‌شرایط بین گله‌ها و سالن‌ها</h4><p className="srs-note">این مقایسه فقط پس از تطبیق کامل آزمون و نزدیک‌بودن سن و برنامه واکسن ساخته شده است. نقاط، {isTitre?'GMT':'میانگین حسابی'} و خطوط، فاصله اطمینان ۹۵٪ هر گله را نشان می‌دهند؛ این نمودار رتبه‌بندی حفاظت یا اثبات تفاوت آماری نیست.</p>
 <svg className="srs-chart" viewBox={'0 0 '+width+' '+height} role="img" aria-label="مقایسه فاصله اطمینان میان گله‌های هم‌شرایط">
 {selected.map((z,i)=>{const y=24+i*48;return <g key={z.id}><text x="175" y={y+4} textAnchor="end" fontSize="11" fill="currentColor">{z.label.slice(0,24)}</text><line x1={x(z.lower as number)} x2={x(z.upper as number)} y1={y} y2={y} stroke="#287b55" strokeWidth="3"/><line x1={x(z.lower as number)} x2={x(z.lower as number)} y1={y-6} y2={y+6} stroke="#287b55" strokeWidth="2"/><line x1={x(z.upper as number)} x2={x(z.upper as number)} y1={y-6} y2={y+6} stroke="#287b55" strokeWidth="2"/><circle cx={x(z.mean as number)} cy={y} r="5" fill="#174d35"/><text x="565" y={y+4} textAnchor="end" fontSize="10" fill="currentColor">{f(z.mean as number)} · n={z.n}</text></g>})}
 </svg>
 <div className="srs-table-wrap"><table className="srs-table"><thead><tr><th>گله / سالن</th><th>n</th><th>{isTitre?'GMT':'میانگین'}</th><th>CI ۹۵٪</th><th>CV٪</th></tr></thead><tbody>{selected.map(x=><tr key={x.id}><td>{x.label}</td><td>{x.n}</td><td>{f(x.mean as number)}</td><td>{f(x.lower as number)} تا {f(x.upper as number)}</td><td>{x.cv===null?'—':f(x.cv)}</td></tr>)}</tbody></table></div>
 </section>
}
