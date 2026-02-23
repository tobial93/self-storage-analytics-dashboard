import { createAuthenticatedClient } from '@/lib/supabase'

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
// r_ads: read ad account data; r_ads_reporting: read analytics
const LINKEDIN_SCOPE = 'r_ads r_ads_reporting'

const getConfig = () => ({
  clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
  clientSecret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET || '',
  redirectUri: import.meta.env.VITE_LINKEDIN_REDIRECT_URI || '',
})

/**
 * Initiate LinkedIn Ads OAuth flow.
 * Requires LinkedIn Marketing Developer Platform access for the app.
 * State is "${orgId}:linkedin_ads" so OAuthCallback can route correctly.
 */
export function initiateLinkedInOAuth(orgId: string): void {
  const config = getConfig()

  if (!config.clientId) {
    throw new Error('LinkedIn Client ID not configured. Set VITE_LINKEDIN_CLIENT_ID in .env.local')
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: LINKEDIN_SCOPE,
    state: `${orgId}:linkedin_ads`,
  })

  const authUrl = `${LINKEDIN_AUTH_URL}?${params.toString()}`

  const width = 500
  const height = 600
  const left = window.screen.width / 2 - width / 2
  const top = window.screen.height / 2 - height / 2

  window.open(authUrl, 'LinkedIn OAuth', `width=${width},height=${height},left=${left},top=${top}`)
}

/**
 * Exchange LinkedIn authorization code for an access token.
 * LinkedIn access tokens last 60 days; refresh tokens are not issued by default
 * for Marketing API. Stores connection in ad_account_connections.
 */
export async function exchangeLinkedInTokens(
  code: string,
  orgId: string,
  clerkToken: string
): Promise<void> {
  const config = getConfig()
  const db = createAuthenticatedClient(clerkToken)

  const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for LinkedIn tokens')
  }

  const tokens = await tokenResponse.json()

  // LinkedIn access tokens last ~60 days; no refresh token for Marketing API
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

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

  // Store connection — account_id updated to real ad account ID on first sync
  const { error } = await db.from('ad_account_connections').upsert(
    {
      org_id: orgId,
      platform: 'linkedin_ads',
      account_id: 'LINKEDIN_ACCOUNT',
      account_name: 'LinkedIn Ads',
      access_token: tokens.access_token,
      refresh_token: '',
      token_expires_at: expiresAt,
      is_active: true,
    },
    { onConflict: 'org_id,platform,account_id' }
  )

  if (error) throw error
}
