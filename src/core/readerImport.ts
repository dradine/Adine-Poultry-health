export type ReaderTable={delimiter:string;headers:string[];rows:string[][]}
export type ReaderMapping={resultColumn:number;sampleIdColumn:number|null;roleColumn:number|null;sampleRoleValue:string}
export type CensoredReaderRow={row:number;sampleId:string;value:string;status:'below_lod'|'above_uloq'|'missing'}
export type ReaderImport={values:number[];sampleIds:string[];sampleRows:Record<string,string>[];controlRows:Record<string,string>[];invalidRows:{row:number;value:string;reason:string}[];censoredRows:CensoredReaderRow[];delimiter:string}
export function parseDelimitedTable(source:string):ReaderTable{
 source=source.charCodeAt(0)===0xFEFF?source.slice(1):source
 const candidates=[',',';','\t'];const first=(source.split(/\r?\n/,1)[0]||'')
 const delimiter=candidates.map(d=>({d,n:first.split(d).length})).sort((a,b)=>b.n-a.n)[0]?.d||','
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false
 for(let i=0;i<source.length;i++){
  const ch=source[i]
  if(ch==='"'){
   if(quoted&&source[i+1]==='"'){cell+='"';i++}else quoted=!quoted
  }else if(ch===delimiter&&!quoted){row.push(cell);cell=''}
  else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}
  else cell+=ch
 }
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row)
 if(rows.length<2)throw new Error('فایل باید حداقل یک ردیف عنوان ستون و یک ردیف داده داشته باشد.')
 const headers=rows[0].map((x,i)=>x.trim()||('Column '+(i+1)))
 if(new Set(headers).size!==headers.length)throw new Error('عنوان ستون تکراری است؛ پیش از ورود، عنوان‌ها را یکتا کنید.')
 const data=rows.slice(1).map(r=>headers.map((_,i)=>(r[i]??'').trim()))
 return {delimiter,headers,rows:data}
}
export function normalizeReaderNumber(raw:string,method:'ELISA'|'HI',decimalComma=false):number{
 let x=raw.trim().replace(/[۰-۹٠-٩]/g,c=>{const a='۰۱۲۳۴۵۶۷۸۹'.indexOf(c);return String(a>=0?a:'٠١٢٣٤٥٦٧٨٩'.indexOf(c))}).replace(/[٬]/g,'').replace(/\u066B/g,'.')
 if(method==='HI'&&/^1[:/]\d+(?:\.\d+)?$/.test(x))x=x.slice(2)
 if(decimalComma&&x.includes(',')&&!x.includes('.'))x=x.replace(',','.')
 const n=Number(x)
 if(!Number.isFinite(n)||(method==='HI'?n<=0:n<0))throw new Error(method==='HI'?'تیتر HI باید عددی و مثبت باشد.':'نتیجه ELISA باید عددی و غیرمنفی باشد.')
 return n
}
export function validateReaderScale(columnName:string,method:'ELISA'|'HI',scale:string):void{
 const name=columnName.trim()
 if(method==='HI'&&scale!=='hi-reciprocal')throw new Error('برای HI، مقیاس باید HI reciprocal titre باشد.')
 if(method==='ELISA'&&scale==='hi-reciprocal')throw new Error('مقیاس HI برای ELISA قابل استفاده نیست.')
 if(/\bOD\d{3,4}\b|\bOD\b|optical density|absorbance/i.test(name)&&scale!=='od')throw new Error('ستون انتخاب‌شده OD/Absorbance به نظر می‌رسد؛ مقیاس را OD انتخاب کنید یا ستون تیتر/نسبت صحیح را مشخص کنید.')
 if(/S\s*\/\s*P|S-P\s*ratio/i.test(name)&&scale!=='sp')throw new Error('ستون انتخاب‌شده S/P به نظر می‌رسد؛ مقیاس S/P را انتخاب کنید.')
 if(/S\s*\/\s*N|S-N\s*ratio/i.test(name)&&scale!=='sn')throw new Error('ستون انتخاب‌شده S/N به نظر می‌رسد؛ مقیاس S/N را انتخاب کنید.')
}
export function mapReaderRows(table:ReaderTable,mapping:ReaderMapping,method:'ELISA'|'HI'):ReaderImport{
 if(mapping.resultColumn<0||mapping.resultColumn>=table.headers.length)throw new Error('ستون نتیجه انتخاب نشده است.')
 if(mapping.sampleIdColumn!==null&&(mapping.sampleIdColumn<0||mapping.sampleIdColumn>=table.headers.length))throw new Error('ستون شناسه نمونه نامعتبر است.')
 if(mapping.roleColumn!==null&&(mapping.roleColumn<0||mapping.roleColumn>=table.headers.length))throw new Error('ستون نوع ردیف نامعتبر است.')
 const sampleRows:Record<string,string>[]=[],controlRows:Record<string,string>[]=[],invalidRows:ReaderImport['invalidRows']=[],censoredRows:ReaderImport['censoredRows']=[]
 const values:number[]=[],sampleIds:string[]=[]
 const isControlLabel=(cell:string)=>{
  const normalized=cell.trim().toLocaleLowerCase().replace(/[\s_\-#]+/g,'')
  return /^(?:(?:positive|negative|reference)(?:control|ctrl)?|(?:control|ctrl)(?:positive|negative|reference)?|pc|nc|blank|کنترل|مثبت|منفی|مرجع)\d*$/.test(normalized)
 }
 if(mapping.roleColumn===null && table.rows.some(row=>row.some(isControlLabel)))throw new Error('این فایل ردیف کنترل دارد اما ستون تفکیک نمونه/کنترل انتخاب نشده است؛ ورود متوقف شد تا کنترل‌ها وارد نمونه‌ها نشوند.')
 table.rows.forEach((cells,index)=>{
  const record=Object.fromEntries(table.headers.map((h,i)=>[h,cells[i]??'']))
  const role=mapping.roleColumn===null?'':cells[mapping.roleColumn]??''
  const isSample=mapping.roleColumn===null||role.trim().toLocaleLowerCase()===mapping.sampleRoleValue.trim().toLocaleLowerCase()
  if(!isSample){controlRows.push(record);return}
  const raw=cells[mapping.resultColumn]??''
  const normalizedRaw=raw.trim().toLocaleLowerCase().replace(/[\s_\-]/g,'')
  const sampleId=mapping.sampleIdColumn===null?'':(cells[mapping.sampleIdColumn]??'').trim()
  const compact=raw.trim().toLocaleLowerCase().replace(/[\s_\-]/g,'')
  if(!normalizedRaw||['missing','na','n/a','nd','notdone','notavailable','نامشخص','مفقود','ناموجود'].includes(normalizedRaw)){censoredRows.push({row:index+2,sampleId,value:raw,status:'missing'});return}
  if(/^<\s*(?:lod|loq|dl|حدتشخیص|زیرحدتشخیص|\d+(?:[.,]\d+)?)$/i.test(raw.trim())||/^below(?:lod|loq)$/i.test(compact)){censoredRows.push({row:index+2,sampleId,value:raw,status:'below_lod'});return}
  if(/^>\s*(?:uloq|loq|upperlimit|حدبالایاندازهگیری|\d+(?:[.,]\d+)?)$/i.test(raw.trim())||/^above(?:uloq|loq)$/i.test(compact)){censoredRows.push({row:index+2,sampleId,value:raw,status:'above_uloq'});return}
  try{
   const value=normalizeReaderNumber(raw,method,table.delimiter===';')
   values.push(value);sampleRows.push(record)
   if(mapping.sampleIdColumn!==null)sampleIds.push((cells[mapping.sampleIdColumn]??'').trim())
  }catch(error){invalidRows.push({row:index+2,value:raw,reason:error instanceof Error?error.message:'مقدار نامعتبر'})}
 })
 if(!values.length&&!censoredRows.length)throw new Error('هیچ نتیجه نمونه قابل‌ورودی پیدا نشد؛ ستون‌ها و مقدار نوع ردیف را بررسی کنید.')
 if(invalidRows.length)throw new Error('در فایل '+invalidRows.length+' ردیف نمونه نامعتبر وجود دارد؛ ورود ناقص مجاز نیست. شماره ردیف‌ها: '+invalidRows.map(x=>x.row).join('، '))
 if(mapping.sampleIdColumn!==null&&sampleIds.some(x=>!x))throw new Error('حداقل یک شناسه نمونه خالی است؛ شناسه‌ها را اصلاح کنید یا ستون شناسه را انتخاب نکنید.')
 if(mapping.sampleIdColumn!==null&&new Set(sampleIds).size!==sampleIds.length)throw new Error('شناسه نمونه تکراری وجود دارد؛ ورود متوقف شد.')
 return {values,sampleIds,sampleRows,controlRows,invalidRows,censoredRows,delimiter:table.delimiter}
}


export type PlateControlCriteria={roleColumn:number|null;resultColumn:number;positiveRole:string;negativeRole:string;referenceRole?:string;positiveMin:number|null;positiveMax:number|null;negativeMax:number|null;referenceMin?:number|null;referenceMax?:number|null;maxReplicateCvPercent?:number|null;maxReplicatePercentDifference?:number|null;source:string}
export type PlateControlGroup={label:string;n:number;mean:number;sd:number|null;cvPercent:number|null;minimum:number;maximum:number;lowerLimit:number|null;upperLimit:number|null;maxReplicateCvPercent:number|null;percentDifference:number|null;maxReplicatePercentDifference:number|null;withinLimits:boolean|null}
export type PlateControlEvaluation={status:'pass'|'fail'|'pending';evidence:string;groups:PlateControlGroup[];failures:string[]}
export function evaluatePlateControls(table:ReaderTable,criteria:PlateControlCriteria,method:'ELISA'|'HI'):PlateControlEvaluation{
 const failures:string[]=[],groups:PlateControlGroup[]=[]
 if(criteria.roleColumn===null||criteria.roleColumn<0||criteria.roleColumn>=table.headers.length||criteria.resultColumn<0||criteria.resultColumn>=table.headers.length||!criteria.positiveRole.trim()||!criteria.negativeRole.trim()||criteria.positiveRole.trim().toLocaleLowerCase()===criteria.negativeRole.trim().toLocaleLowerCase()||criteria.roleColumn===criteria.resultColumn||!criteria.source.trim()||criteria.positiveMin===null||criteria.positiveMax===null||criteria.negativeMax===null||![criteria.positiveMin,criteria.positiveMax,criteria.negativeMax].every(Number.isFinite)||criteria.positiveMin<0||criteria.positiveMax<0||criteria.negativeMax<0||criteria.maxReplicateCvPercent!==null&&criteria.maxReplicateCvPercent!==undefined&&(!Number.isFinite(criteria.maxReplicateCvPercent)||criteria.maxReplicateCvPercent<0)||criteria.maxReplicatePercentDifference!==null&&criteria.maxReplicatePercentDifference!==undefined&&(!Number.isFinite(criteria.maxReplicatePercentDifference)||criteria.maxReplicatePercentDifference<0))return {status:'pending',evidence:'معیارهای کنترل و منبع IFU کامل یا معتبر نیستند؛ QC خودکار اجرا نشد.',groups,failures}
 if(criteria.referenceRole?.trim()&&(criteria.referenceRole.trim().toLocaleLowerCase()===criteria.positiveRole.trim().toLocaleLowerCase()||criteria.referenceRole.trim().toLocaleLowerCase()===criteria.negativeRole.trim().toLocaleLowerCase()||criteria.referenceMin==null||criteria.referenceMax==null||!Number.isFinite(criteria.referenceMin)||!Number.isFinite(criteria.referenceMax)||criteria.referenceMin>criteria.referenceMax||criteria.referenceMin<0||criteria.referenceMax<0))return {status:'pending',evidence:'نقش یا محدوده کنترل مرجع کامل و سازگار نیست.',groups,failures}
 if(criteria.positiveMin>criteria.positiveMax)return {status:'pending',evidence:'حد پایین و بالای کنترل مثبت با هم سازگار نیستند.',groups,failures}
 const roleIndex=criteria.roleColumn
 const selected=[{label:'positive',role:criteria.positiveRole,min:criteria.positiveMin,max:criteria.positiveMax},{label:'negative',role:criteria.negativeRole,min:null,max:criteria.negativeMax},...(criteria.referenceRole?.trim()?[{label:'reference',role:criteria.referenceRole,min:criteria.referenceMin??null,max:criteria.referenceMax??null}]:[])]
 let incomplete=false
 for(const spec of selected){
  const vals:number[]=[]
  table.rows.forEach((row,index)=>{
   if((row[roleIndex]??'').trim().toLocaleLowerCase()!==spec.role.trim().toLocaleLowerCase())return
   try{vals.push(normalizeReaderNumber(row[criteria.resultColumn]??'',method,table.delimiter===';'))}
   catch{failures.push('ردیف '+(index+2)+' برای کنترل '+spec.label+' مقدار معتبر ندارد.')}
  })
  if(!vals.length){incomplete=true;failures.push('کنترل '+spec.label+' در فایل پیدا نشد.');continue}
  const mean=vals.reduce((a,b)=>a+b,0)/vals.length,sd=vals.length>1?Math.sqrt(vals.reduce((a,v)=>a+(v-mean)**2,0)/(vals.length-1)):null,cvPercent=sd!==null&&mean?sd/mean*100:null,percentDifference=mean?(Math.max(...vals)-Math.min(...vals))/mean*100:null
  let withinLimits:boolean|null=null
  if(spec.label==='positive')withinLimits=spec.min!==null&&spec.max!==null&&mean>=spec.min&&mean<=spec.max
  else if(spec.label==='negative')withinLimits=spec.max!==null&&mean<=spec.max
  else withinLimits=spec.min!==null&&spec.max!==null&&mean>=spec.min&&mean<=spec.max
  if(withinLimits===false)failures.push('میانگین کنترل '+spec.label+' خارج از محدوده ثبت‌شده IFU است.')
  if(criteria.maxReplicateCvPercent!==null&&criteria.maxReplicateCvPercent!==undefined){
   if(vals.length<2||cvPercent===null)incomplete=true
   else if(cvPercent>criteria.maxReplicateCvPercent){withinLimits=false;failures.push('CV تکرارهای کنترل '+spec.label+' از حد ثبت‌شده بیشتر است.')}
  }
  if(criteria.maxReplicatePercentDifference!==null&&criteria.maxReplicatePercentDifference!==undefined){if(vals.length<2||percentDifference===null)incomplete=true;else if(percentDifference>criteria.maxReplicatePercentDifference){withinLimits=false;failures.push('اختلاف درصدی تکرارهای کنترل '+spec.label+' از حد ثبت‌شده بیشتر است.')}}
  groups.push({label:spec.label,n:vals.length,mean,sd,cvPercent,minimum:Math.min(...vals),maximum:Math.max(...vals),lowerLimit:spec.min,upperLimit:spec.max,maxReplicateCvPercent:criteria.maxReplicateCvPercent??null,percentDifference,maxReplicatePercentDifference:criteria.maxReplicatePercentDifference??null,withinLimits})
 }
 const status=failures.some(x=>x.includes('خارج از محدوده')||x.includes('از حد ثبت‌شده بیشتر')||x.includes('مقدار معتبر ندارد'))?'fail':incomplete||failures.length?'pending':'pass'
 const fmt=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:4})
 const evidence=['IFU/source: '+criteria.source,...groups.map(g=>g.label+': n='+g.n+', mean='+fmt(g.mean)+', observedRange='+fmt(g.minimum)+'–'+fmt(g.maximum)+', IFUlimits='+(g.lowerLimit===null?'':fmt(g.lowerLimit)+'–')+(g.upperLimit===null?'':fmt(g.upperLimit))+', CV='+(g.cvPercent===null?'NA':fmt(g.cvPercent))+'%, rangeMeanDiff='+(g.percentDifference===null?'NA':fmt(g.percentDifference))+'%, maxCV='+(g.maxReplicateCvPercent===null?'NA':fmt(g.maxReplicateCvPercent))+'%, maxRangeMeanDiff='+(g.maxReplicatePercentDifference===null?'NA':fmt(g.maxReplicatePercentDifference))+'%, status='+(g.withinLimits===null?'pending':g.withinLimits?'pass':'fail')),...failures].join(' | ')
 return {status,evidence,groups,failures}
}
