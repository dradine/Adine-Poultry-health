import { BASELINE_INTERPRETATION_RULES, REFERENCE_BASELINES, UNPARSED_REFERENCE_DOCUMENTS } from '../data/referenceBaselines'

export default function BaselineLibrary() {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div><span className="step">مرجع</span><h3>کتابخانه Baseline و محدوده‌های مرجع</h3></div>
        <span className="tag">منبع‌محور</span>
      </div>
      <p className="muted">اعداد مرجع فقط در جمعیت، سن، برنامه واکسیناسیون، کیت و مقیاس مشخص خودشان قابل استفاده‌اند. هیچ‌کدام به‌صورت خودکار آستانه حفاظت یا توصیه واکسن محسوب نمی‌شوند.</p>
      <h4>محدوده‌های عددی قابل ردیابی</h4>
      {REFERENCE_BASELINES.map(item => (
        <details className="custom-kit-accordion" key={item.id}>
          <summary>{item.vendor} · {item.disease} · {item.numericRange?.low.toLocaleString('en-US')}–{item.numericRange?.high.toLocaleString('en-US')}</summary>
          <div className="form-grid">
            <p><b>جمعیت:</b> {item.population}</p>
            <p><b>سن نمونه‌گیری:</b> {item.ageWindow}</p>
            <p><b>برنامه واکسن:</b> {item.vaccineProgram}</p>
            <p><b>روش تعیین محدوده:</b> {item.numericRange?.method}</p>
            <p><b>واحد:</b> {item.numericRange?.unit}</p>
            <div><b>راهنمای نمونه‌گیری و ساخت baseline</b><ul>{item.sampleGuidance.map(x=><li key={x}>{x}</li>)}</ul></div>
            <div><b>محدودیت‌ها</b><ul>{item.limitations.map(x=><li key={x}>{x}</li>)}</ul></div>
            <p><b>سند:</b> {item.sourceTitle} · {item.sourceVersion} · {item.sourcePage}</p>
            <a href={item.sourceUrl} target="_blank" rel="noreferrer">مشاهده سند اصلی سازنده ↗</a>
          </div>
        </details>
      ))}
      <h4>اسناد رسمی موجود، در انتظار استخراج عددی</h4>
      {UNPARSED_REFERENCE_DOCUMENTS.map(doc => (
        <details className="custom-kit-accordion" key={doc.id}>
          <summary>{doc.vendor} · {doc.title} · {doc.version}</summary>
          <p>{doc.status}</p>
          <p><b>اقدام لازم:</b> {doc.requiredNextStep}</p>
          <a href={doc.sourceUrl} target="_blank" rel="noreferrer">بازکردن پرتال رسمی اسناد ↗</a>
        </details>
      ))}
      <h4>قواعد تطبیق baseline</h4>
      <ul>{BASELINE_INTERPRETATION_RULES.map(rule=><li key={rule}>{rule}</li>)}</ul>
    </section>
  )
}
