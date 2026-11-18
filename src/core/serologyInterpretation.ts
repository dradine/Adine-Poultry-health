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
 else if(raw&&qc!=='pass')items.push({level:'warning',title:'QC پلیت تأیید نشده؛ گزارش فقط توصیفی است',detail:qc==='fail'?'کنترل‌های ثبت‌شده معیارهای واردشده را پاس نکرده‌اند؛ شاخص‌های توزیع صرفاً برای بازبینی فنی نمایش داده می‌شوند و تفسیر اختصاصی/مقایسه‌ای مجاز نیست.':'معیارهای QC یا داده کنترل کافی نیست؛ شاخص‌های آماری اولیه نمایش داده می‌شوند، اما نتیجه آزمون از نظر اعتبار پلیت تأیید نشده است.'})
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
 if(str(input,'hatchDate')&&str(input,'samplingDate')&&Number.isFinite(Number(input.samplingAgeDays))){
  const hatch=Date.parse(str(input,'hatchDate')+'T00:00:00Z'),sample=Date.parse(str(input,'samplingDate')+'T00:00:00Z')
  if(Number.isFinite(hatch)&&Number.isFinite(sample)){const derived=Math.round((sample-hatch)/86400000),entered=Number(input.samplingAgeDays);if(Math.abs(derived-entered)>1)items.push({level:'warning',title:'سن واردشده با تاریخ هچ هم‌خوان نیست',detail:'از تاریخ هچ و نمونه‌گیری، سن حدود '+derived+' روز محاسبه می‌شود؛ سن ثبت‌شده '+entered+' روز است. پیش از تحلیل MDA یا روند سنی، تاریخ/سن را تطبیق دهید.'})}
 }
 if(!str(input,'vaccinePlatform')||str(input,'vaccinePlatform')==='unknown')nextData.push('پلتفرم واکسن: زنده، غیرفعال، وکتور، نوترکیب یا سایر')
 if(!str(input,'vaccineDate'))nextData.push('تاریخ دقیق واکسیناسیون و فاصله تا نمونه‌گیری')
 if(str(input,'vaccineDate')&&str(input,'samplingDate')){
  const v=Date.parse(str(input,'vaccineDate')+'T00:00:00Z'),s=Date.parse(str(input,'samplingDate')+'T00:00:00Z'),days=Math.round((s-v)/86400000)
  if(Number.isFinite(days)&&days>=0)items.push({level:'info',title:'فاصله زمانی واکسن تا نمونه‌گیری',detail:'نمونه '+days+' روز پس از تاریخ واکسن ثبت‌شده گرفته شده است. تفسیر پاسخ باید با نوع واکسن، دوز/مسیر، برنامه و پنجره زمانی معتبر همان آزمون انجام شود؛ زمان به‌تنهایی پاسخ موفق را اثبات نمی‌کند.'})
  else if(Number.isFinite(days))items.push({level:'block',title:'توالی تاریخ‌ها نامعتبر است',detail:'تاریخ نمونه‌گیری پیش از تاریخ واکسیناسیون ثبت شده است؛ تاریخ‌ها را اصلاح کنید.'})
 }
 if(method==='ELISA'&&scale==='kit-titer'&&!str(input,'fourFoldComparisonSource'))items.push({level:'info',title:'نسبت چهاربرابری در ELISA غیرفعال است',detail:'تغییر هندسی تیتر قابل توصیف است؛ اما شمارش افزایش/کاهش چهاربرابری فقط پس از ثبت منبع و اعتبارسنجی اختصاصی همان کیت فعال می‌شود.'})
 if(method==='HI'&&['hiHAU','antigenPretreatment','serumPretreatment','dilutionFactor','rbcSource','rbcLot','rbcConcentration'].some(k=>isUnknown(str(input,k))))items.push({level:'warning',title:'جزئیات استانداردسازی HI ناقص است',detail:'HAU، تیمار آنتی‌ژن/سرم، ضریب رقت و مشخصات RBC برای مقایسه‌پذیری نتایج HI ضروری‌اند.'})
 if(method==='ELISA'&&['od','sp','sn'].includes(scale)&&!str(input,'cutoffSource'))items.push({level:'warning',title:'آستانه تفسیر ثبت نشده',detail:'درصد مثبت یا طبقه‌بندی مثبت/منفی بدون cutoff، جهت مقایسه و مرجع IFU محاسبه نمی‌شود.'})
 if(['kit-titer','hi-reciprocal'].includes(scale)&&values.some(v=>v<=0))items.push({level:'block',title:'مقدار صفر در مقیاس تیتر',detail:'برای GMT و تحلیل log₂، صفر را نمی‌توان به‌صورت خودکار جایگزین کرد؛ حد تشخیص و روش برخورد با نتایج زیر حد تشخیص باید از IFU مشخص شود.'})
 if(str(input,'samplingPurpose')==='outbreak')items.push({level:'warning',title:'محدودیت سرولوژی در بررسی چالش/بیماری فعال',detail:'آنتی‌بادی ممکن است حاصل واکسیناسیون یا مواجهه قبلی باشد و به‌تنهایی عفونت فعال را اثبات نمی‌کند؛ تفسیر باید با علائم، کالبدگشایی و آزمون مستقیم مناسب مانند PCR/آنتی‌ژن تلفیق شود.'})
 if(str(input,'samplingPurpose')==='pre-vaccination')items.push({level:'info',title:'پایش پیش از واکسیناسیون',detail:'این داده می‌تواند وضعیت آنتی‌بادی پیش از واکسن را توصیف کند؛ انتخاب زمان واکسیناسیون به مدل اختصاصی کیت/واکسن، آستانه معتبر و شرایط گله نیاز دارد.'})
 if(str(input,'samplingPurpose')==='mda'&&disease==='IBD')items.push({level:'warning',title:'تحلیل MDA هنوز کامل نیست',detail:'برای برآورد زمان افت آنتی‌بادی مادری، سن دقیق نمونه، نمونه روز هچ/روز اول، نیمه‌عمر مستند و BTT اختصاصی واکسن/کیت لازم است. این گزارش بدون این ورودی‌ها زمان واکسیناسیون را محاسبه نمی‌کند.'})
  // Disease-specific clinical pattern interpretation: descriptive signals, ranked hypotheses, and discriminating next steps.
 if(n>=2 && method==='HI' && scale==='hi-reciprocal' && (disease==='ND'||disease==='AIV')){
  const logs=values.filter(v=>v>0).map(Math.log2),logMean=logs.length?logs.reduce((a,b)=>a+b,0)/logs.length:0
  const logSd=logs.length>1?Math.sqrt(logs.reduce((a,b)=>a+(b-logMean)**2,0)/(logs.length-1)):0
  const sortedLogs=[...logs].sort((a,b)=>a-b),gaps=sortedLogs.slice(1).map((v,i)=>({gap:v-sortedLogs[i],at:sortedLogs[i]})).sort((a,b)=>b.gap-a.gap)
  const low=values.filter(v=>v<=4).length,high=values.filter(v=>v>=16).length
  const pct=(x:number)=>Math.round(x/n*100)
  const age=Number(input.samplingAgeDays),vDate=str(input,'vaccineDate'),sDate=str(input,'samplingDate')
  const days=vDate&&sDate?Math.round((Date.parse(sDate+'T00:00:00Z')-Date.parse(vDate+'T00:00:00Z'))/86400000):NaN
  const program=(str(input,'vaccineProgram')+' '+str(input,'vaccine')).toLowerCase()
  const platform=str(input,'vaccinePlatform').toLowerCase()
  const vaccineLive=/live|زنده/.test(program+' '+platform),vaccineKilled=/killed|inactiv|کشته|غیرفعال/.test(program+' '+platform)
  const haUnits=Number(str(input,'hiHAU'))
  const thresholdEligible=method==='HI'&&Number.isFinite(haUnits)&&haUnits===4
  if(disease==='ND'){
   const spread=logSd>=1.5
   const clustered=gaps.length>0&&gaps[0].gap>=2
   if(spread||clustered){
    items.push({level:'warning',title:'الگوی پاسخ نیوکاسل ناهمگون است',detail:'پراکندگی در مقیاس log₂ برابر '+logSd.toFixed(2)+' است؛ '+low+' از '+n+' نمونه ('+pct(low)+'٪) تیتر حداکثر ۱:۴ و '+high+' نمونه ('+pct(high)+'٪) تیتر حداقل ۱:۱۶ دارند. '+(clustered?'بین دو بخش توزیع، فاصله‌ای دست‌کم دو رقت دوبرابری دیده می‌شود. ':'')+'این الگو با پاسخ/دریافت غیریکنواخت واکسن، تفاوت آنتی‌بادی مادری یا وضعیت ایمنی پرندگان، نمونه‌گیری ناهمگون و نیز مواجهه‌های متفاوت با آنتی‌ژن سازگار است؛ هیچ‌کدام از این علت‌ها با یک نوبت HI اثبات نمی‌شود.'})
    items.push({level:'info',title:'فرضیه‌های اولویت‌دار برای بررسی نیوکاسل',detail:'۱) اگر واکسن زنده از آب یا اسپری داده شده: یکنواختی توزیع، مصرف آب، آماده‌سازی، کلر/ضدعفونی‌کننده، زنجیره سرد و پوشش سالن را ممیزی کنید. ۲) اگر واکسن کشته تزریق شده: درصد پرندگان واقعاً تزریق‌شده، دوز کامل، محل تزریق، کیفیت امولسیون و نگهداری را بررسی کنید؛ واکسن کشته از پرنده به پرنده منتقل نمی‌شود. ۳) سابقه MDA، بیماری/استرس و تفاوت سالن‌ها را بررسی کنید. ۴) اگر افزایش تیتر غیرمنتظره یا علائم وجود دارد، مواجهه میدانی را با نمونه‌گیری جفتی و آزمون مستقیم مناسب بررسی کنید.'})
   }else{
    items.push({level:'info',title:'پراکندگی تیتر نیوکاسل در این نوبت',detail:'SD مقیاس log₂ برابر '+logSd.toFixed(2)+' است و '+low+' از '+n+' نمونه در محدوده تیترهای حداکثر ۱:۴ قرار دارند. نبود خوشه‌بندی واضح در این نمونه کوچک، یکنواختی کل گله را اثبات نمی‌کند؛ توزیع سالن‌به‌سالن و طرح نمونه‌گیری باید دیده شود.'})
   }
   if(n<20)items.push({level:'warning',title:'حجم نمونه برای قضاوت کل گله محدود است',detail:'n='+n+' برای توصیف همین نمونه‌ها مفید است، اما برای برآورد مطمئن وضعیت کل گله، به‌ویژه وقتی چند سالن/منبع نمونه وجود دارد، نمونه‌گیری تصادفی طبقه‌بندی‌شده و تعداد کافی‌تر لازم است.'})
   if(thresholdEligible){
    const count=values.filter(v=>v>=16).length
    items.push({level:'info',title:'طبقه‌بندی روش‌محور HI نیوکاسل',detail:count+' از '+n+' نمونه ('+pct(count)+'٪) در حداقل ۱:۱۶ یا بالاتر قرار دارند. این فقط طبقه‌بندی آزمایشگاهی در شرط ۴ HAU است؛ مثبت بودن سرولوژیک معادل حفاظت بالینی یا پوشش واکسیناسیون مؤثر نیست.'})
   }else{
    items.push({level:'warning',title:'آستانه مثبت HI نیوکاسل قابل تعیین نیست',detail:'برای طبقه‌بندی معتبر ۱:۱۶ باید مشخص باشد آزمون با ۴ HAU و روش استاندارد متناظر اجرا شده است. چون HAU/شرایط آزمون ثبت نشده، برنامه عمداً درصد مثبت یا درصد محافظت اعلام نمی‌کند.'})
    nextData.push('HAU واقعی آنتی‌ژن در آزمون HI و تأیید روش ۴ HAU')
   }
   if(Number.isFinite(days)&&days>=0){
    items.push({level:'info',title:'تفسیر زمان‌بندی پس از آخرین واکسن ثبت‌شده',detail:'فاصله ثبت‌شده تا نمونه‌گیری '+days+' روز است. اگر این تاریخ مربوط به نوبت زنده روز ۲۱ و نمونه‌گیری روز ۳۰ باشد، تنها ۹ روز گذشته است؛ این فاصله برای نتیجه‌گیری نهایی درباره پاسخ تقویتی زنده زودهنگام است. بااین‌حال، تیترهای پایین را نمی‌توان فقط به این فاصله نسبت داد، زیرا نوبت‌های قبلی نیز باید در نظر گرفته شوند.'})
   }
   if(/every|هر\s*دو|14\s*day|۱۴\s*روز|دو\s*هفته/.test(program)){
    items.push({level:'warning',title:'تکرار مکرر واکسن زنده؛ بررسی برنامه و کیفیت take ضروری است',detail:'فواصل کوتاه و تکرار واکسن به‌تنهایی تضمین‌کننده پاسخ بهتر نیست. تاریخ، سویه، مسیر و کیفیت اجرای هر نوبت را ثبت کنید و از روی یک تیتر پایین، تکرار زودهنگام یا تغییر خودسرانه برنامه را توصیه نکنید.'})
   }
  }
  if(disease==='AIV'){
   if(days>=0){
    items.push({level:days<14?'warning':'info',title:'زمان نمونه‌گیری نسبت به واکسن آنفلوانزا',detail:'از تاریخ واکسن ثبت‌شده تا نمونه‌گیری '+days+' روز گذشته است. در اغلب برنامه‌ها، پاسخ قابل‌اندازه‌گیری پس از واکسیناسیون طی حدود ۲ تا ۴ هفته ظاهر می‌شود؛ بنابراین اگر کمتر از دو هفته باشد، نمونه‌گیری ممکن است زودهنگام باشد. اگر حدود سه هفته یا بیشتر گذشته و تیترها همچنان پایین‌اند، کیفیت/دوز/تزریق واکسن و تطابق آنتی‌ژن HI باید با اولویت بررسی شوند.'})
   }
   const target=str(input,'antigen')||'ثبت نشده'
   items.push({level:'warning',title:'تطابق آنتی‌ژن H9 با واکسن یک نقطه کلیدی است',detail:'HI فقط آنتی‌بادی‌هایی را خوب می‌سنجد که با HA آنتی‌ژن آزمون واکنش مهاری دارند. اگر آنتی‌ژن آزمایش با سویه واکسن H9 از نظر آنتی‌ژنی فاصله داشته باشد، تیتر پایین می‌تواند بازتاب عدم تطابق باشد، نه الزاماً فقدان پاسخ به واکسن. آنتی‌ژن/سویه آزمون فعلی: '+target+'. برای ارزیابی پاسخ واکسن، آنتی‌ژن همولوگ یا نزدیک به واکسن و برای بررسی مواجهه، آنتی‌ژن مرتبط با ویروس میدانی پرسش متفاوتی را پاسخ می‌دهد.'})
   if(n<20)items.push({level:'warning',title:'حجم نمونه محدود است',detail:'این تعداد نمونه برای توصیف مقدماتی مفید است، اما برای برآورد پوشش کل گله و مقایسه سالن‌ها کافی نیست؛ نمونه‌گیری تصادفی طبقه‌بندی‌شده را در نظر بگیرید.'})
   if(vaccineKilled){
    items.push({level:'warning',title:'پاسخ پایین پس از واکسن کشته: مسیر تزریق و کیفیت واکسن را ممیزی کنید',detail:'واکسن غیرفعال/کشته برخلاف واکسن زنده از پرنده‌ای به پرنده دیگر منتشر نمی‌شود؛ جاافتادن تزریق، دوز ناقص، تزریق نامناسب، نگهداری یا اختلال در زنجیره سرد می‌تواند بخشی از گله را با پاسخ پایین باقی بگذارد. همچنین سن تزریق و سطح MDA در زمان تزریق باید بررسی شود.'})
   }else if(!vaccineKilled&&!vaccineLive){
    nextData.push('نوع واکسن آنفلوانزا (کشته/غیرفعال، وکتور یا سایر) و مسیر/سن تزریق')
   }
  }
 }
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
 else if(assay.status==='catalog-only')items.push({level:'warning',title:'کاتالوگ محصول موجود است، اما IFU اختصاصی هنوز اعتبارسنجی نشده',detail:'وجود نام محصول در کاتالوگ به معنی تأیید فرمول، cutoff یا معیار QC نیست؛ نسخه جاری IFU و matrix همان محصول باید بررسی و ثبت شود.'})
 else if(assay.status==='local-validation-required')items.push({level:'warning',title:'اعتبارسنجی محلی آزمون لازم است',detail:'محصول/روش شناسایی شده، اما برای این آزمایشگاه هنوز مقایسه‌پذیری و عملکرد محلی تأیید نشده است.'})
 if(!str(input,'antigen'))nextData.push('آنتی‌ژن دقیق کیت و در صورت وجود سویه/ژنوتیپ مرجع')
 if(!str(input,'sampleMatrix'))nextData.push('ماتریس نمونه و انطباق آن با IFU')
 const blocking=items.some(x=>x.level==='block')
 const summary=demo?'رکورد نمایشی است و فقط برای آزمودن رابط گزارش مناسب است.':blocking?'به‌علت محدودیت QC یا داده، تفسیر نهایی متوقف است.':items.some(x=>x.level==='warning')?'نتایج قابل توصیف‌اند، اما چند محدودیت مهم باید پیش از نتیجه‌گیری برطرف شوند.':'داده‌ها از نظر اطلاعات ثبت‌شده برای تفسیر توصیفی آماده‌اند؛ استنتاج حفاظت یا موفقیت واکسن همچنان مجاز نیست.'
 return {items,summary,nextData:[...new Set(nextData)]}
}
