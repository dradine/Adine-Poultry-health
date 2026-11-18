import type {LocalFlock,LocalModelRun} from '../core/localFirstDb'
import {buildClinicalInterpretation} from '../core/serologyClinicalInterpretation'
export default function SerologyClinicalInterpretation({run,flock}:{run:LocalModelRun;flock?:LocalFlock}){
 const r=buildClinicalInterpretation(run,flock)
 const label={good:'نکته مساعد',caution:'نیازمند توجه',risk:'ریسک/محدودیت',neutral:'مشاهده'} as const
 return <section className="clinical-report">
  <header className="clinical-report-head"><div><span>تفسیر تخصصی بیماری‌محور</span><h3>{r.headline}</h3><p>تفسیر مبتنی بر داده‌های همین نوبت و زمینه ثبت‌شده گله</p></div><div className="clinical-confidence"><small>سطح اتکاپذیری</small><b>{r.confidence}</b></div></header>
  <div className="clinical-section"><h4>۱. چه چیزی واقعاً در داده‌ها دیده می‌شود؟</h4><div className="clinical-cards">{r.observations.map((x,k)=><article className={'clinical-card '+x.level} key={k}><div><b>{x.title}</b><span>{label[x.level]}</span></div><p>{x.body}</p></article>)}</div></div>
  <div className="clinical-section"><h4>۲. سناریوهای زیستی و تشخیصی</h4><p className="clinical-intro">سناریوها فرضیه‌های قابل بررسی‌اند، نه تشخیص قطعی. هر سناریو با شواهد موافق و مخالف خودش نمایش داده شده است.</p>
   <div className="clinical-scenarios">{r.scenarios.map((x,k)=><details className="clinical-scenario" key={k} open={k===0}><summary><b>{x.name}</b><span>{x.likelihood}</span></summary><div className="clinical-scenario-body"><div className="clinical-evidence"><div><b>شواهد موافق</b>{x.for.length?<ul>{x.for.map((v,j)=><li key={j}>{v}</li>)}</ul>:<p>ثبت نشده</p>}</div><div><b>شواهد محدودکننده/مخالف</b>{x.against.length?<ul>{x.against.map((v,j)=><li key={j}>{v}</li>)}</ul>:<p>ثبت نشده</p>}</div></div><p className="clinical-meaning">{x.meaning}</p></div></details>)}</div>
  </div>
  <div className="clinical-section"><h4>۳. چشم‌انداز و پیش‌بینی مشروط</h4><div className="clinical-cards">{r.outlook.map((x,k)=><article className={'clinical-card '+x.level} key={k}><b>{x.title}</b><p>{x.body}</p></article>)}</div><p className="clinical-disclaimer">پیش‌بینی عددی احتمال بیماری، زمان وقوع یا شدت آن از یک نوبت تیتر ممکن نیست. پیش‌بینی معتبر به روند زمانی، علائم، تلفات، عملکرد، واکسیناسیون و شواهد مستقیم عامل بیماری نیاز دارد.</p></div>
  <div className="clinical-section"><h4>۴. اقدام‌های پیشنهادی به ترتیب اولویت</h4><div className="clinical-actions">{r.actions.map((x,k)=><article key={k}><span>{x.priority}</span><div><b>{x.task}</b><p>{x.reason}</p></div></article>)}</div></div>
  {r.limitations.length>0&&<div className="clinical-section clinical-missing"><h4>۵. اطلاعاتی که برای دقیق‌تر شدن تفسیر کم داریم</h4><ul>{r.limitations.map((x,k)=><li key={k}>{x}</li>)}</ul></div>}
  <div className="clinical-section clinical-sources"><h4>۶. منابع علمی مبنای قواعد تفسیری</h4><ul>{r.sources.map(x=><li key={x.url}><a href={x.url} target="_blank" rel="noreferrer">{x.label}</a></li>)}</ul></div>
  <footer className="clinical-report-foot">این موتور ابزار پشتیبان تصمیم دامپزشکی است. سناریوها بر اساس داده‌های واردشده و منابع مرجع ساخته می‌شوند؛ جایگزین معاینه، کالبدگشایی، آزمون مولکولی، IFU معتبر یا قضاوت متخصص نیستند. هیچ حد حفاظت عمومی و هیچ برنامه واکسیناسیون خودکار از تیتر منفرد استنتاج نمی‌شود.</footer>
 </section>
}
