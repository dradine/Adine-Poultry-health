import { supabase } from './supabase'
import { normalizeDigits } from './ibd'
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
 const targetEmail='dradinehvand@gmail.com'
 if(session){
  if((session.user.email||'').toLowerCase()!==targetEmail)throw new Error('برای ذخیره این پرونده‌ها باید با حساب '+targetEmail+' وارد شوید.')
  if(bound&&bound!==session.user.id)throw new Error('این دستگاه به حساب دیگری متصل است؛ برای جلوگیری از انتقال اطلاعات بین حساب‌ها ذخیره متوقف شد.')
  if(!bound)await setSyncMeta('bound-account',session.user.id)
 }else if(!bound){
  throw new Error('برای اتصال امن گزارش‌ها به حساب '+targetEmail+'، ابتدا با همان حساب وارد شوید؛ پس از اتصال اولیه، ثبت آفلاین نیز ممکن است.')
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
  'مقایسه روند فقط با تطابق گله، بیماری، روش، شناسه کیت، کاتالوگ، نسخه IFU، آنتی‌ژن، مقیاس، واحد، آزمایشگاه، دستگاه، پروتکل و Lot انجام می‌شود.',
  'بدون شناسه پایدار و تأییدشده پرنده‌ها، مقایسه بین نوبت‌ها گروهی است و تحلیل جفت‌شده محسوب نمی‌شود.',
  'OD، S/P، S/N، تیتر اختصاصی کیت ELISA، تیتر معکوس HI و log2 HI مقیاس‌های متفاوت‌اند و نباید با هم ادغام شوند.',
  'اعتبار کنترل‌های آزمون در این نسخه به‌صورت اظهاری ثبت می‌شود و از روی فایل خام دستگاه به‌طور مستقل ممیزی نمی‌شود.'
 ]
 const id=crypto.randomUUID(),now=new Date().toISOString()
 await saveLocalModelRun({
  id,flock_id:draft.flock.id,disease_code:draft.diseaseCode,
  model_version:'serology-longitudinal-0.1.0',model_family:'serology-longitudinal-round',
  input_snapshot:draft.input,output_snapshot:draft.output,
  confidence_level:'insufficient',
  decision_status:'review_required',limitations,
  qc_summary:{enteredByUser:true,rawLabFileImported:false,qcStatus:draft.input.qcStatus||'pending',independentlyVerified:false},
  model_assumptions:{interpretation:'descriptive-only',noProtectionInference:true,unpairedGroupTrend:true},
  source_references:draft.input.source?[{kind:'user-entered-assay-source',citation:draft.input.source}]:[],
  input_schema_version:'serology-longitudinal-v1',created_at:now
 })
 notifyLocalDataChanged()
 return id
}
