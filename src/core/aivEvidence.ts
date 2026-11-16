/** AIV surveillance evidence gate; intentionally no diagnosis/protection score. */
export type AivEvidenceInput={vaccinationStatus:'vaccinated'|'unvaccinated'|'unknown';vaccinePlatform:'inactivated'|'vector'|'other'|'unknown';subtype:string;antigenMatch:'documented'|'uncertain'|'not-assessed';serologyResult:'positive'|'negative'|'inconclusive'|'not-tested';divaValidated:boolean;rtPcrResult:'positive'|'negative'|'not-tested';clinicalSigns:boolean;mortalityIncrease:boolean;officialProgramConfirmed:boolean}
export type AivEvidenceOutput={status:'urgent-veterinary-review'|'surveillance-follow-up'|'insufficient-evidence';signals:string[];limitations:string[]}
export function assessAivEvidence(i:AivEvidenceInput):AivEvidenceOutput{
 const signals:string[]=[]
 if(i.rtPcrResult==='positive')signals.push('RT-PCR مثبت: ارجاع فوری به دامپزشک مسئول و مرجع رسمی؛ تأیید/تایپ طبق پروتکل.')
 if(i.clinicalSigns||i.mortalityIncrease)signals.push('علائم یا افزایش تلفات: بررسی فوری و نمونه‌گیری ویروس‌شناختی طبق پروتکل.')
 if(i.serologyResult==='positive')signals.push('سرولوژی مثبت: تفسیر وابسته به واکسیناسیون، DIVA و برنامه پایش؛ به‌تنهایی تشخیص گردش ویروس نیست.')
 if(i.vaccinationStatus==='vaccinated'&&i.divaValidated)signals.push('DIVA فقط در صورت اعتبارسنجی روش و اجرای پروتکل اختصاصی قابل تفسیر است.')
 const urgent=i.rtPcrResult==='positive'||i.clinicalSigns||i.mortalityIncrease
 return {status:urgent?'urgent-veterinary-review':i.serologyResult==='positive'?'surveillance-follow-up':'insufficient-evidence',signals,
 limitations:['این ابزار تشخیص آنفلوانزا، تعیین سویه/زیرتیپ یا اثبات حفاظت نیست.','نتیجه باید توسط دامپزشک و آزمایشگاه مرجع و طبق مقررات رسمی تفسیر شود.','HI/ELISA به‌تنهایی عفونت فعال، دفع یا انتقال را ثابت/رد نمی‌کند.',...(i.vaccinationStatus==='unknown'?['وضعیت واکسیناسیون نامعلوم است؛ تفسیر DIVA/سرولوژی محدود می‌شود.']:[]),...(i.antigenMatch!=='documented'?['تطابق آنتی‌ژنی مستند نیست؛ ادعای اثربخشی واکسن مجاز نیست.']:[]),...(i.officialProgramConfirmed?[]:['برنامه رسمی منطقه/کشور در ورودی تأیید نشده است.'])]}
}
