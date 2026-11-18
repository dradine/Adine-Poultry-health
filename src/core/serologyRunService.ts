import { supabase } from './supabase'
import { getSyncMeta, setSyncMeta, listLocalFlocks, saveLocalFlock, saveLocalModelRun } from './localFirstDb'

export type SerologyRoundDraft = {
 flock:{id:string;flockName:string;placementDate:string;hatchDate?:string;flockType?:string;flockSize?:string;houseName?:string}
 diseaseCode:'IBD'|'ND'|'IBV'|'AIV'
 input:Record<string,unknown>
 output:Record<string,unknown>
}
export async function saveSerologyRound(draft:SerologyRoundDraft):Promise<string>{
 const {data:{session},error}=await supabase.auth.getSession()
 if(error)throw error
 if(session){
  const bound=await getSyncMeta('bound-account')
  if(bound&&bound!==session.user.id)throw new Error('این دستگاه به حساب دیگری متصل است؛ برای جلوگیری از انتقال اطلاعات بین حساب‌ها ذخیره متوقف شد.')
  if(!bound)await setSyncMeta('bound-account',session.user.id)
 }
 const existing=(await listLocalFlocks(true)).find(x=>x.id===draft.flock.id)
 if(!existing){
  const count=Number(String(draft.flock.flockSize||'').replace(/[^\d]/g,''))
  const now=new Date().toISOString()
  await saveLocalFlock({id:draft.flock.id,flock_name:draft.flock.flockName,species:draft.flock.flockType||'broiler',hatch_date:draft.flock.hatchDate||null,placement_date:draft.flock.placementDate.slice(0,10),bird_count:Number.isInteger(count)&&count>0?count:null,location_label:draft.flock.houseName||null,timezone:'Asia/Tehran',created_at:now,updated_at:now})
 }
 const limitations=[
  'Descriptive serology monitoring only; no diagnosis, vaccine take, clinical protection or transmission inference.',
  'Numeric trend comparison is restricted to the same flock, disease, method, exact kit/catalog version, antigen and reported unit.',
  'Group-level samples are not paired longitudinally unless persistent individual bird IDs are recorded and verified.',
  'Raw OD, S/P, kit-specific ELISA titres, reciprocal HI titres and log2 HI values are distinct scales and must not be pooled.'
 ]
 const id=crypto.randomUUID(),now=new Date().toISOString()
 await saveLocalModelRun({
  id,flock_id:draft.flock.id,disease_code:draft.diseaseCode,
  model_version:'serology-longitudinal-0.1.0',model_family:'serology-longitudinal-round',
  input_snapshot:draft.input,output_snapshot:draft.output,
  confidence_level:draft.diseaseCode==='AIV'?'insufficient':'low',
  decision_status:'review_required',limitations,
  qc_summary:{enteredByUser:true,rawLabFileImported:false,qcStatus:draft.input.qcStatus||'pending',independentlyVerified:false},
  model_assumptions:{interpretation:'descriptive-only',noProtectionInference:true,unpairedGroupTrend:true},
  source_references:draft.input.source?[{kind:'user-entered-assay-source',citation:draft.input.source}]:[],
  input_schema_version:'serology-longitudinal-v1',created_at:now
 })
 return id
}
