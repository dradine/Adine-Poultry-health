import { createClient } from '@supabase/supabase-js'

const projectUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aekuuqvgsqnjxkobxbur.supabase.co'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_o-1YD1r_i3Me-EN1OaHiHw_IjKUxtIf'

/** Browser client only. RLS is the authorization boundary. Never place a service_role / sb_secret key here. */
export const supabase = createClient(projectUrl, publishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
export const SUPABASE_CONFIGURED = Boolean(projectUrl && publishableKey)
