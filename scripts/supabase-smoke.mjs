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

const anonymousRead = await fetch(url + '/rest/v1/diseases?select=code&limit=1', { headers })
if (![401, 403].includes(anonymousRead.status)) {
  throw new Error('RLS smoke test expected anonymous catalogue access to be denied; received HTTP ' + anonymousRead.status)
}
console.log('Supabase smoke passed: Auth reachable; signup setting readable; anonymous database access denied.')
console.log('Auth site URL:', authSettings.site_url || '(not exposed by Auth settings)')
console.log('Auth redirect allowlist:', authSettings.uri_allow_list || '(not exposed by Auth settings)')
console.log('Email confirmation required:', authSettings.mailer_autoconfirm === true ? 'no' : 'yes')
