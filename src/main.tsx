import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'\n\nif ('serviceWorker' in navigator) {\n  window.addEventListener('load', () => { void navigator.serviceWorker.register('/sw.js').catch(() => undefined) })\n}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)