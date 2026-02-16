import { supabase } from '@/lib/supabase';

// Google Ads OAuth configuration
const GOOGLE_ADS_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';

interface GoogleAdsConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  redirectUri: string;
}

// Get config from environment variables
const getConfig = (): GoogleAdsConfig => {
  return {
    clientId: import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_GOOGLE_ADS_CLIENT_SECRET || '',
    developerToken: import.meta.env.VITE_GOOGLE_ADS_DEVELOPER_TOKEN || '',
    redirectUri: import.meta.env.VITE_GOOGLE_ADS_REDIRECT_URI || '',
  };
};

/**
 * Initiate Google Ads OAuth flow
 * Opens popup window for user to authorize
 */
export function initiateGoogleAdsOAuth(orgId: string): void {
  const config = getConfig();

  if (!config.clientId) {
    throw new Error('Google Ads Client ID not configured');
  }

  // Build OAuth URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_ADS_SCOPE,
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent screen to get refresh token
    state: orgId, // Pass org ID through OAuth flow
  });

  const authUrl = `${GOOGLE_ADS_AUTH_URL}?${params.toString()}`;

  // Open OAuth popup
  const width = 500;
  const height = 600;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;

  window.open(
    authUrl,
    'Google Ads OAuth',
    `width=${width},height=${height},left=${left},top=${top}`
  );
}

/**
 * Exchange authorization code for access/refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  orgId: string
): Promise<void> {
  const config = getConfig();

  // Exchange code for tokens
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
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange code for tokens');
  }

  const tokens = await tokenResponse.json();

  // Get user's Google Ads customer ID
  // For now, we'll store a placeholder - this needs to be fetched from Google Ads API
  const customerId = 'PLACEHOLDER'; // TODO: Fetch from Google Ads API

  // Store connection in database
  const { error } = await supabase.from('ad_account_connections').insert({
    org_id: orgId,
    platform: 'google_ads',
    account_id: customerId,
    account_name: 'Google Ads Account', // TODO: Fetch actual name
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    is_active: true,
  });

  if (error) {
    console.error('Error storing Google Ads connection:', error);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: string }> {
  const config = getConfig();

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh access token');
  }

  const tokens = await tokenResponse.json();

  return {
    accessToken: tokens.access_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  };
}

/**
 * Sync campaigns from Google Ads
 * This is a placeholder - full implementation needs Google Ads API client
 */
export async function syncGoogleAdsCampaigns(
  connectionId: string,
  accessToken: string
): Promise<void> {
  // TODO: Implement using google-ads-api library
  // This will:
  // 1. Initialize Google Ads client with access token
  // 2. Fetch campaigns
  // 3. Fetch campaign metrics
  // 4. Store in database

  console.log('Syncing campaigns for connection:', connectionId);
  console.log('This feature will be implemented next!');
}
