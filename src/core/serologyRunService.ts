import { supabase } from './supabase'
import { normalizeDigits } from './ibd'
import { findAssayCatalogEntry } from './assayRegistry'
import { getSyncMeta, setSyncMeta, listLocalFlocks, saveLocalFlock, saveLocalModelRun, notifyLocalDataChanged } from './localFirstDb'

export type SerologyRoundDraft = {
 flock:{id:string;flockName:string;placementDate:string;hatchDate?:string;flockType?:string;flockSize?:string;houseName?:string;hatchery?:string;vaccinationHistory?:string}
 diseaseCode:'IBD'|'ND'|'IBV'|'AIV'
 input:Record<string,unknown>
 output:Record<string,unknown>
}
export async function saveSerologyRound(draft:SerologyRoundDraft):Promise<string>{
 const {data:{session},error}=await supabase.auth.getSession()
 if(error)throw error
 const bound=await getSyncMeta('bound-account')
 if(session){
  if(!session.user.email)throw new Error('ایمیل حساب واردشده در دسترس نیست؛ برای ذخیره گزارش، نشست معتبر لازم است.')
  if(bound&&bound!==session.user.id)throw new Error('این دستگاه به حساب دیگری متصل است؛ برای جلوگیری از انتقال اطلاعات بین حساب‌ها ذخیره متوقف شد.')
  if(!bound)await setSyncMeta('bound-account',session.user.id)
 }else if(!bound){
  throw new Error('برای اتصال امن گزارش‌ها به حساب موردنظر، ابتدا با همان حساب وارد شوید؛ پس از اتصال اولیه، ثبت آفلاین نیز ممکن است.')
 }
 const existing=(await listLocalFlocks(true)).find(x=>x.id===draft.flock.id)
 if(existing?.deleted)throw new Error('این گله حذف شده است؛ برای ثبت نوبت جدید ابتدا وضعیت گله را بازیابی کنید.')
 if(!existing){
  const countText=normalizeDigits(String(draft.flock.flockSize||'')).replace(/[,،٬\s]/g,'')
  const count=Number(countText)
  const now=new Date().toISOString()
  await saveLocalFlock({id:draft.flock.id,flock_name:draft.flock.flockName,species:draft.flock.flockType||'broiler',hatch_date:draft.flock.hatchDate||null,placement_date:draft.flock.placementDate.slice(0,10),bird_count:Number.isInteger(count)&&count>0?count:null,location_label:draft.flock.houseName||null,notes:JSON.stringify({hatchery:draft.flock.hatchery||null,vaccinationHistory:draft.flock.vaccinationHistory||null}),timezone:'Asia/Tehran',created_at:now,updated_at:now})
 }
 const limitations=[
  'این گزارش توصیفی سرولوژی است و تشخیص بیماری، موفقیت قطعی واکسن، حفاظت بالینی یا جلوگیری از انتقال را اثبات نمی‌کند.',
  'مقایسه روند فقط با تطابق گله، جمعیت، بیماری، روش، شناسه کیت، کاتالوگ، نسخه IFU، ماتریس نمونه، آنتی‌ژن، مقیاس، واحد، آزمایشگاه، دستگاه، پروتکل و Lot انجام می‌شود؛ در HI، HAU، تیمار آنتی‌ژن/سرم، ضریب رقت و مشخصات RBC نیز باید یکسان باشند.',
  'بدون شناسه پایدار و تأییدشده پرنده‌ها، مقایسه بین نوبت‌ها گروهی است و تحلیل جفت‌شده محسوب نمی‌شود.',
  'OD، S/P، S/N، تیتر اختصاصی کیت ELISA، تیتر معکوس HI و log2 HI مقیاس‌های متفاوت‌اند و نباید با هم ادغام شوند.',
  'اعتبار کنترل‌های آزمون در این نسخه به‌صورت اظهاری ثبت می‌شود و از روی فایل خام دستگاه به‌طور مستقل ممیزی نمی‌شود.'
 ]
 const id=crypto.randomUUID(),now=new Date().toISOString()
 const assayId=typeof draft.input.assayId==='string'?draft.input.assayId:''
 const assay=assayId&&assayId!=='manual'?findAssayCatalogEntry(assayId):undefined
 const sourceReferences=[...(assay?[{kind:'manufacturer-assay-catalog',citation:assay.source,manufacturer:assay.manufacturer,catalog:assay.catalog||null,status:assay.status,note:assay.note}]:[]),...(draft.input.source?[{kind:'user-entered-assay-source',citation:draft.input.source}]:[]),...(typeof draft.output.bioChekVI==='number'?[{kind:'manufacturer-interpretation-manual',citation:'https://www.biochek.com/wp-content/uploads/2025/11/BioChek-Poultry-ELISA-Interpretation-Manual-RevB-2025.pdf',version:'RevB 2025',formula:'VI = AMT / %CV'}]:[])]
 await saveLocalModelRun({
  id,flock_id:draft.flock.id,disease_code:draft.diseaseCode,
  model_version:'serology-longitudinal-0.2.0',model_family:'serology-longitudinal-round',
  input_snapshot:draft.input,output_snapshot:draft.output,
  confidence_level:'insufficient',
  decision_status:'review_required',limitations,
  qc_summary:{enteredByUser:true,rawLabFileImported:draft.input.rawFileImported===true,qcStatus:draft.input.qcStatus||'pending',automaticallyEvaluatedFromRawFile:Boolean((draft.input.readerImportMeta as Record<string,unknown>|undefined)?.qcStatus==='pass'||(draft.input.readerImportMeta as Record<string,unknown>|undefined)?.qcStatus==='fail'),rawControlRows:Array.isArray((draft.input.readerImportMeta as Record<string,unknown>|undefined)?.controlRows)?((draft.input.readerImportMeta as Record<string,unknown>).controlRows as unknown[]).length:0,independentlyVerified:false},
  model_assumptions:{interpretation:'descriptive-only',noProtectionInference:true,unpairedGroupTrend:true},
  source_references:sourceReferences,
  input_schema_version:'serology-longitudinal-v2',created_at:now
 })
 notifyLocalDataChanged()
 return id
}
