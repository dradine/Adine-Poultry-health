import { useState } from 'react'
import { mapReaderRows, parseDelimitedTable, type ReaderTable } from '../core/readerImport'
type Meta={fileName:string;delimiter:string;headers:string[];mapping:{resultColumn:number;sampleIdColumn:number|null;roleColumn:number|null;sampleRoleValue:string};controlRows:Record<string,string>[]}
export default function SerologyReaderImport({method,onApply}:{method:'ELISA'|'HI';onApply:(values:string,ids:string,meta:Meta)=>void}){
 const [table,setTable]=useState<ReaderTable|null>(null),[fileName,setFileName]=useState(''),[result,setResult]=useState(-1),[sampleId,setSampleId]=useState(-1),[role,setRole]=useState(-1),[sampleRoleValue,setSampleRoleValue]=useState('Sample'),[error,setError]=useState(''),[notice,setNotice]=useState('')
 async function read(file?:File){
  setError('');setNotice('');setTable(null);if(!file)return
  if(file.size>5*1024*1024){setError('حداکثر اندازه فایل ۵ مگابایت است.');return}
  try{
   const parsed=parseDelimitedTable(await file.text()),headers=parsed.headers
   const find=(re:RegExp)=>headers.findIndex(h=>re.test(h))
   setTable(parsed);setFileName(file.name);setResult(Math.max(0,find(/result|titer|titre|od|s\/p|s\/n|value|نتیجه|تیتر|مقدار/i)))
   setSampleId(find(/sample.?id|specimen|bird.?id|شناسه|کد نمونه/i));setRole(find(/type|role|well.?type|control|نوع ردیف/i))
   setNotice('فایل خوانده شد. ستون‌ها را کنترل و سپس پیش‌نمایش را بررسی کنید؛ هیچ داده‌ای هنوز ذخیره نشده است.')
  }catch(e){setError(e instanceof Error?e.message:'خواندن فایل ناموفق بود.')}
 }
 function apply(){
  if(!table)return
  try{
   const mapped=mapReaderRows(table,{resultColumn:result,sampleIdColumn:sampleId<0?null:sampleId,roleColumn:role<0?null:role,sampleRoleValue},method)
   const meta:Meta={fileName,delimiter:table.delimiter,headers:table.headers,mapping:{resultColumn:result,sampleIdColumn:sampleId<0?null:sampleId,roleColumn:role<0?null:role,sampleRoleValue},controlRows:mapped.controlRows}
   onApply(mapped.values.join(', '),mapped.sampleIds.join(', '),meta)
   setNotice(mapped.values.length+' نتیجه نمونه آماده ورود شد؛ '+mapped.controlRows.length+' ردیف غیرنمونه جداگانه در پرونده خام نگهداری می‌شود.')
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
   {role>=0&&<label>مقدار دقیق ردیف نمونه<input value={sampleRoleValue} onChange={e=>setSampleRoleValue(e.target.value)}/></label>}
  </div><div className="srs-table-wrap"><table className="srs-table"><thead><tr>{table.headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{table.rows.slice(0,8).map((r,i)=><tr key={i}>{table!.headers.map((h,j)=><td key={h}>{r[j]}</td>)}</tr>)}</tbody></table></div><small>نمایش {Math.min(8,table.rows.length)} ردیف از {table.rows.length} ردیف؛ جداکننده: {table.delimiter==='\t'?'Tab':table.delimiter}</small><button type="button" className="button secondary" onClick={apply}>تطبیق و انتقال نتایج به فرم</button></>}
  {notice&&<p className="muted" role="status">{notice}</p>}{error&&<p className="muted" role="alert">{error}</p>}
 </section>
}
