import { findAssayCatalogEntry } from './assayRegistry'

export type SerologyInterpretationItem={level:'info'|'warning'|'block';title:string;detail:string}
export type SerologyInterpretation={items:SerologyInterpretationItem[];summary:string;nextData:string[]}

type Input=Record<string,unknown>
const str=(x:Input,k:string)=>typeof x[k]==='string'?String(x[k]).trim():''
const arr=(v:unknown):number[]=>Array.isArray(v)&&v.every(x=>typeof x==='number'&&Number.isFinite(x))?v as number[]:[]
const isUnknown=(v:string)=>!v||['unknown','نامشخص','نامعلوم','n/a','na','not provided'].includes(v.toLowerCase())

/** Conservative, source-aware interpretation. This function never infers clinical protection from antibody titres. */
export function interpretSerologyRound(disease:string,input:Input):SerologyInterpretation{
 const items:SerologyInterpretationItem[]=[],nextData:string[]=[],values=arr(input.titers),n=values.length
 const assay=findAssayCatalogEntry(str(input,'assayId'))
 const method=str(input,'method'),scale=str(input,'scale'),demo=input.demo===true||str(input,'qcStatus')==='demo'
 const raw=input.rawFileImported===true,meta=input.readerImportMeta&&typeof input.readerImportMeta==='object'?input.readerImportMeta as Input:{}
 const qc=raw?str(meta,'qcStatus'):str(input,'qcStatus')
 if(demo)items.push({level:'warning',title:'داده نمایشی',detail:'این رکورد شبیه‌سازی‌شده است؛ هیچ تفسیر آزمایشگاهی یا تصمیم گله‌ای از آن استخراج نمی‌شود.'})
 else if(raw&&qc!=='pass')items.push({level:'block',title:'اعتبار پلیت تأیید نشده',detail:qc==='fail'?'کنترل‌های ثبت‌شده با معیارهای واردشده سازگار نیستند؛ نتایج نمونه‌ها تا بررسی Run قابل گزارش قطعی نیستند.':'معیارهای QC یا داده کنترل کافی نیست؛ وضعیت پلیت در انتظار بررسی است.'})
 else if(!raw)items.push({level:'warning',title:'QC اظهاری است',detail:'فایل خام و کنترل‌های پلیت برای ممیزی مستقل در دسترس نیستند؛ وضعیت ثبت‌شده توسط اپراتور تأیید مستقل محسوب نمی‌شود.'})
 if(n>=2){
  const sorted=[...values].sort((a,b)=>a-b),mean=values.reduce((a,b)=>a+b,0)/n,sd=Math.sqrt(values.reduce((a,b)=>a+(b-mean)**2,0)/(n-1)),median=n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2
  const percentile=(p:number)=>sorted[Math.max(0,Math.ceil(p*n)-1)],q1=percentile(.25),q3=percentile(.75),iqr=q3-q1,outliers=values.filter(v=>v<q1-1.5*iqr||v>q3+1.5*iqr).length
  const cv=mean!==0?sd/mean*100:null
  const ratioScale=scale==='kit-titer'||scale==='hi-reciprocal',positive=values.every(v=>v>0)
  const gmt=ratioScale&&positive?2**(values.reduce((a,v)=>a+Math.log2(v),0)/n):null
  const logSd=ratioScale&&positive?Math.sqrt(values.reduce((a,v)=>a+(Math.log2(v)-Math.log2(gmt as number))**2,0)/(n-1)):null
  items.push({level:'info',title:'خلاصه توزیع نمونه‌ها',detail:'n='+n+'؛ میانگین='+mean.toFixed(2)+'؛ میانه='+median.toFixed(2)+'؛ SD='+sd.toFixed(2)+(cv===null?'':'؛ CV خام='+cv.toFixed(1)+'٪')+'؛ دامنه='+sorted[0]+' تا '+sorted[n-1]+'. این شاخص‌ها توصیفی‌اند و حد حفاظت یا cut-off محسوب نمی‌شوند.'})
  if(gmt!==null)items.push({level:'info',title:'توزیع تیتر در مقیاس لگاریتمی',detail:'GMT='+gmt.toFixed(2)+'؛ SD در مقیاس log₂='+Number(logSd).toFixed(2)+'؛ این شاخص‌ها برای توصیف پراکندگی تیتر ratio-scale هستند و به‌تنهایی حفاظت را پیش‌بینی نمی‌کنند.'})
  if(outliers>0)items.push({level:'warning',title:'نمونه‌های دورافتاده آماری',detail:outliers+' نتیجه خارج از محدوده ۱٫۵×IQR شناسایی شد. این موارد خطای قطعی نیستند؛ ابتدا چاهک/نمونه، ورود داده، وضعیت پرنده و پراکندگی واقعی گله بررسی شود.'})
  const cutoff=typeof input.seropositivityCutoff==='number'?input.seropositivityCutoff:typeof input.seropositivityCutoff==='string'&&input.seropositivityCutoff.trim()?Number(input.seropositivityCutoff):NaN
  if(Number.isFinite(cutoff)&&str(input,'cutoffSource')){const direction=input.cutoffDirection==='below'?'below':'above',positiveCount=values.filter(v=>direction==='above'?v>=cutoff:v<=cutoff).length;items.push({level:'info',title:'طبقه‌بندی مثبت طبق cutoff واردشده',detail:positiveCount+' از '+n+' نمونه ('+(positiveCount/n*100).toFixed(1)+'٪) طبق جهت '+direction+' و مرجع ثبت‌شده؛ صحت cutoff باید با نسخه IFU همین کیت کنترل شود.'})}
 }
 if(n<2)items.push({level:'block',title:'داده برای تحلیل آماری ناکافی است',detail:'حداقل دو نتیجه معتبر برای محاسبه پراکندگی و فاصله اطمینان لازم است.'})
 if(assay?.minimumSampleCount&&n<assay.minimumSampleCount)items.push({level:'warning',title:'حجم نمونه کمتر از حداقل ثبت‌شده برای این آزمون',detail:'حداقل پیشنهادی/ثبت‌شده در کاتالوگ '+assay.minimumSampleCount+' نمونه است؛ هدف، نسخه IFU و طرح نمونه‌گیری را کنترل کنید.'})
 else if(assay?.recommendedSampleCount&&n<assay.recommendedSampleCount)items.push({level:'info',title:'حجم نمونه کمتر از مقدار توصیه‌شده',detail:'برای این آزمون مقدار توصیه‌شده '+assay.recommendedSampleCount+' نمونه است؛ این هشدار به‌تنهایی آزمون را نامعتبر نمی‌کند.'})
 if(input.randomSamplingConfirmed!==true)items.push({level:'warning',title:'نمایندگی نمونه‌ها تأیید نشده',detail:'بدون نمونه‌گیری تصادفی/طبقه‌بندی‌شده و پوشش سالن‌ها، تعمیم نتایج به کل گله محدود است.'})
 if(isUnknown(str(input,'assayVersion'))||isUnknown(str(input,'kitLot'))||isUnknown(str(input,'readerModel'))||isUnknown(str(input,'protocolVersion')))items.push({level:'warning',title:'ردیابی آزمون ناقص است',detail:'نسخه IFU، Lot، مدل Reader و نسخه پروتکل باید ثبت شوند؛ مقایسه روند یا بین گله‌ها ممکن است غیرفعال شود.'})
 if(!str(input,'samplingPurpose')){items.push({level:'warning',title:'هدف نمونه‌گیری ثبت نشده',detail:'MDA، بررسی پاسخ پس از واکسن، پایش روند، غربالگری و بررسی مواجهه میدانی پرسش‌های متفاوتی هستند.'});nextData.push('هدف دقیق نمونه‌گیری')}
 if(!str(input,'vaccinePlatform')||str(input,'vaccinePlatform')==='unknown')nextData.push('پلتفرم واکسن: زنده، غیرفعال، وکتور، نوترکیب یا سایر')
 if(!str(input,'vaccineDate'))nextData.push('تاریخ دقیق واکسیناسیون و فاصله تا نمونه‌گیری')
 if(str(input,'vaccineDate')&&str(input,'samplingDate')){
  const v=Date.parse(str(input,'vaccineDate')+'T00:00:00Z'),s=Date.parse(str(input,'samplingDate')+'T00:00:00Z'),days=Math.round((s-v)/86400000)
  if(Number.isFinite(days)&&days>=0)items.push({level:'info',title:'فاصله زمانی واکسن تا نمونه‌گیری',detail:'نمونه '+days+' روز پس از تاریخ واکسن ثبت‌شده گرفته شده است. تفسیر پاسخ باید با نوع واکسن، دوز/مسیر، برنامه و پنجره زمانی معتبر همان آزمون انجام شود؛ زمان به‌تنهایی پاسخ موفق را اثبات نمی‌کند.'})
  else if(Number.isFinite(days))items.push({level:'block',title:'توالی تاریخ‌ها نامعتبر است',detail:'تاریخ نمونه‌گیری پیش از تاریخ واکسیناسیون ثبت شده است؛ تاریخ‌ها را اصلاح کنید.'})
 }
 if(method==='HI'&&['hiHAU','antigenPretreatment','serumPretreatment','dilutionFactor','rbcSource','rbcLot','rbcConcentration'].some(k=>isUnknown(str(input,k))))items.push({level:'warning',title:'جزئیات استانداردسازی HI ناقص است',detail:'HAU، تیمار آنتی‌ژن/سرم، ضریب رقت و مشخصات RBC برای مقایسه‌پذیری نتایج HI ضروری‌اند.'})
 if(method==='ELISA'&&['od','sp','sn'].includes(scale)&&!str(input,'cutoffSource'))items.push({level:'warning',title:'آستانه تفسیر ثبت نشده',detail:'درصد مثبت یا طبقه‌بندی مثبت/منفی بدون cutoff، جهت مقایسه و مرجع IFU محاسبه نمی‌شود.'})
 if(['kit-titer','hi-reciprocal'].includes(scale)&&values.some(v=>v<=0))items.push({level:'block',title:'مقدار صفر در مقیاس تیتر',detail:'برای GMT و تحلیل log₂، صفر را نمی‌توان به‌صورت خودکار جایگزین کرد؛ حد تشخیص و روش برخورد با نتایج زیر حد تشخیص باید از IFU مشخص شود.'})
 if(str(input,'samplingPurpose')==='outbreak')items.push({level:'warning',title:'محدودیت سرولوژی در بررسی چالش/بیماری فعال',detail:'آنتی‌بادی ممکن است حاصل واکسیناسیون یا مواجهه قبلی باشد و به‌تنهایی عفونت فعال را اثبات نمی‌کند؛ تفسیر باید با علائم، کالبدگشایی و آزمون مستقیم مناسب مانند PCR/آنتی‌ژن تلفیق شود.'})
 if(str(input,'samplingPurpose')==='pre-vaccination')items.push({level:'info',title:'پایش پیش از واکسیناسیون',detail:'این داده می‌تواند وضعیت آنتی‌بادی پیش از واکسن را توصیف کند؛ انتخاب زمان واکسیناسیون به مدل اختصاصی کیت/واکسن، آستانه معتبر و شرایط گله نیاز دارد.'})
 if(str(input,'samplingPurpose')==='mda'&&disease==='IBD')items.push({level:'warning',title:'تحلیل MDA هنوز کامل نیست',detail:'برای برآورد زمان افت آنتی‌بادی مادری، سن دقیق نمونه، نمونه روز هچ/روز اول، نیمه‌عمر مستند و BTT اختصاصی واکسن/کیت لازم است. این گزارش بدون این ورودی‌ها زمان واکسیناسیون را محاسبه نمی‌کند.'})
  if(disease==='IBD'){
  if(str(input,'assayId')==='idvet-ibd-vp2'){
   const platform=str(input,'vaccinePlatform').toLowerCase()
   if(!/vp2|recombinant|vector|hvt/.test(platform))items.push({level:'warning',title:'عدم تطابق یا ابهام هدف آزمون IBD-VP2',detail:'این آزمون VP2-labelled است. پیش از تفسیر پاسخ واکسن باید پلتفرم دقیق واکسن نوترکیب VP2 و IFU همان ماتریس تأیید شود؛ نتیجه را با ELISA معمول IBD ادغام نکنید.'})
   else items.push({level:'info',title:'آزمون VP2 از ELISA معمول IBD جدا نگه داشته شد',detail:'تفسیر فقط در چارچوب آنتی‌ژن VP2 و پلتفرم واکسن ثبت‌شده انجام می‌شود؛ این هم‌خوانی به‌تنهایی حفاظت را اثبات نمی‌کند.'})
  }else if(str(input,'assayId')==='idvet-ibd-ibds'&&/vp2|recombinant|vector|hvt/i.test(str(input,'vaccinePlatform')))items.push({level:'warning',title:'احتمال عدم انطباق آزمون و پلتفرم واکسن',detail:'IBDS معمولی و IBDVP2 دو خانواده آزمون جدا هستند؛ برای واکسن نوترکیب VP2 از نتیجه IBDS به‌عنوان سنجش اختصاصی VP2 استفاده نکنید.'})
  if(!str(input,'hatchDate')&&!str(input,'maternalFlockId'))nextData.push('اطلاعات گله مادر، تاریخ هچ و نمونه روز اول برای تحلیل MDA')
  if(!str(input,'halfLifeSource'))nextData.push('نیمه‌عمر آنتی‌بادی مادری و منبع معتبر متناسب با کیت/جمعیت')
 }
 if(disease==='AIV'){
  const target=str(input,'antigen').toLowerCase(),id=str(input,'assayId')
  if(id==='idvet-aiv-flunps'||/nucleoprotein|\bnp\b/.test(target))items.push({level:'info',title:'آزمون هدف NP',detail:'نتیجه NP به‌تنهایی زیرتیپ H5/H9، سویه میدانی یا DIVA را مشخص نمی‌کند. ادعای DIVA فقط در ترکیب دقیق آزمون و راهبرد واکسنِ اعتبارسنجی‌شده مجاز است.'})
  if(/h5/.test(id+' '+target))items.push({level:'info',title:'هدف H5 ثبت شده است',detail:'آزمون H5 را با NP یا H9 یکی نگیرید؛ نتیجه سرولوژی به‌تنهایی clade، ژنوتیپ یا حفاظت بالینی را تعیین نمی‌کند.'})
 }
 if(disease==='IBV')items.push({level:'info',title:'محدودیت اختصاصیت سویه در IBV',detail:'ELISA عمومی IBV را معادل تعیین سویه یا اثبات cross-protection تلقی نکنید؛ برای تعیین سویه به روش مولکولی و شواهد تکمیلی نیاز است.'})
 if(disease==='ND'&&method==='HI')items.push({level:'info',title:'تفسیر HI وابسته به آنتی‌ژن و روش است',detail:'تیتر HI را بدون سویه آنتی‌ژن، HAU، RBC، تیمار سرم و زمینه واکسیناسیون به آستانه حفاظت عمومی تبدیل نکنید.'})
 if(!assay)items.push({level:'warning',title:'کیت در کاتالوگ تأییدشده پیدا نشد',detail:'مشخصات محصول، IFU، آنتی‌ژن، ماتریس و فرمول محاسبه باید پیش از تفسیر اختصاصی ثبت و بررسی شوند.'})
 if(!str(input,'antigen'))nextData.push('آنتی‌ژن دقیق کیت و در صورت وجود سویه/ژنوتیپ مرجع')
 if(!str(input,'sampleMatrix'))nextData.push('ماتریس نمونه و انطباق آن با IFU')
 const blocking=items.some(x=>x.level==='block')
 const summary=demo?'رکورد نمایشی است و فقط برای آزمودن رابط گزارش مناسب است.':blocking?'به‌علت محدودیت QC یا داده، تفسیر نهایی متوقف است.':items.some(x=>x.level==='warning')?'نتایج قابل توصیف‌اند، اما چند محدودیت مهم باید پیش از نتیجه‌گیری برطرف شوند.':'داده‌ها از نظر اطلاعات ثبت‌شده برای تفسیر توصیفی آماده‌اند؛ استنتاج حفاظت یا موفقیت واکسن همچنان مجاز نیست.'
 return {items,summary,nextData:[...new Set(nextData)]}
}
