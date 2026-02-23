import { createAuthenticatedClient } from '@/lib/supabase'

const GA4_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly'

const getConfig = () => ({
  clientId: import.meta.env.VITE_GA4_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_GA4_CLIENT_SECRET || '',
  redirectUri: import.meta.env.VITE_GA4_REDIRECT_URI || '',
})

/**
 * Initiate Google Analytics 4 OAuth flow.
 * Opens a popup for the user to authorize analytics.readonly access.
 * State is "${orgId}:ga4" so OAuthCallback can route to this exchange function.
 */
export function initiateGA4OAuth(orgId: string): void {
  const config = getConfig()

  if (!config.clientId) {
    throw new Error('GA4 Client ID not configured. Set VITE_GA4_CLIENT_ID in .env.local')
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GA4_SCOPE,
    access_type: 'offline',
    prompt: 'consent', // Force consent to always receive a refresh token
    state: `${orgId}:ga4`,
  })

  const authUrl = `${GA4_AUTH_URL}?${params.toString()}`

  const width = 500
  const height = 600
  const left = window.screen.width / 2 - width / 2
  const top = window.screen.height / 2 - height / 2

  window.open(authUrl, 'Google Analytics 4 OAuth', `width=${width},height=${height},left=${left},top=${top}`)
}

/**
 * Exchange authorization code for GA4 access/refresh tokens.
 * Stores the connection in ad_account_connections with platform = 'ga4'.
 * The real GA4 property ID is resolved during sync (sync-ga4 edge function).
 */
export async function exchangeGA4Tokens(
  code: string,
  orgId: string,
  clerkToken: string
): Promise<void> {
  const config = getConfig()
  const db = createAuthenticatedClient(clerkToken)

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for GA4 tokens')
  }

  const tokens = await tokenResponse.json()

  // Ensure organization exists
  const { data: existing } = await db
    .from('organizations')
    .select('id')
    .eq('id', orgId)
    .single()

  if (!existing) {
    const { error: orgError } = await db.from('organizations').insert({
      id: orgId,
      name: 'My Organization',
      slug: orgId,
      subscription_tier: 'free',
    })
    if (orgError && orgError.code !== '23505') {
      throw orgError
    }
  }

  // Store connection — account_id updated to real property ID on first sync
  const { error } = await db.from('ad_account_connections').upsert(
    {
      org_id: orgId,
      platform: 'ga4',
      account_id: 'GA4_PROPERTY',
      account_name: 'Google Analytics 4',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
      is_active: true,
    },
    { onConflict: 'org_id,platform,account_id' }
  )

  if (error) throw error
}
