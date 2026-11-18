import type {LocalModelRun} from '../core/localFirstDb'
import {interpretSerologyRound} from '../core/serologyInterpretation'

export default function SerologyInterpretationPanel({run}:{run:LocalModelRun}){
 const result=interpretSerologyRound(run.disease_code,run.input_snapshot as Record<string,unknown>)
 const label={block:'مانع تفسیر',warning:'نیازمند توجه',info:'نکته تفسیری'} as const
 return <section className="srs-chart-card srs-interpretation" aria-label="تفسیر دامپزشکی و محدودیت‌ها">
  <h4>تفسیر دامپزشکیِ مبتنی بر شواهد ثبت‌شده</h4>
  <p className="srs-note"><strong>{result.summary}</strong></p>
  <div className="srs-interpretation-list">{result.items.map((item,index)=><article className={'srs-interpretation-item '+item.level} key={index}>
   <div><b>{item.title}</b><span>{label[item.level]}</span></div><p>{item.detail}</p>
  </article>)}</div>
  {result.nextData.length>0&&<div className="srs-next-data"><b>برای دقیق‌تر شدن تفسیر، این اطلاعات را تکمیل کنید:</b><ul>{result.nextData.map(x=><li key={x}>{x}</li>)}</ul></div>}
  <p className="srs-footnote">این بخش یک تفسیر محدود و قابل ردیابی از کیفیت داده و سازگاری روش است؛ تشخیص بیماری، حفاظت بالینی، اثربخشی واکسن یا توصیه قطعی واکسیناسیون از تیتر به‌تنهایی استنتاج نمی‌شود.</p>
 </section>
}
