import type {NdMonitorOutput} from './ndMonitor'
import type {IbvTrendOutput} from './ibvTrend'

const fa=(value:number)=>value.toLocaleString('fa-IR',{maximumFractionDigits:2})

export function interpretNdHi(result:NdMonitorOutput):string[]{
 const summary=`در ${fa(result.n)} نمونه HI پس از واکسن، میانگین endpoint برابر ${fa(result.meanHiLog2)} در مقیاس log₂ و GMT تقریبی رقت معکوس برابر ${fa(result.geometricMeanReciprocal)} است. این اعداد توصیف توزیع آنتی‌بادی در نمونه‌های بررسی‌شده‌اند.`
 const responder=result.responderPercent===null
  ? 'چون آستانه responder بر اساس پروتکل مشخص نشده، درصد پاسخ‌دهنده محاسبه نشده است.'
  : `با آستانه ورودی ${fa(result.responders||0)} از ${fa(result.n)} نمونه (${fa(result.responderPercent)}٪) در حد یا بالاتر از آستانه قرار گرفته‌اند؛ این آستانه cutoff حفاظتی عمومی نیست.`
 let paired='داده paired با شناسه پرنده وجود ندارد؛ از مقایسه گروهی مستقل نمی‌توان افزایش فردبه‌فرد یا چهاربرابرشدن را نتیجه گرفت.'
 if(result.pairedN>0) paired=`در ${fa(result.pairedN)} پرنده دارای شناسه متناظر، میانگین تغییر ${fa(result.meanLog2Rise||0)} واحد log₂ بوده و ${fa(result.fourfoldRisePercent||0)}٪ از همین پرندگان حداقل افزایش چهاربرابری endpoint داشته‌اند. این نتیجه فقط برای پرندگان paired و همان آنتی‌ژن/روش معتبر است.`
 else if(result.baselineN!==null) paired='Baseline جداگانه ثبت شده، اما شناسه‌های فردی متناظر وجود ندارد؛ بنابراین تحلیل paired انجام نشده است.'
 return [summary,responder,paired,'HI به‌تنهایی حفاظت بالینی، جلوگیری از دفع ویروس یا انتقال را اثبات نمی‌کند؛ نتیجه باید با واکسن، آنتی‌ژن، HAU، RBC، SOP، زمان نمونه‌گیری و شواهد میدانی تفسیر شود.']
}

export function interpretIbvTrend(result:IbvTrendOutput):string[]{
 const direction=result.direction==='up'?'افزایش':result.direction==='down'?'کاهش':'عدم تغییر عددی'
 const summary=`در ${fa(result.n)} زمان مشاهده از روز ${fa(result.firstDay)} تا ${fa(result.lastDay)}، مقدار ثبت‌شده از ${fa(result.firstValue)} به ${fa(result.lastValue)} رسیده است؛ جهت تغییر عددی: ${direction} و شیب خطی ${fa(result.slopePerDay)} واحد در روز.`
 const ratio=result.lastToFirstRatio===null?'نسبت آخر به اول قابل محاسبه نیست.':`نسبت عددی آخر به اول ${fa(result.lastToFirstRatio)} است؛ این نسبت، fold افزایش آنتی‌بادی یا حفاظت نیست.`
 const fit=result.n<3?'با کمتر از سه زمان، برازش خطی و R² برای نتیجه‌گیری درباره شکل روند کافی نیست.':`R² توصیفی خط برازش ${result.rSquared===null?'قابل محاسبه نیست':fa(result.rSquared)} است و به‌تنهایی اعتبار زیستی روند را ثابت نمی‌کند.`
 return [summary,ratio,fit,'مقادیر فقط در همان کیت، lot/نسخه، آنتی‌ژن، روش و مقیاس قابل مقایسه‌اند. روند سرمی IBV معادل ایمنی مخاطی، cross-protection، کاهش shedding یا تعیین ژنوتیپ نیست.']
}
