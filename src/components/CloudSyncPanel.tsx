import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../core/supabase'
import { countPendingChanges, listLocalFlocks, listLocalModelRuns, notifyLocalDataChanged } from '../core/localFirstDb'
import { getLastSync, migrateLegacyLocalData, syncLocalData } from '../core/syncService'

function faDate(value: string | null): string {
  if (!value) return 'هنوز همگام‌سازی نشده'
  return new Date(value).toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })
}

export default function CloudSyncPanel() {
  const [user, setUser] = useState<User | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(0)
  const [flockCount, setFlockCount] = useState(0)
  const [runCount, setRunCount] = useState(0)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const syncing = useRef(false)
  const userRef = useRef<User | null>(null)
  userRef.current = user

  async function refreshStatus(userId?: string) {
    try {
      const [queue, flocks, runs, last] = await Promise.all([
        countPendingChanges(), listLocalFlocks(), listLocalModelRuns(),
        userId ? getLastSync(userId) : Promise.resolve(null),
      ])
      setPending(queue)
      setFlockCount(flocks.length)
      setRunCount(runs.length)
      setLastSync(last)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'خواندن وضعیت ذخیره‌سازی محلی ناموفق بود.')
    }
  }

  async function syncNow(currentUser = user) {
    if (!currentUser || syncing.current) return
    if (!navigator.onLine) {
      setMessage('این دستگاه آفلاین است؛ اطلاعات محلی امن می‌مانند و پس از اتصال دوباره همگام می‌شوند.')
      await refreshStatus(currentUser.id)
      return
    }
    syncing.current = true
    setBusy(true)
    setMessage('در حال همگام‌سازی امن اطلاعات گله و تحلیل‌ها…')
    try {
      await migrateLegacyLocalData()
      const result = await syncLocalData(currentUser.id)
      setMessage('همگام‌سازی انجام شد: ' + result.pushed + ' تغییر ارسال، ' +
        result.pulledFlocks + ' گله و ' + result.pulledRuns + ' تحلیل دریافت شد.')
      setLastSync(result.lastSyncAt)
      window.dispatchEvent(new CustomEvent('adine-cloud-data-updated'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'همگام‌سازی کامل نشد؛ تغییرات در صف محلی باقی ماندند.')
    } finally {
      syncing.current = false
      setBusy(false)
      await refreshStatus(currentUser.id)
    }
  }

  useEffect(() => {
    let active = true
    void migrateLegacyLocalData()
      .then(() => refreshStatus())
      .catch(error => { if (active) setMessage(error instanceof Error ? error.message : 'انتقال سوابق قدیمی به ذخیره‌سازی محلی انجام نشد.') })
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setMessage(error.message)
      setUser(data.session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null)
    })
    const onOnline = () => { setOnline(true); const current = userRef.current; if (active && current) void syncNow(current) }
    const onOffline = () => { setOnline(false); void refreshStatus(userRef.current?.id) }
    const onLocalChange = () => {
      if (!active) return
      const current = userRef.current
      void refreshStatus(current?.id)
      if (current && navigator.onLine) void syncNow(current)
    }
    const onCloudUpdate = () => {
      if (active) void refreshStatus(userRef.current?.id)
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('adine-local-data-changed', onLocalChange)
    window.addEventListener('adine-cloud-data-updated', onCloudUpdate)
    return () => {
      active = false
      subscription.unsubscribe()
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('adine-local-data-changed', onLocalChange)
      window.removeEventListener('adine-cloud-data-updated', onCloudUpdate)
    }
  }, [])

  useEffect(() => {
    if (user) void syncNow(user)
    else void refreshStatus()
  }, [user?.id])

  async function signIn(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      setUser(data.user)
      setPassword('')
      setMessage('ورود موفق بود؛ اطلاعات این دستگاه با حساب شما همگام می‌شود.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ورود انجام نشد.')
    } finally { setBusy(false) }
  }
  async function signUp() {
    if (!email.trim() || password.length < 8) {
      setMessage('ایمیل معتبر و گذرواژه حداقل ۸ نویسه‌ای وارد کنید.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
      if (error) throw error
      if (data.session) {
        setUser(data.user)
        setMessage('حساب ساخته شد و وارد شدید؛ همگام‌سازی آغاز می‌شود.')
      } else {
        setMessage('درخواست ساخت حساب ثبت شد. اگر تأیید ایمیل فعال باشد، لینک تأیید را از ایمیل خود باز کنید و سپس وارد شوید.')
      }
      setPassword('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ساخت حساب انجام نشد.')
    } finally { setBusy(false) }
  }
  async function resetPassword() {
    if (!email.trim()) { setMessage('ابتدا ایمیل حساب را وارد کنید.'); return }
    setBusy(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
      if (error) throw error
      setMessage('اگر حسابی با این ایمیل وجود داشته باشد، دستور بازیابی گذرواژه ارسال می‌شود.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'درخواست بازیابی ناموفق بود.') }
    finally { setBusy(false) }
  }
  async function signOut() {
    setBusy(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setMessage('از حساب خارج شدید؛ داده‌های محلی این دستگاه حذف نشده‌اند.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'خروج انجام نشد.') }
    finally { setBusy(false) }
  }

  return (
    <section className="cloud-panel" aria-label="حساب کاربری و همگام‌سازی">
      <div className="cloud-heading">
        <div>
          <strong>ذخیره‌سازی محلی و همگام‌سازی ابری</strong>
          <small>ثبت اطلاعات بدون اینترنت؛ ارسال امن پس از اتصال و ورود</small>
        </div>
        <span className={online ? 'connection-state online' : 'connection-state offline'}>
          {online ? 'اینترنت متصل' : 'بدون اینترنت'}
        </span>
      </div>
      <div className="cloud-stats">
        <span>گله‌های این دستگاه: <b>{flockCount.toLocaleString('fa-IR')}</b></span>
        <span>تحلیل‌ها: <b>{runCount.toLocaleString('fa-IR')}</b></span>
        <span>در صف ارسال: <b>{pending.toLocaleString('fa-IR')}</b></span>
        <span>آخرین همگام‌سازی: <b>{faDate(lastSync)}</b></span>
      </div>
      {user ? (
        <div className="cloud-account">
          <div className="cloud-user">
            <span>واردشده با</span>
            <b dir="ltr">{user.email || user.phone || user.id}</b>
          </div>
          <div className="cloud-buttons">
            <button className="button primary" disabled={busy || !online} onClick={() => void syncNow(user)}>
              {busy ? 'در حال انجام…' : 'همگام‌سازی اکنون'}
            </button>
            <button className="button secondary" disabled={busy} onClick={() => void signOut()}>خروج از حساب</button>
          </div>
        </div>
      ) : (
        <details className="cloud-auth">
          <summary>ورود یا ساخت حساب برای همگام‌سازی بین دستگاه‌ها</summary>
          <form onSubmit={signIn}>
            <label>ایمیل حساب
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" required placeholder="name@example.com" dir="ltr" />
            </label>
            <label>گذرواژه
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required dir="ltr" />
            </label>
            <div className="cloud-buttons">
              <button className="button primary" type="submit" disabled={busy || mode !== 'signin'}>ورود</button>
              <button className="button secondary" type="button" disabled={busy} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>
                {mode === 'signin' ? 'ساخت حساب جدید' : 'بازگشت به ورود'}
              </button>
              {mode === 'signup' && <button className="button primary" type="button" disabled={busy} onClick={() => void signUp()}>ثبت‌نام</button>}
            </div>
            {mode === 'signin' && <button className="cloud-link" type="button" disabled={busy} onClick={() => void resetPassword()}>بازیابی گذرواژه</button>}
          </form>
        </details>
      )}
      {message && <p className="cloud-message" role="status">{message}</p>}
      <p className="cloud-footnote">تا وقتی وارد حساب نشده‌اید، اطلاعات فقط روی همین دستگاه می‌ماند. کلید عمومی Supabase در برنامه استفاده می‌شود و مجوز دسترسی هر حساب را سیاست‌های RLS دیتابیس کنترل می‌کنند.</p>
    </section>
  )
}
