import {useEffect,useMemo,useState} from 'react'
import {strainsForDisease,type StrainDisease,type StrainRole} from '../core/strainRegistry'
type Props={disease:StrainDisease}
type Choices={vaccine:string;assay:string;field:string;manualVaccine:string;manualAssay:string;manualField:string;isolateMeta:string}
const storageKey=(d:StrainDisease)=>'adine-strain-selections-v1-'+d
const defaults:Choices={vaccine:'',assay:'',field:'',manualVaccine:'',manualAssay:'',manualField:'',isolateMeta:''}
const roleOptions:{key:'vaccine'|'assay'|'field';label:string;role:StrainRole;manualKey:'manualVaccine'|'manualAssay'|'manualField';hint:string}[]=[
 {key:'vaccine',label:'سویه / پلتفرم واکسن',role:'vaccine',manualKey:'manualVaccine',hint:'نام سویه، محصول یا پلتفرم واکسن'},
 {key:'assay',label:'آنتی‌ژن / سویه آزمون',role:'assay-antigen',manualKey:'manualAssay',hint:'آنتی‌ژن، سویه، کد کیت یا روش آزمایش'},
 {key:'field',label:'سویه میدانی / مرجع',role:'field-reference',manualKey:'manualField',hint:'سویه جداسازی‌شده، ژنوتیپ، lineage یا نمونه مرجع'}
]
export default function StrainSelector({disease}:Props){
 const [choices,setChoices]=useState<Choices>(()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(storageKey(disease))||'{}')}}catch{return defaults}})
 useEffect(()=>{try{localStorage.setItem(storageKey(disease),JSON.stringify(choices))}catch{}},[disease,choices])
 const strains=useMemo(()=>strainsForDisease(disease),[disease])
 const displayName=(id:string,manual:string)=>manual.trim()||strains.find(s=>s.id===id)?.name||''
 const notes=roleOptions.flatMap(item=>{const s=strains.find(x=>x.id===choices[item.key]);return s?.caution?[s.name+': '+s.caution]:[]})
 return <details className="custom-kit-accordion strain-selector"><summary>＋ بانک سویه، آنتی‌ژن و پلتفرم واکسن (اختیاری)</summary>
 <p className="muted">سویه واکسن، آنتی‌ژن کیت و سویه میدانی مستقل ثبت می‌شوند. انتخاب نام به‌تنهایی اثبات تطابق آنتی‌ژنی، حفاظت یا cross-protection نیست. این اطلاعات محلی روی همین مرورگر ذخیره می‌شوند.</p>
 <div className="form-grid">{roleOptions.map(item=><div className="strain-field" key={item.key}><label>{item.label}<select value={choices[item.key]} onChange={e=>setChoices(prev=>({...prev,[item.key]:e.target.value,[item.manualKey]:''}))}><option value="">— انتخاب از بانک —</option>{strains.filter(s=>s.role.includes(item.role)).map(s=><option key={s.id} value={s.id}>{s.name} · {s.category}</option>)}</select></label><label className="strain-manual">ورود دستی / نام دقیق<input value={choices[item.manualKey]} placeholder={item.hint} onChange={e=>setChoices(prev=>({...prev,[item.manualKey]:e.target.value}))}/></label></div>)}
 <label>اطلاعات تکمیلی سویه / آنتی‌ژن<input value={choices.isolateMeta} onChange={e=>setChoices(prev=>({...prev,isolateMeta:e.target.value}))} placeholder="کد isolate، ژنوتیپ، lineage/clade، سال، منبع، target (HA/NP/VP2…)" /></label></div>
 <div className="strain-summary"><b>ثبت انتخاب‌ها</b><p>واکسن: {displayName(choices.vaccine,choices.manualVaccine)||'ثبت نشده'}</p><p>آزمون: {displayName(choices.assay,choices.manualAssay)||'ثبت نشده'}</p><p>میدانی: {displayName(choices.field,choices.manualField)||'ثبت نشده'}</p>{choices.isolateMeta&&<p>توضیحات: {choices.isolateMeta}</p>}</div>
 {notes.length>0&&<div className="strain-cautions"><b>ملاحظات علمی</b><ul>{notes.map(n=><li key={n}>{n}</li>)}</ul></div>}
 <button type="button" className="button secondary" onClick={()=>setChoices(defaults)}>پاک‌کردن انتخاب‌های این بیماری</button>
 </details>
}
