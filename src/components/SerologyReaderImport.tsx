import { useState } from 'react'
import { evaluatePlateControls, mapReaderRows, parseDelimitedTable, validateReaderScale, type PlateControlGroup, type ReaderTable } from '../core/readerImport'
type Meta={fileName:string;delimiter:string;headers:string[];rawRows:string[][];sampleRows:Record<string,string>[];mapping:{resultColumn:number;sampleIdColumn:number|null;roleColumn:number|null;sampleRoleValue:string};controlRows:Record<string,string>[];controlCriteria:{positiveRole:string;negativeRole:string;referenceRole:string;positiveMin:number|null;positiveMax:number|null;negativeMax:number|null;referenceMin:number|null;referenceMax:number|null;maxReplicateCvPercent:number|null;maxReplicatePercentDifference:number|null;source:string};qcStatus:'pass'|'fail'|'pending';qcEvidence:string;controlSummary:PlateControlGroup[]}
const numOrNull=(v:string):number|null=>{if(!v.trim())return null;const x=v.replace(/[۰-۹٠-٩]/g,c=>{const i='۰۱۲۳۴۵۶۷۸۹'.indexOf(c);return String(i>=0?i:'٠١٢٣٤٥٦٧٨٩'.indexOf(c))}).replace(/\u066B/g,'.').replace(/[٬،]/g,'');const n=Number(x);return Number.isFinite(n)?n:null}
export default function SerologyReaderImport({method,scale,onApply}:{method:'ELISA'|'HI';scale:string;onApply:(values:string,ids:string,meta:Meta)=>void}){
 const [table,setTable]=useState<ReaderTable|null>(null),[fileName,setFileName]=useState(''),[result,setResult]=useState(-1),[sampleId,setSampleId]=useState(-1),[role,setRole]=useState(-1),[sampleRoleValue,setSampleRoleValue]=useState('Sample'),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [positiveRole,setPositiveRole]=useState(''),[negativeRole,setNegativeRole]=useState(''),[referenceRole,setReferenceRole]=useState(''),[positiveMin,setPositiveMin]=useState(''),[positiveMax,setPositiveMax]=useState(''),[negativeMax,setNegativeMax]=useState(''),[referenceMin,setReferenceMin]=useState(''),[referenceMax,setReferenceMax]=useState(''),[maxControlCv,setMaxControlCv]=useState(''),[maxControlDiff,setMaxControlDiff]=useState(''),[qcSource,setQcSource]=useState('')
 async function read(file?:File){
  setError('');setNotice('');setTable(null);if(!file)return
  if(file.size>5*1024*1024){setError('حداکثر اندازه فایل ۵ مگابایت است.');return}
  try{
   const parsed=parseDelimitedTable(await file.text()),headers=parsed.headers
   const find=(re:RegExp)=>headers.findIndex(h=>re.test(h))
   setTable(parsed);setFileName(file.name);setResult(find(/result|titer|titre|od|s\/p|s\/n|value|نتیجه|تیتر|مقدار/i))
   setSampleId(find(/sample.?id|specimen|bird.?id|شناسه|کد نمونه/i));setRole(find(/type|role|well.?type|control|نوع ردیف/i));setPositiveRole('');setNegativeRole('');setReferenceRole('')
   setNotice('فایل خوانده شد. ستون‌ها را کنترل و سپس پیش‌نمایش را بررسی کنید؛ هیچ داده‌ای هنوز ذخیره نشده است.')
  }catch(e){setError(e instanceof Error?e.message:'خواندن فایل ناموفق بود.')}
 }
 function apply(){
  if(!table)return
  try{
   if(role>=0&&[positiveRole,negativeRole,referenceRole].filter(Boolean).some(x=>x.trim().toLocaleLowerCase()===sampleRoleValue.trim().toLocaleLowerCase()))throw new Error('مقدار ردیف نمونه نباید با نوع کنترل مثبت، منفی یا مرجع یکسان باشد.')
   if(result<0)throw new Error('ستون نتیجه را انتخاب کنید.')
   validateReaderScale(table.headers[result],method,scale)
   const mapped=mapReaderRows(table,{resultColumn:result,sampleIdColumn:sampleId<0?null:sampleId,roleColumn:role<0?null:role,sampleRoleValue},method)
   const qc=evaluatePlateControls(table,{roleColumn:role<0?null:role,resultColumn:result,positiveRole,negativeRole,referenceRole,positiveMin:numOrNull(positiveMin),positiveMax:numOrNull(positiveMax),negativeMax:numOrNull(negativeMax),referenceMin:numOrNull(referenceMin),referenceMax:numOrNull(referenceMax),maxReplicateCvPercent:numOrNull(maxControlCv),maxReplicatePercentDifference:numOrNull(maxControlDiff),source:qcSource},method)
   const meta:Meta={fileName,delimiter:table.delimiter,headers:table.headers,rawRows:table.rows,sampleRows:mapped.sampleRows,mapping:{resultColumn:result,sampleIdColumn:sampleId<0?null:sampleId,roleColumn:role<0?null:role,sampleRoleValue},controlRows:mapped.controlRows,controlCriteria:{positiveRole,negativeRole,referenceRole,positiveMin:numOrNull(positiveMin),positiveMax:numOrNull(positiveMax),negativeMax:numOrNull(negativeMax),referenceMin:numOrNull(referenceMin),referenceMax:numOrNull(referenceMax),maxReplicateCvPercent:numOrNull(maxControlCv),maxReplicatePercentDifference:numOrNull(maxControlDiff),source:qcSource},qcStatus:qc.status,qcEvidence:qc.evidence,controlSummary:qc.groups}
   onApply(mapped.values.join(', '),mapped.sampleIds.join(', '),meta)
   setNotice(mapped.values.length+' نتیجه نمونه آماده ورود شد؛ '+mapped.controlRows.length+' ردیف غیرنمونه جداگانه نگهداری شد. وضعیت QC: '+(qc.status==='pass'?'قبول محاسبه‌شده':qc.status==='fail'?'رد محاسبه‌شده':'در انتظار تکمیل معیارهای IFU'))
   setError('')
  }catch(e){setError(e instanceof Error?e.message:'تطبیق ستون‌ها ناموفق بود.')}
 }
 const options=table?.headers.map((h,i)=><option key={i} value={i}>{h}</option>)||[]
 return <section className="srs-chart-card" style={{margin:'12px 0'}}>
  <h4>ورود خروجی دستگاه / فایل آزمایشگاه (CSV یا TSV)</h4>
  <p className="srs-note">فایل Excel را ابتدا با فرمت CSV یا TSV ذخیره کنید. فایل اصلی اختصاصی Readerها تا زمانی که قالب رسمی و نسخه آن بررسی نشده، مستقیماً تفسیر نمی‌شود. ورود فایل فقط داده‌ها را به پیش‌نمایش می‌آورد؛ ثبت نهایی با شماست.</p>
  <label>انتخاب فایل<input type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" onChange={e=>void read(e.target.files?.[0])}/></label>
  {table&&<><div className="form-grid">
   <label>ستون نتیجه<select value={result} onChange={e=>setResult(Number(e.target.value))}><option value={-1}>انتخاب کنید</option>{options}</select></label>
   <label>ستون شناسه نمونه (اختیاری)<select value={sampleId} onChange={e=>setSampleId(Number(e.target.value))}><option value={-1}>بدون شناسه</option>{options}</select></label>
   <label>ستون تفکیک نمونه/کنترل (اختیاری)<select value={role} onChange={e=>setRole(Number(e.target.value))}><option value={-1}>همه ردیف‌ها نمونه هستند</option>{options}</select></label>
   {role>=0&&<>
    <label>مقدار دقیق ردیف نمونه<input value={sampleRoleValue} onChange={e=>setSampleRoleValue(e.target.value)}/></label>
    <label>مقدار دقیق کنترل مثبت<select value={positiveRole} onChange={e=>setPositiveRole(e.target.value)}><option value="">انتخاب کنترل مثبت</option>{table.rows.map(r=>r[role]).filter((v,i,a)=>v&&a.indexOf(v)===i).map(v=><option key={v} value={v}>{v}</option>)}</select></label>
    <label>مقدار دقیق کنترل منفی<select value={negativeRole} onChange={e=>setNegativeRole(e.target.value)}><option value="">انتخاب کنترل منفی</option>{table.rows.map(r=>r[role]).filter((v,i,a)=>v&&a.indexOf(v)===i).map(v=><option key={v} value={v}>{v}</option>)}</select></label>
    <label>کنترل مرجع (اختیاری)<select value={referenceRole} onChange={e=>setReferenceRole(e.target.value)}><option value="">بدون کنترل مرجع</option>{table.rows.map(r=>r[role]).filter((v,i,a)=>v&&a.indexOf(v)===i).map(v=><option key={v} value={v}>{v}</option>)}</select></label>
    <label>حداقل میانگین کنترل مثبت<input value={positiveMin} onChange={e=>setPositiveMin(e.target.value)} inputMode="decimal"/></label>
    <label>حداکثر میانگین کنترل مثبت<input value={positiveMax} onChange={e=>setPositiveMax(e.target.value)} inputMode="decimal"/></label>
    <label>حداکثر میانگین کنترل منفی<input value={negativeMax} onChange={e=>setNegativeMax(e.target.value)} inputMode="decimal"/></label>
    {referenceRole&&<><label>حداقل کنترل مرجع<input value={referenceMin} onChange={e=>setReferenceMin(e.target.value)} inputMode="decimal"/></label><label>حداکثر کنترل مرجع<input value={referenceMax} onChange={e=>setReferenceMax(e.target.value)} inputMode="decimal"/></label></>}
    <label>حداکثر CV تکرارهای کنترل (اختیاری)<input value={maxControlCv} onChange={e=>setMaxControlCv(e.target.value)} inputMode="decimal"/></label>
    <label>حداکثر اختلاف درصدی تکرارها (اختیاری)<input value={maxControlDiff} onChange={e=>setMaxControlDiff(e.target.value)} inputMode="decimal"/><small>دامنه تکرارها ÷ میانگین × ۱۰۰؛ فقط در صورت تعریف در IFU</small></label>
    <label className="wide-label">منبع و نسخه معیارهای QC از IFU<input value={qcSource} onChange={e=>setQcSource(e.target.value)} placeholder="نام کیت، نسخه IFU، بخش و صفحه"/></label>
    <p className="srs-note">QC فقط زمانی قبول می‌شود که کنترل مثبت/منفی و حدود اعتبارسنجی IFU کامل باشند. مقادیر مورد انتظار CoA را با حدود اعتبار آزمون در IFU اشتباه نگیرید؛ این دو الزاماً یکسان نیستند. کنترل مرجع و CV/اختلاف تکرار فقط مطابق IFU وارد شوند؛ آستانه IDEXX یا BioChek به کیت دیگر تعمیم داده نشود.</p>
   </>}
  </div><div className="srs-table-wrap"><table className="srs-table"><thead><tr>{table.headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{table.rows.slice(0,8).map((r,i)=><tr key={i}>{table!.headers.map((h,j)=><td key={h}>{r[j]}</td>)}</tr>)}</tbody></table></div><small>نمایش {Math.min(8,table.rows.length)} ردیف از {table.rows.length} ردیف؛ جداکننده: {table.delimiter==='\t'?'Tab':table.delimiter}</small><button type="button" className="button secondary" onClick={apply}>تطبیق و انتقال نتایج به فرم</button></>}
  {notice&&<p className="muted" role="status">{notice}</p>}{error&&<p className="muted" role="alert">{error}</p>}
 </section>
}
