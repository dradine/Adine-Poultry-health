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
  throw new Error('Supabase SDK should read public reference catalog without login: ' + catalogError.message)
}
const { error: flockError } = await client.from('flocks').select('id').limit(1)
if (!flockError || ![401, 403].includes(flockError.status)) {
  throw new Error('Supabase SDK expected anonymous flock access to be denied; received ' + (flockError?.status || 'no error'))
}
console.log('Supabase smoke passed: Auth reachable; signup setting readable; SDK can read public catalog; anonymous flock access denied.')
console.log('Auth site URL:', authSettings.site_url || '(not exposed by Auth settings)')
console.log('Auth redirect allowlist:', authSettings.uri_allow_list || '(not exposed by Auth settings)')
console.log('Email confirmation required:', authSettings.mailer_autoconfirm === true ? 'no' : 'yes')
