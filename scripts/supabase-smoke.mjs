import { createClient } from '@supabase/supabase-js'
const url = process.env.VITE_SUPABASE_URL || 'https://aekuuqvgsqnjxkobxbur.supabase.co'
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_o-1YD1r_i3Me-EN1OaHiHw_IjKUxtIf'
const headers = { apikey: key }

const health = await fetch(url + '/auth/v1/health', { headers })
if (!health.ok) throw new Error('Supabase Auth health check failed: HTTP ' + health.status)

const settings = await fetch(url + '/auth/v1/settings', { headers })
if (!settings.ok) throw new Error('Supabase Auth settings endpoint failed: HTTP ' + settings.status)
const authSettings = await settings.json()
if (authSettings.disable_signup === true) {
  throw new Error('Supabase Auth sign-up is disabled; users cannot create their own test account.')
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
const { error: catalogError } = await client.from('assay_kits').select('id').limit(1)
if (catalogError) {
  throw new Error('Supabase SDK should read public assay catalog without login: ' + catalogError.message)
}
const { error: vaccineCatalogError } = await client.from('vaccine_products').select('id').limit(1)
if (vaccineCatalogError) {
  throw new Error('Supabase SDK should read public vaccine catalog without login: ' + vaccineCatalogError.message)
}
const { data: privateRows, error: flockError } = await client.from('flocks').select('id').limit(1)
if (flockError && ![401, 403].includes(flockError.status) && flockError.code !== '42501') {
  throw new Error('Unexpected anonymous SDK flock query error: ' + flockError.message)
}
if (Array.isArray(privateRows) && privateRows.length > 0) {
  throw new Error('Anonymous SDK query exposed private flock rows.')
}
const privateRead = await fetch(url + '/rest/v1/flocks?select=id&limit=1', { headers })
if (![200, 401, 403].includes(privateRead.status)) {
  throw new Error('Unexpected anonymous REST flock status: HTTP ' + privateRead.status)
}
if (privateRead.status === 200) {
  const rows = await privateRead.json()
  if (!Array.isArray(rows) || rows.length > 0) throw new Error('Anonymous REST query exposed private flock rows.')
}
console.log('Supabase smoke passed: Auth reachable; SDK can read public catalog; no private flock rows exposed to anonymous clients.')
console.log('Auth site URL:', authSettings.site_url || '(not exposed by Auth settings)')
console.log('Auth redirect allowlist:', authSettings.uri_allow_list || '(not exposed by Auth settings)')
console.log('Email confirmation required:', authSettings.mailer_autoconfirm === true ? 'no' : 'yes')
