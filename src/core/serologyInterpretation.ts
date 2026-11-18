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
 if(n<2)items.push({level:'block',title:'داده برای تحلیل آماری ناکافی است',detail:'حداقل دو نتیجه معتبر برای محاسبه پراکندگی و فاصله اطمینان لازم است.'})
 if(assay?.minimumSampleCount&&n<assay.minimumSampleCount)items.push({level:'warning',title:'حجم نمونه کمتر از حداقل ثبت‌شده برای این آزمون',detail:'حداقل پیشنهادی/ثبت‌شده در کاتالوگ '+assay.minimumSampleCount+' نمونه است؛ هدف، نسخه IFU و طرح نمونه‌گیری را کنترل کنید.'})
 else if(assay?.recommendedSampleCount&&n<assay.recommendedSampleCount)items.push({level:'info',title:'حجم نمونه کمتر از مقدار توصیه‌شده',detail:'برای این آزمون مقدار توصیه‌شده '+assay.recommendedSampleCount+' نمونه است؛ این هشدار به‌تنهایی آزمون را نامعتبر نمی‌کند.'})
 if(input.randomSamplingConfirmed!==true)items.push({level:'warning',title:'نمایندگی نمونه‌ها تأیید نشده',detail:'بدون نمونه‌گیری تصادفی/طبقه‌بندی‌شده و پوشش سالن‌ها، تعمیم نتایج به کل گله محدود است.'})
 if(isUnknown(str(input,'assayVersion'))||isUnknown(str(input,'kitLot'))||isUnknown(str(input,'readerModel'))||isUnknown(str(input,'protocolVersion')))items.push({level:'warning',title:'ردیابی آزمون ناقص است',detail:'نسخه IFU، Lot، مدل Reader و نسخه پروتکل باید ثبت شوند؛ مقایسه روند یا بین گله‌ها ممکن است غیرفعال شود.'})
 if(!str(input,'samplingPurpose')){items.push({level:'warning',title:'هدف نمونه‌گیری ثبت نشده',detail:'MDA، بررسی پاسخ پس از واکسن، پایش روند، غربالگری و بررسی مواجهه میدانی پرسش‌های متفاوتی هستند.'});nextData.push('هدف دقیق نمونه‌گیری')}
 if(!str(input,'vaccinePlatform')||str(input,'vaccinePlatform')==='unknown')nextData.push('پلتفرم واکسن: زنده، غیرفعال، وکتور، نوترکیب یا سایر')
 if(!str(input,'vaccineDate'))nextData.push('تاریخ دقیق واکسیناسیون و فاصله تا نمونه‌گیری')
 if(method==='HI'&&['hiHAU','antigenPretreatment','serumPretreatment','dilutionFactor','rbcSource','rbcLot','rbcConcentration'].some(k=>isUnknown(str(input,k))))items.push({level:'warning',title:'جزئیات استانداردسازی HI ناقص است',detail:'HAU، تیمار آنتی‌ژن/سرم، ضریب رقت و مشخصات RBC برای مقایسه‌پذیری نتایج HI ضروری‌اند.'})
 if(method==='ELISA'&&['od','sp','sn'].includes(scale)&&!str(input,'cutoffSource'))items.push({level:'warning',title:'آستانه تفسیر ثبت نشده',detail:'درصد مثبت یا طبقه‌بندی مثبت/منفی بدون cutoff، جهت مقایسه و مرجع IFU محاسبه نمی‌شود.'})
 if(['kit-titer','hi-reciprocal'].includes(scale)&&values.some(v=>v<=0))items.push({level:'block',title:'مقدار صفر در مقیاس تیتر',detail:'برای GMT و تحلیل log₂، صفر را نمی‌توان به‌صورت خودکار جایگزین کرد؛ حد تشخیص و روش برخورد با نتایج زیر حد تشخیص باید از IFU مشخص شود.'})
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
