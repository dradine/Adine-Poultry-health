export type ReaderTable={delimiter:string;headers:string[];rows:string[][]}
export type ReaderMapping={resultColumn:number;sampleIdColumn:number|null;roleColumn:number|null;sampleRoleValue:string}
export type ReaderImport={values:number[];sampleIds:string[];sampleRows:Record<string,string>[];controlRows:Record<string,string>[];invalidRows:{row:number;value:string;reason:string}[];delimiter:string}
export function parseDelimitedTable(source:string):ReaderTable{
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
 if(!Number.isFinite(n)||n<=0)throw new Error('نتیجه باید عددی و مثبت باشد.')
 return n
}
export function mapReaderRows(table:ReaderTable,mapping:ReaderMapping,method:'ELISA'|'HI'):ReaderImport{
 if(mapping.resultColumn<0||mapping.resultColumn>=table.headers.length)throw new Error('ستون نتیجه انتخاب نشده است.')
 if(mapping.sampleIdColumn!==null&&(mapping.sampleIdColumn<0||mapping.sampleIdColumn>=table.headers.length))throw new Error('ستون شناسه نمونه نامعتبر است.')
 if(mapping.roleColumn!==null&&(mapping.roleColumn<0||mapping.roleColumn>=table.headers.length))throw new Error('ستون نوع ردیف نامعتبر است.')
 const sampleRows:Record<string,string>[]=[],controlRows:Record<string,string>[]=[],invalidRows:ReaderImport['invalidRows']=[]
 const values:number[]=[],sampleIds:string[]=[]
 table.rows.forEach((cells,index)=>{
  const record=Object.fromEntries(table.headers.map((h,i)=>[h,cells[i]??'']))
  const role=mapping.roleColumn===null?'':cells[mapping.roleColumn]??''
  const isSample=mapping.roleColumn===null||role.trim().toLocaleLowerCase()===mapping.sampleRoleValue.trim().toLocaleLowerCase()
  if(!isSample){controlRows.push(record);return}
  const raw=cells[mapping.resultColumn]??''
  try{
   const value=normalizeReaderNumber(raw,method,table.delimiter===';')
   values.push(value);sampleRows.push(record)
   if(mapping.sampleIdColumn!==null)sampleIds.push((cells[mapping.sampleIdColumn]??'').trim())
  }catch(error){invalidRows.push({row:index+2,value:raw,reason:error instanceof Error?error.message:'مقدار نامعتبر'})}
 })
 if(!values.length)throw new Error('هیچ نتیجه نمونه قابل‌ورودی پیدا نشد؛ ستون‌ها و مقدار نوع ردیف را بررسی کنید.')
 if(invalidRows.length)throw new Error('در فایل '+invalidRows.length+' ردیف نمونه نامعتبر وجود دارد؛ ورود ناقص مجاز نیست. شماره ردیف‌ها: '+invalidRows.map(x=>x.row).join('، '))
 if(mapping.sampleIdColumn!==null&&sampleIds.some(x=>!x))throw new Error('حداقل یک شناسه نمونه خالی است؛ شناسه‌ها را اصلاح کنید یا ستون شناسه را انتخاب نکنید.')
 if(mapping.sampleIdColumn!==null&&new Set(sampleIds).size!==sampleIds.length)throw new Error('شناسه نمونه تکراری وجود دارد؛ ورود متوقف شد.')
 return {values,sampleIds,sampleRows,controlRows,invalidRows,delimiter:table.delimiter}
}
