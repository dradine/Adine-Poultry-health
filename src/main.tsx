import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import SerologyReportStudio from './components/SerologyReportStudio'
import './styles.css'
import './serology-report-studio.css'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = import.meta.env.BASE_URL
    void navigator.serviceWorker.register(base + 'sw.js', { scope: base }).catch(() => undefined)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <App />
      <main className="container" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 16px 24px' }}>
        <SerologyReportStudio />
      </main>
    </>
  </React.StrictMode>,
)
