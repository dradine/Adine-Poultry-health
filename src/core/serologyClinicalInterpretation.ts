import type { LocalModelRun, LocalFlock } from './localFirstDb'

type O=Record<string,unknown>
export type ClinicalCard={title:string;body:string;level:'good'|'caution'|'risk'|'neutral'}
export type ClinicalInterpretation={
 headline:string;confidence:string;observations:ClinicalCard[];scenarios:{name:string;likelihood:string;for:string[];against:string[];meaning:string}[];
 outlook:ClinicalCard[];actions:{priority:string;task:string;reason:string}[];limitations:string[];sources:{label:string;url:string}[]
}
const str=(o:O,k:string)=>typeof o[k]==='string'?String(o[k]).trim():''
const nums=(v:unknown)=>Array.isArray(v)&&v.every(x=>typeof x==='number'&&Number.isFinite(x))?v as number[]:[]
const mean=(v:number[])=>v.length?v.reduce((a,b)=>a+b,0)/v.length:0
const sd=(v:number[])=>v.length>1?Math.sqrt(v.reduce((a,x)=>a+(x-mean(v))**2,0)/(v.length-1)):0
const pct=(x:number)=>x.toLocaleString('fa-IR',{maximumFractionDigits:1})+'٪'
const dayDiff=(a:string,b:string)=>{if(!a||!b)return null;const x=Date.parse(a+'T00:00:00Z'),y=Date.parse(b+'T00:00:00Z');return Number.isFinite(x)&&Number.isFinite(y)?Math.round((x-y)/86400000):null}
function add(a:ClinicalCard[],title:string,body:string,level:ClinicalCard['level']='neutral'){a.push({title,body,level})}
export function buildClinicalInterpretation(run:LocalModelRun,flock?:LocalFlock):ClinicalInterpretation{
 const i=run.input_snapshot as O,values=nums(i.titers),n=values.length,m=mean(values),cv=m?sd(values)/m*100:null
 const titre=['kit-titer','hi-reciprocal'].includes(str(i,'scale')),positive=values.length>0&&values.every(x=>x>0)
 const log=positive&&titre?values.map(Math.log2):[],logMean=mean(log),logSd=sd(log)
 const gmt=log.length?2**logMean:null,disease=run.disease_code
 const method=str(i,'method'),purpose=str(i,'samplingPurpose'),vaccine=str(i,'vaccine'),platform=str(i,'vaccinePlatform'),vaccineDate=str(i,'vaccineDate'),samplingDate=str(i,'samplingDate')
 const sinceVaccine=dayDiff(samplingDate,vaccineDate)
 const vaccinationEvents=Array.isArray(i.vaccinationEvents)?(i.vaccinationEvents as O[]).filter(e=>e&&typeof e==='object'):[]
 const clinical=i.clinicalContext&&typeof i.clinicalContext==='object'?i.clinicalContext as O:{}
 const clinicalSigns=str(clinical,'signs'),clinicalStatus=str(clinical,'status'),mortalityTrend=str(clinical,'mortalityTrend')
 const numericClinical=(key:string)=>{const raw=str(clinical,key),match=raw.match(/-?\d+(?:[.,]\d+)?/);return match?Number(match[0].replace(',','.')):null}
 const respiratorySigns=/تنفس|سرفه|عطسه|خرخر|ترشح بینی|ترشح چشم|کیسه هوایی/.test(clinicalSigns)
 const neurologicalSigns=/عصبی|پیچش گردن|فلجی|لرزش|آتاکسی/.test(clinicalSigns)
 const entericSigns=/اسهال|مدفوع آبکی|خون در مدفوع|روده/.test(clinicalSigns)
 const bursalSigns=/بورس|فابریسیوس|بورسیت/.test(clinicalSigns)

 const qcMeta=i.readerImportMeta&&typeof i.readerImportMeta==='object'?i.readerImportMeta as O:{}
 const qc=i.rawFileImported===true?str(qcMeta,'qcStatus'):str(i,'qcStatus')
 const demo=i.demo===true||qc==='demo'
 const random=i.randomSamplingConfirmed===true
 const vaccineContext=[vaccine,platform,str(i,'vaccineStrain'),str(i,'vaccineProgram')].filter(Boolean).join(' / ')
 const diseaseNames:Record<string,string>={ND:'نیوکاسل',AIV:'آنفلوانزا',IBV:'برونشیت',IBD:'گامبورو'}
 const relevantEvents=vaccinationEvents.filter(e=>{const d=str(e,'disease').toUpperCase();return d===disease||diseaseNames[disease]===d||diseaseNames[disease]?.includes(d)||d.includes(diseaseNames[disease]||'###')})
 const relevantVaccines=relevantEvents
 const eventDaysBeforeSample=(e:O)=>{const eventDate=str(e,'date');if(eventDate)return dayDiff(samplingDate,eventDate);const sampleAge=Number(i.samplingAgeDays),eventAge=Number(e.ageDays);return Number.isFinite(sampleAge)&&Number.isFinite(eventAge)?sampleAge-eventAge:null}
 const datedRelevant=relevantEvents.map(event=>({event,days:eventDaysBeforeSample(event)})).filter(x=>x.days!==null&&x.days>=0).sort((a,b)=>(a.days as number)-(b.days as number))
 const lastRelevant=datedRelevant[0]?.event
 const lastVaxDays=datedRelevant[0]?.days??null
 const signs=clinicalSigns,mortality=numericClinical('mortalityPercent')??NaN,hasClinical=Boolean(signs||str(clinical,'necropsy')||str(clinical,'directTests')||str(clinical,'onsetDate'))
 const highMortality=clinical.mortalityTrend==='increasing'
 const observations:ClinicalCard[]=[],scenarios:ClinicalInterpretation['scenarios']=[],outlook:ClinicalCard[]=[],actions:ClinicalInterpretation['actions']=[],limitations:string[]=[]
 const sources:ClinicalInterpretation['sources']=[]
 const source=(label:string,url:string)=>{if(!sources.some(x=>x.url===url))sources.push({label,url})}
 if(demo){add(observations,'داده نمایشی','این نوبت شبیه‌سازی‌شده است. هیچ استنباط زیستی، پیش‌بینی گله‌ای یا توصیه مدیریتی از آن صادر نمی‌شود.','risk')}
 if(i.rawFileImported===true&&qc!=='pass')add(observations,'اعتبار تحلیلی محدود','QC فایل خام قبول نشده یا تعیین تکلیف نشده است؛ محاسبات آماری فقط توصیفی‌اند و سناریوهای زیستی باید موقت تلقی شوند.','risk')
 else if(i.rawFileImported!==true)add(observations,'وضعیت QC','QC از روی فایل خام قابل ممیزی نیست و وضعیت واردشده اظهاری است؛ تفسیر آزمایشگاهی قطعی تلقی نشود.','caution')
 add(observations,'نمای کلی نمونه‌ها',n?('تعداد نمونه '+n+'؛ میانگین '+m.toFixed(2)+' '+str(i,'unit')+'؛ دامنه '+Math.min(...values)+' تا '+Math.max(...values)+(cv===null?'':'؛ CV خام '+pct(cv))+ (gmt===null?'':'؛ GMT '+gmt.toFixed(1)) +'. این شاخص‌ها توصیف همین نمونه‌ها هستند، نه حد حفاظت.'): 'نتیجه عددی معتبر در پرونده پیدا نشد.','neutral')
 if(titre&&log.length>1)add(observations,'پراکندگی لگاریتمی تیتر','SD در مقیاس log₂ برابر '+logSd.toFixed(2)+' است. این عدد برای مقایسه پراکندگی تیترهای دوبرابری مفید است؛ به‌تنهایی آستانه یکنواختی اعتبارسنجی‌شده نیست.','neutral')
 if(!random)add(observations,'نمایندگی نمونه‌گیری نامشخص','تصادفی‌بودن و پوشش سالن‌ها تأیید نشده است؛ نتایج را نمی‌توان بدون احتیاط به کل گله تعمیم داد.','caution')
 if(flock)add(observations,'زمینه گله',(flock.flock_name||'')+'؛ '+(flock.species||'نوع پرنده ثبت نشده')+'؛ '+(flock.bird_count?flock.bird_count+' قطعه':'تعداد قطعه ثبت نشده')+'.','neutral')
 if(vaccineContext)add(observations,'زمینه واکسیناسیون',vaccineContext+(sinceVaccine===null?'':'؛ '+sinceVaccine+' روز از تاریخ واکسن ثبت‌شده تا نمونه‌گیری')+'. توجه: تاریخ منفرد لزوماً تمام برنامه واکسیناسیون را بازنمایی نمی‌کند.','neutral')
 if(vaccinationEvents.length)add(observations,'خط زمانی واکسیناسیون',relevantEvents.length+' نوبت مرتبط با '+(diseaseNames[disease]||disease)+' از '+vaccinationEvents.length+' رویداد ثبت شده است.'+(lastRelevant?' آخرین نوبت مرتبط: '+(str(lastRelevant,'date')||('سن '+String(lastRelevant.ageDays??'نامشخص')+' روز'))+'؛ '+str(lastRelevant,'product')+'؛ '+str(lastRelevant,'platform')+'؛ مسیر '+str(lastRelevant,'route')+(lastRelevant.coveragePercent===null||lastRelevant.coveragePercent===undefined?'':'؛ پوشش '+String(lastRelevant.coveragePercent)+'٪')+'.':'')+' رویدادهای بعد از تاریخ نمونه‌گیری در تفسیر این نوبت لحاظ نمی‌شوند.','neutral')
 if(hasClinical)add(observations,'وضعیت بالینی ثبت‌شده',[signs?('علائم: '+signs):'',str(clinical,'necropsy')?('کالبدگشایی: '+str(clinical,'necropsy')):'',str(clinical,'directTests')?('آزمون مستقیم: '+str(clinical,'directTests')):'',str(clinical,'clinicalCourse')?('سیر بیماری: '+str(clinical,'clinicalCourse')):''].filter(Boolean).join('؛ '),'caution')
 if(str(clinical,'waterIntake')||str(clinical,'feedIntake')||str(clinical,'productionChange'))add(observations,'تغییرات عملکردی','آب: '+(str(clinical,'waterIntake')||'ثبت نشده')+'؛ دان: '+(str(clinical,'feedIntake')||'ثبت نشده')+'؛ عملکرد: '+(str(clinical,'productionChange')||'ثبت نشده'),'neutral')
 if(Number.isFinite(mortality))add(observations,'تلفات تجمعی ثبت‌شده','تلفات تجمعی '+mortality+'٪ گزارش شده است. تفسیر آن باید با سن گله، خط پایه فارم، روند روزانه و شواهد کالبدگشایی انجام شود؛ این مقدار به‌تنهایی علت را مشخص نمی‌کند.',highMortality?'risk':'neutral')
 if(!purpose)limitations.push('هدف نمونه‌گیری (پایش واکسن، MDA، غربالگری یا بررسی بیماری) ثبت نشده است.')
 if(!vaccinationEvents.length&&!str(i,'vaccineProgram')&&!str(i,'vaccinationHistory'))limitations.push('تاریخچه ساختاریافته واکسیناسیون (تاریخ/سن، بیماری، محصول، سویه، پلتفرم، مسیر و پوشش) در دسترس نیست.')
 if(!hasClinical&&!highMortality)limitations.push('اطلاعات بالینی، تلفات، مصرف آب/دان، عملکرد، کالبدگشایی و آزمون‌های مستقیم ثبت نشده‌اند.')
 if(!str(i,'houseBreakdown'))limitations.push('تفکیک نتایج بر اساس سالن/موقعیت نمونه موجود نیست.')
 if(demo)limitations.push('رکورد نمایشی است؛ تحلیل بالینی غیرفعال محسوب می‌شود.')
 if(demo)return {headline:'رکورد نمایشی؛ تفسیر بالینی صادر نمی‌شود',confidence:'غیرقابل استفاده بالینی',observations,scenarios:[],outlook:[],actions:[],limitations,sources:[]}
 if(disease==='ND'){
  source('WOAH – Newcastle disease, Terrestrial Code','https://www.woah.org/fileadmin/Home/eng/Health_standards/tahc/2024/en_chapitre_nd.pdf')
  source('WOAH – Newcastle disease, Terrestrial Manual, Chapter 3.3.10','https://www.woah.org/fileadmin/Home/eng/Health_standards/tahm/3.03.10_NEWCASTLE_DIS.pdf')
  source('Merck Veterinary Manual – Newcastle disease','https://www.merckvetmanual.com/poultry/newcastle-disease-and-other-avian-paramyxovirus-infections/newcastle-disease-in-poultry')
  add(observations,'محدودیت اختصاصی نیوکاسل','در گله واکسینه، آنتی‌بادی HI یا ELISA نمی‌تواند به‌تنهایی پاسخ واکسن را از مواجهه با APMV-1 میدانی جدا کند. تیتر مثبت به معنی ویروس بیماری‌زای در گردش نیست.','caution')
  const hiFourHau=method==='HI'&&Number(str(i,'hiHAU'))===4
  if(lastRelevant&&lastVaxDays!==null&&lastVaxDays>=0&&lastVaxDays<=14)scenarios.push({name:'اثر نوبت اخیر واکسن نیوکاسل بر تیتر',likelihood:'در صورت تأیید تاریخ و نوع واکسن، توضیح زمانی مهم',for:['آخرین نوبت واکسن مرتبط '+lastVaxDays+' روز پیش از نمونه‌گیری ثبت شده است','اگر واکسن زنده بوده، پاسخ همورال پس از تجویز می‌تواند در حال شکل‌گیری باشد'],against:['روش، سویه، پوشش واقعی و کیفیت تجویز باید تأیید شود','یک نوبت سرولوژی منشأ آنتی‌بادی را از واکسن و میدان جدا نمی‌کند'],meaning:'نتیجه را در پنجره زمانی مناسب پس از واکسن تفسیر کنید و آن را با نمونه پیش از واکسن یا نوبت بعدی هم‌روش مقایسه کنید. اگر واکسن کشته بوده، پوشش تزریق هر پرنده مهم است؛ اگر زنده بوده، روش توزیع و یکنواختی مصرف/اسپری را بررسی کنید.'})
  const low=values.filter(x=>x<=4).length,high=values.filter(x=>x>=16).length
  if(n&&hiFourHau&&low>0&&high>0){
   scenarios.push({name:'پاسخ همورال پایین در بخشی از نمونه‌ها',likelihood:'فرضیه قابل بررسی؛ نه تشخیص',for:['سهم قابل توجهی از نمونه‌ها تیترهای پایین دارند','اگر نمونه‌گیری پس از زمان کافی از واکسن بوده باشد، پاسخ پایین نیازمند بررسی اجرایی است'],against:['زمان دقیق و تمام نوبت‌های واکسن مشخص نیست','آنتی‌ژن و شرایط استاندارد HI ممکن است مقایسه را تغییر دهند'],meaning:'بررسی یکنواختی اجرای واکسن زنده (آب/اسپری)، کیفیت آب و زنجیره سرد، یا پوشش تزریق واکسن کشته؛ همچنین MDA، بیماری همزمان و تفاوت سالن‌ها. در واکسن کشته، انتقال پرنده‌به‌پرنده رخ نمی‌دهد و جاافتادن تزریق می‌تواند زیرجمعیت کم‌پاسخ بسازد.'})
  }

  const poorVaccineRun=scenarios.find(x=>x.name.includes('پاسخ همورال پایین'))
  if(relevantVaccines.some(e=>['poor','uncertain'].includes(str(e,'administrationQuality')))&&poorVaccineRun){poorVaccineRun.for.push('در تاریخچه فارم، کیفیت اجرای دست‌کم یک نوبت واکسن نامطمئن/نامناسب گزارش شده');poorVaccineRun.likelihood='با توجه به ثبت مشکل اجرایی، فرضیه اجرایی اولویت بیشتری برای ممیزی دارد'}
  if(respiratorySigns||neurologicalSigns||mortalityTrend==='increasing'){const ndField=scenarios.find(x=>x.name.includes('مواجهه میدانی'));if(ndField)ndField.for.push('علائم/روند بالینی ثبت‌شده با یک بررسی تشخیصی نیوکاسل سازگار است، اما اختصاصی نیست')}
  scenarios.push({name:'مواجهه میدانی با ویروس نیوکاسل',likelihood:'فقط در صورت شواهد اپیدمیولوژیک/روندی مطرح می‌شود',for:['افزایش معنی‌دار تیتر در نمونه‌های جفتی بدون واکسن جدید','علائم تنفسی/عصبی، افزایش تلفات یا ارتباط اپیدمیولوژیک',...(signs?[('علائم گزارش‌شده: '+signs)]:[]),...(highMortality?['تلفات '+mortality+'٪ گزارش شده است']:[]),...(str(clinical,'directTests')?['آزمون مستقیم ثبت‌شده: '+str(clinical,'directTests')]:[])],against:['یک نوبت تیتر پس از واکسن، علت را تفکیک نمی‌کند'],meaning:'در صورت وجود علائم یا افزایش تلفات، نمونه‌گیری سواب مناسب و RT-PCR/توالی‌یابی و بررسی کالبدگشایی لازم است. تا آن زمان برچسب عفونت میدانی یا ویروس ولوژنیک از سرولوژی صادر نشود. '+(str(clinical,'exposureRisks')?'ریسک مواجهه ثبت‌شده برای بررسی اپیدمیولوژیک: '+str(clinical,'exposureRisks'):'ریسک مواجهه فارم هنوز ثبت نشده است.')})
  add(outlook,'چشم‌انداز کوتاه‌مدت','اگر برنامه واکسن به‌درستی اجرا شده و گله بدون علائم است، تیترها ممکن است با گذشت زمان کاهش یابند؛ اگر پاسخ ناهمگون باشد، بخشی از گله ممکن است در مواجهه آینده حاشیه ایمنی کمتری داشته باشد. از یک نوبت نمی‌توان زمان یا احتمال وقوع بیماری را عددی پیش‌بینی کرد.','caution')
  actions.push({priority:'۱ – فوری در صورت علائم',task:'در صورت افزایش تلفات یا علائم عصبی/تنفسی، نمونه‌گیری مستقیم و RT-PCR نیوکاسل را با دامپزشک آزمایشگاه هماهنگ کنید.',reason:'سرولوژی به‌تنهایی عفونت فعال یا حدت را تعیین نمی‌کند.'},{priority:'۲ – ممیزی واکسن',task:'برنامه تمام نوبت‌ها، سویه، مسیر، تاریخ، کیفیت آب/اسپری و درصد پوشش تزریق را بازبینی کنید.',reason:'خطای توزیع واکسن زنده و جاافتادن واکسن کشته سازوکارهای متفاوتی دارند.'},{priority:'۳ – پایش',task:'در صورت نیاز، نمونه جفتی از همان جمعیت و با همان روش/آنتی‌ژن در فاصله زمانی مناسب بگیرید.',reason:'جهت تغییر تیتر از یک مقدار منفرد اطلاع‌بخش‌تر است.'})
 }else if(disease==='AIV'){
  source('WOAH – Avian influenza tests','https://www.woah.org/fileadmin/Home/eng/Health_standards/tahm/3.03.04_AI.pdf')
  source('EFSA 2024 – Vaccination of poultry against HPAI, surveillance','https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2024.8755')
  add(observations,'هدف آزمون و آنتی‌ژن','HI آنتی‌بادی علیه HA همان آنتی‌ژن آزمون را می‌سنجد؛ عدم تطابق سویه می‌تواند تیتر را پایین نشان دهد. آزمون NP-ELISA شواهد آنتی‌بادی علیه NP می‌دهد و به‌تنهایی H5/H9 را تعیین نمی‌کند.','caution')
  const aiVaxInterval=lastVaxDays??sinceVaccine
  if(aiVaxInterval!==null&&aiVaxInterval>=0&&aiVaxInterval<28)add(observations,'زمان نمونه‌گیری پس از واکسن آنفلوانزا','نمونه‌گیری '+aiVaxInterval+' روز پس از آخرین نوبت ثبت‌شده است. در بسیاری از برنامه‌ها پاسخ قابل‌اندازه‌گیری طی ۲ تا ۴ هفته ظاهر می‌شود؛ این بازه به نوع پلتفرم و آنتی‌ژن آزمون وابسته است.','caution')
  if(lastRelevant&&lastVaxDays!==null&&lastVaxDays>=0&&lastVaxDays<=28)scenarios.push({name:'پاسخ پس از واکسن اخیر آنفلوانزا',likelihood:'وابسته به پلتفرم، آنتی‌ژن و فاصله نمونه‌گیری',for:['آخرین نوبت مرتبط '+lastVaxDays+' روز پیش از نمونه‌گیری ثبت شده است','اگر واکسن غیرفعال بوده، زمان لازم برای پاسخ همورال و پوشش تزریق باید لحاظ شود'],against:['پلتفرم، آنتی‌ژن و پوشش واقعی ممکن است ناقص ثبت شده باشند','تیتر HI فقط در برابر آنتی‌ژن آزمون تفسیر می‌شود'],meaning:'نتیجه را در پنجره زمانی مناسب و با آنتی‌ژن همولوگ ارزیابی کنید؛ تیتر پایین زودهنگام به‌تنهایی شکست واکسن نیست.'})
  scenarios.push({name:'پاسخ ناکافی یا ناهمگون به واکسن آنفلوانزا',likelihood:'اگر زمان کافی گذشته و واکسن تزریقی غیرفعال بوده، فرضیه اجرایی مهم است',for:['تیتر پایین/پراکندگی زیاد پس از پنجره زمانی مناسب','در واکسن غیرفعال، هر پرنده باید دوز کامل دریافت کند'],against:['آنتی‌ژن آزمون ممکن است با سویه واکسن همولوگ نباشد','نوع واکسن و زمان تزریق ممکن است ثبت ناقص باشد'],meaning:'ابتدا نوع پلتفرم را مشخص کنید. اگر واکسن غیرفعال بوده، تعداد پرندگان تزریق‌شده، دوز، محل تزریق، سلامت امولسیون، نگهداری و زنجیره سرد بررسی شود؛ سپس تطابق آنتی‌ژن HI با واکسن ارزیابی شود.'})
  scenarios.push({name:'عدم تطابق آنتی‌ژنی واکسن و آنتی‌ژن آزمون',likelihood:'در HI یک احتمال مهم',for:['تیتر پایین با آنتی‌ژن آزمون غیرهمولوگ یا نامشخص','تفاوت‌های آنتی‌ژنی HA درون یک زیرتیپ'],against:['اگر آنتی‌ژن همولوگ و روش معتبر باشد، این توضیح ضعیف‌تر می‌شود'],meaning:'برای سنجش پاسخ واکسن از آنتی‌ژن واکسن/نزدیک به آن و برای ارزیابی واکنش به ویروس در گردش از آنتی‌ژن مرتبط با ویروس میدانی استفاده شود؛ این دو پرسش یکی نیستند.'})
  if(respiratorySigns||/(کاهش|افت|-)/.test(str(clinical,'waterIntake')+' '+str(clinical,'feedIntake'))){const aiField=scenarios.find(x=>x.name.includes('مواجهه میدانی با AIV'));if(aiField)aiField.for.push('علائم تنفسی یا افت مصرف ثبت شده است؛ این یافته‌ها غیراختصاصی‌اند و نیازمند آزمون مستقیم هستند')}
  scenarios.push({name:'مواجهه میدانی با AIV',likelihood:'از تیتر منفرد قابل نتیجه‌گیری نیست',for:['افزایش ۲ تا ۳ log₂ در HI طی پایش متوالی بدون بوستر جدید پس از رسیدن به plateau','شواهد بالینی یا اپیدمیولوژیک و نتایج NP/آزمون مستقیم',...(signs?['علائم ثبت‌شده: '+signs]:[]),...(highMortality?['تلفات '+mortality+'٪ ثبت شده است']:[]),...(str(clinical,'directTests')?['نتیجه مستقیم ثبت‌شده: '+str(clinical,'directTests')]:[])],against:['واکسن اخیر و آنتی‌ژن نامتناسب می‌توانند تفسیر را مخدوش کنند'],meaning:'در صورت ظن، طبق الزامات دامپزشکی و مقررات محلی نمونه‌گیری ویروس‌شناختی و RT-PCR/تعیین زیرتیپ انجام شود؛ سرولوژی به‌تنهایی تشخیص یا رد HPAI نیست.'})
  add(outlook,'چشم‌انداز','اگر واکسن تازه تزریق شده باشد، تیتر ممکن است هنوز در حال شکل‌گیری باشد. اگر چند هفته گذشته و تیتر همولوگ پایین بماند، نقص اجرا/پاسخ یا عدم تطابق آنتی‌ژن باید بررسی شود. تیتر مثبت نیز به‌تنهایی مانع عفونت یا دفع ویروس نیست.','caution')
  actions.push({priority:'۱ – تطبیق آزمون',task:'زیرتیپ، سویه و منبع آنتی‌ژن HI و HAU را ثبت و با سویه واکسن تطبیق دهید.',reason:'نتیجه HI به تطابق آنتی‌ژنی حساس است.'},{priority:'۲ – ممیزی واکسیناسیون',task:'نوع پلتفرم، زمان، دوز، مسیر و پوشش واکسن را بازبینی کنید.',reason:'تفسیر واکسن کشته با وکتور/نوترکیب یکسان نیست.'},{priority:'۳ – بررسی شک به گردش ویروس',task:'در صورت شواهد مشکوک، آزمون مستقیم ویروس و زیرتیپ‌یابی را طبق دستورالعمل دامپزشکی پیگیری کنید.',reason:'سرولوژی به‌تنهایی گردش ویروس فعال را ثابت نمی‌کند.'})
 }else if(disease==='IBV'){
  source('WOAH – Avian infectious bronchitis manual','https://www.woah.org/fileadmin/Home/eng/Health_standards/tahm/3.03.02_AIB.pdf')
  source('Infectious Bronchitis Virus Evolution, Diagnosis and Control (review)','https://pmc.ncbi.nlm.nih.gov/articles/PMC7356646/')
  add(observations,'معنای ELISA عمومی برونشیت','ELISA معمول IBV غالباً پاسخ پلی‌کلونال علیه آنتی‌ژن‌های ویروس را نشان می‌دهد؛ معمولاً ژنوتیپ/سروتیپ را مشخص نمی‌کند و تیتر بالاتر معادل حفاظت متقاطع علیه سویه میدانی نیست.','caution')
  if(lastRelevant&&lastVaxDays!==null&&lastVaxDays>=0&&lastVaxDays<=14)scenarios.push({name:'اثر واکسن زنده اخیر بر سرولوژی برونشیت',likelihood:'توضیح زمانی مهم، به‌ویژه پس از تجویز زنده',for:['آخرین نوبت واکسن IBV '+lastVaxDays+' روز پیش از نمونه‌گیری ثبت شده است','واکسن زنده می‌تواند پاسخ همورال و شناسایی مولکولی را تحت تأثیر قرار دهد'],against:['ELISA عمومی سویه واکسن یا میدان را تفکیک نمی‌کند','کیفیت تجویز و تکثیر واکسن در گله مشخص نیست'],meaning:'تیتر را با پنجره زمانی پس از واکسن و خط پایه همان فارم مقایسه کنید. در صورت PCR مثبت، سابقه واکسن زنده و توالی‌یابی S1 برای تفسیر سویه اهمیت دارد.'})
  scenarios.push({name:'پاسخ قابل انتظار به واکسن زنده',likelihood:'اگر نمونه در پنجره زمانی مناسب گرفته شده و روند/پراکندگی متناسب باشد',for:['افزایش تیتر پس از واکسن با زمان‌بندی معقول','پراکندگی محدودتر در مقایسه با خط پایه همان گله'],against:['یک نوبت منفرد، روند پاسخ را نشان نمی‌دهد','ELISA عمومی سویه را مشخص نمی‌کند'],meaning:'با پاسخ همورال پس از واکسن سازگار است؛ اما حفاظت مخاطی تنفسی و حفاظت علیه سویه ناهمولوگ از تیتر ELISA قابل اثبات نیست.'})
  if(respiratorySigns){const ibField=scenarios.find(x=>x.name.includes('مواجهه میدانی یا گردش'));if(ibField)ibField.for.push('علائم تنفسی در فارم ثبت شده‌اند؛ افتراق ND، AIV، مایکوپلاسما و عوامل همزمان ضروری است')}
  scenarios.push({name:'مواجهه میدانی یا گردش سویه متفاوت',likelihood:'در صورت افزایش غیرمنتظره نسبت به خط پایه و شواهد بالینی مطرح می‌شود',for:['افزایش واضح تیتر در نمونه جفتی/روندی بدون واکسن جدید','علائم تنفسی، افت تولید یا درگیری کلیوی متناسب با زمینه گله',...(signs?['علائم ثبت‌شده: '+signs]:[]),...(str(clinical,'necropsy')?['ضایعات ثبت‌شده: '+str(clinical,'necropsy')]:[])],against:['واکسن‌های زنده متعدد می‌توانند پاسخ و PCR را پیچیده کنند','تیتر ELISA عمومی سویه واکسن و میدان را جدا نمی‌کند'],meaning:'RT-PCR از سواب مناسب و در صورت مثبت‌شدن، ژنوتایپینگ/توالی‌یابی S1 برای تمایز سویه‌ها لازم است؛ PCR مثبت به‌تنهایی زنده‌بودن ویروس یا بیماری‌زایی را ثابت نمی‌کند.'})
  scenarios.push({name:'عدم تطابق آنتی‌ژنی و حفاظت متقاطع ناکافی',likelihood:'برای بیماری بالینی با وجود تیتر ELISA قابل توجه باید بررسی شود',for:['بیماری تنفسی با وجود پاسخ سرمی','شواهد گردش ژنوتیپ/سروتیپ متفاوت'],against:['بدون شناسایی سویه میدانی نمی‌توان عدم تطابق را اثبات کرد'],meaning:'نتیجه ELISA عمومی را با VN/HI اختصاصی یا توالی‌یابی جایگزین/تکمیل کنید؛ تصمیم واکسن بر اساس سویه شناسایی‌شده و شواهد حفاظت محلی گرفته شود.'})
  add(outlook,'چشم‌انداز','تیتر ممکن است پس از واکسن افزایش یابد و سپس افت کند؛ برای تشخیص افزایش غیرمنتظره، نوبت‌های هم‌روش و هم‌کیت لازم است. بروز بیماری تنفسی در آینده را نمی‌توان از یک مقدار ELISA پیش‌بینی کرد.','caution')
  actions.push({priority:'۱ – تحلیل روند',task:'نتیجه را با خط پایه و نمونه جفتی هم‌کیت/هم‌روش مقایسه کنید.',reason:'روند تغییر از تیتر منفرد ارزش تفسیری بیشتری دارد.'},{priority:'۲ – اگر علائم وجود دارد',task:'RT-PCR از سواب نای/دهانی‌حلقی یا نمونه مناسب را پیگیری کنید و در صورت مثبت‌شدن سویه‌یابی انجام دهید.',reason:'تشخیص قطعی و تعیین ژنوتیپ با سرولوژی عمومی ممکن نیست.'},{priority:'۳ – بازنگری واکسن',task:'سویه‌های زنده مصرفی، فاصله و روش تجویز، واکسن‌های همزمان و شرایط فارم را مرور کنید.',reason:'پاسخ همورال تنها یکی از اجزای ایمنی IBV است.'})
 }else if(disease==='IBD'){
  source('WOAH – Infectious bursal disease, Terrestrial Manual, Chapter 3.3.12','https://www.woah.org/fileadmin/Home/eng/Health_standards/tahm/3.03.12_IBD.pdf')
  source('Merck Veterinary Manual – Infectious bursal disease','https://www.merckvetmanual.com/poultry/infectious-bursal-disease/infectious-bursal-disease-in-poultry')
  source('Field study – timing of IBD vaccination and MDA','https://www.tandfonline.com/doi/full/10.1080/03079450701589175')
  const mda=purpose==='mda'||(Number.isFinite(Number(i.samplingAgeDays))&&Number(i.samplingAgeDays)<=14)
  add(observations,'تفسیر وابسته به سن','در جوجه کم‌سن، آنتی‌بادی قابل‌اندازه‌گیری می‌تواند مادری باشد. در سن بالاتر، واکسن و مواجهه میدانی هم به زمینه تفسیر اضافه می‌شوند. بدون سن دقیق، تاریخ هچ و سابقه مادر، منشأ تیتر را تعیین نکنید.','caution')
  if(mda){
   scenarios.push({name:'غلبه آنتی‌بادی مادری (MDA)',likelihood:'در نمونه‌های هفته اول/دوم محتمل؛ باید با داده مادر تأیید شود',for:['سن پایین در زمان نمونه‌گیری','تیتر قابل توجه در روزهای اول زندگی','روند نزولی در نمونه‌های متوالی اولیه'],against:['واکسن زودهنگام یا مواجهه نیز می‌تواند بر روند اثر بگذارد','یک نمونه منفرد نیمه‌عمر را تعیین نمی‌کند'],meaning:'برای محاسبه زمان واکسن باید تیتر روز اول/نمونه نماینده، نیمه‌عمر متناسب با گله و کیت، BTT اختصاصی واکسن و درصد هدف گله مشخص باشد. فرمول Deventer بدون این ورودی‌ها نباید اجرا شود.'})
  }
  if(lastRelevant&&lastVaxDays!==null&&lastVaxDays>=0&&lastVaxDays<=14)scenarios.push({name:'فاصله کوتاه واکسن گامبورو تا نمونه‌گیری',likelihood:'نیازمند توجه به نوع پلتفرم و سن جوجه',for:['آخرین نوبت IBD '+lastVaxDays+' روز قبل از نمونه‌گیری ثبت شده است','در واکسن‌های زنده، زمان پاسخ به سن و وضعیت MDA وابسته است'],against:['برای immune-complex و HVT-VP2 تفسیر یکسان نیست','تیتر فعلی به‌تنهایی زمان مناسب واکسن را مشخص نمی‌کند'],meaning:'نوع واکسن و BTT اختصاصی آن را مشخص کنید. برای محاسبه زمان‌بندی، داده روز اول، نیمه‌عمر و مدل معتبر Deventer لازم است.'})
  scenarios.push({name:'تداخل MDA با واکسن زنده',likelihood:'اگر واکسن زنده در زمانی تجویز شده که MDA هنوز بالاتر از BTT بوده، قابل بررسی',for:['MDA بالا در روز واکسن بر اساس مدل معتبر','پاسخ بعدی ناهمگون یا ضعیف'],against:['نوع واکسن، BTT و سطح MDA فعلی نامشخص است','واکسن‌های immune-complex و HVT-VP2 رفتار متفاوتی دارند'],meaning:'تاریخ و نوع واکسن را با BTT و مدل اختصاصی تطبیق دهید. واکسن HVT-VP2 از نظر تداخل MDA با واکسن زنده کلاسیک یکسان نیست.'})
  if(entericSigns||bursalSigns||mortalityTrend==='increasing'){const ibdField=scenarios.find(x=>x.name.includes('پاسخ ناهمگون واکسن یا مواجهه'));if(ibdField)ibdField.for.push('اسهال/یافته بورس/روند تلفات در تاریخچه بالینی ثبت شده؛ باید با ضایعات بورس و آزمون مستقیم تطبیق یابد')}
  scenarios.push({name:'پاسخ ناهمگون واکسن یا مواجهه میدانی IBDV',likelihood:'اگر ناهمگنی تیتر با علائم/ضایعات بورس همراه باشد اهمیت بیشتری دارد',for:['پراکندگی زیاد تیتر در نمونه‌های نماینده','بورس متورم/آتروفیک، خونریزی یا لنفوسیت‌دپلیشن در بافت‌شناسی',...(signs?['علائم ثبت‌شده: '+signs]:[]),...(str(clinical,'necropsy')?['یافته کالبدگشایی ثبت‌شده: '+str(clinical,'necropsy')]:[])],against:['تیتر سرمی به‌تنهایی ضایعه بورس یا سویه ویروس را تشخیص نمی‌دهد','استرس، سموم و واکسن نیز می‌توانند بر بورس اثر بگذارند'],meaning:'معاینه بورس، هیستوپاتولوژی و RT-PCR/توالی‌یابی VP2 در نمونه مناسب برای تفکیک واکسن/میدان و ارزیابی ضایعه لازم است.'})
  add(outlook,'چشم‌انداز','در جوجه کم‌سن، MDA به‌طور طبیعی کاهش می‌یابد. اگر زمان واکسن زنده درست انتخاب نشود، ممکن است پنجره حساسیت ایجاد شود یا پاسخ واکسن به‌علت MDA مهار شود. این خطر را فقط با داده روز اول، BTT، نیمه‌عمر و نوع واکسن می‌توان مدل کرد؛ تیتر فعلی به‌تنهایی تاریخ دقیق واکسن بعدی را تعیین نمی‌کند.','caution')
  actions.push({priority:'۱ – تکمیل داده MDA',task:'تیتر روز اول/روز هچ، تاریخ هچ، سن نمونه‌گیری، کیت دقیق و BTT/نیمه‌عمر مستند را وارد کنید.',reason:'محاسبه Deventer به این ورودی‌ها وابسته است.'},{priority:'۲ – ارزیابی بورس',task:'در صورت افت عملکرد، تلفات یا شک به IBD، بورس را از نظر ماکروسکوپی و هیستوپاتولوژی بررسی کنید.',reason:'ضایعه بافتی از تیتر سرمی برای ارزیابی آسیب بورس مستقیم‌تر است.'},{priority:'۳ – آزمون مستقیم',task:'در نمونه بورس، RT-PCR و در صورت نیاز توالی‌یابی VP2 را انجام دهید.',reason:'برای شناسایی ویروس و تمایز ژنوتیپی/واکسنی لازم است.'})
 }else{
  scenarios.push({name:'کد بیماری پشتیبانی‌شده نیست',likelihood:'—',for:[],against:[],meaning:'این نسخه موتور برای ND، AIV، IBV و IBD طراحی شده است.'})
 }
 if(clinicalStatus==='clinical'||clinicalStatus==='problem'||mortalityTrend==='increasing'){
  actions.unshift({priority:'۱ – ارزیابی بالینی',task:'وضعیت بالینی، تلفات روزانه، مصرف آب/دان و یافته‌های کالبدگشایی را با نمونه‌گیری مستقیم متناسب با بیماری تطبیق دهید.',reason:'وجود علائم یا افت عملکرد، تفسیر سرولوژی را از پایش واکسن به بررسی تشخیصی تغییر می‌دهد.'})
  if(disease==='ND'||disease==='AIV'||disease==='IBV'||disease==='IBD')add(outlook,'پیش‌بینی مشروط به وضعیت بالینی','با ثبت علائم یا روند تلفات افزایشی، احتمال مسئله فعال گله باید جدی‌تر بررسی شود؛ اما نوع عامل و شدت آینده فقط با تیتر قابل تعیین نیست.','risk')
 }
 if(!demo&&n<2)add(observations,'داده ناکافی','برای تحلیل توزیع و سناریوهای مبتنی بر نمونه، حداقل دو نتیجه لازم است.','risk')
 if(!demo&&qc==='fail')limitations.push('QC رد شده است؛ سناریوهای زیستی تنها فرضیه‌های مقدماتی هستند و باید پس از اصلاح/تکرار آزمون بازبینی شوند.')
 const confidence=demo?'غیرقابل استفاده بالینی':(qc==='fail'?'بسیار پایین – QC مردود':i.rawFileImported===true&&qc==='pass'?'محدود به داده و متادیتای ثبت‌شده؛ QC فایل خام پاس شده':'مقدماتی – QC مستقل در دسترس نیست')
 const headline=demo?'رکورد نمایشی؛ تفسیر بالینی صادر نمی‌شود':disease==='ND'?'تفسیر اختصاصی نیوکاسل':disease==='AIV'?'تفسیر اختصاصی آنفلوانزا':disease==='IBV'?'تفسیر اختصاصی برونشیت عفونی':'تفسیر اختصاصی گامبورو'
 return {headline,confidence,observations,scenarios,outlook,actions,limitations:[...new Set(limitations)],sources}
}
