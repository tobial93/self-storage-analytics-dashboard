import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_ADS_API_VERSION = 'v20'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Refresh the Google access token using the stored refresh token
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GOOGLE_ADS_CLIENT_ID') || '',
      client_secret: Deno.env.get('GOOGLE_ADS_CLIENT_SECRET') || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${await response.text()}`)
  }

  const data = await response.json()
  return data.access_token
}

// Get accessible Google Ads customer IDs
async function getAccessibleCustomers(accessToken: string): Promise<string[]> {
  const response = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') || '',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get customers: ${error}`)
  }

  const data = await response.json()
  // Returns list like ["customers/1234567890"]
  return (data.resourceNames || []).map((r: string) => r.replace('customers/', ''))
}

// Fetch campaigns and metrics using GAQL
async function fetchCampaignData(accessToken: string, customerId: string) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      segments.date
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY segments.date DESC
  `

  const response = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') || '',
        'Content-Type': 'application/json',
        'login-customer-id': customerId,
      },
      body: JSON.stringify({ query }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch campaigns: ${error}`)
  }

  return await response.json()
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { org_id } = await req.json()

    if (!org_id) {
      return new Response(
        JSON.stringify({ error: 'org_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get stored Google Ads connection
    const { data: connection, error: connError } = await supabase
      .from('ad_account_connections')
      .select('*')
      .eq('org_id', org_id)
      .eq('platform', 'google_ads')
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No active Google Ads connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Refresh access token
    const accessToken = await refreshAccessToken(connection.refresh_token)

    // Update stored access token
    await supabase
      .from('ad_account_connections')
      .update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      })
      .eq('id', connection.id)

    // Get accessible customer IDs
    const customerIds = await getAccessibleCustomers(accessToken)

    if (customerIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No accessible Google Ads accounts found. Make sure your Google account has an active Google Ads account.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Accessible customer IDs:', customerIds)

    // Try each customer ID until we find one that works
    let cleanCustomerId = ''
    let campaignData = null

    for (const id of customerIds) {
      const tryId = id.replace(/-/g, '')
      try {
        const data = await fetchCampaignData(accessToken, tryId)
        cleanCustomerId = tryId
        campaignData = data
        console.log('Successfully fetched data for customer:', tryId)
        break
      } catch (err) {
        console.log(`Customer ${tryId} failed:`, err.message)
        continue
      }
    }

    if (!cleanCustomerId || !campaignData) {
      return new Response(
        JSON.stringify({
          error: `Could not fetch data from any of ${customerIds.length} accounts. Accounts may not be enabled or your developer token may be in test mode (which requires a test account).`,
          customer_ids_found: customerIds,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update connection with real customer ID
    await supabase
      .from('ad_account_connections')
      .update({
        account_id: cleanCustomerId,
        account_name: `Google Ads (${cleanCustomerId})`,
      })
      .eq('id', connection.id)

    const rows = campaignData.results || []

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No campaign data found', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group by campaign to upsert campaigns table
    const campaignsMap = new Map()
    for (const row of rows) {
      const campaignId = row.campaign.id.toString()
      if (!campaignsMap.has(campaignId)) {
        campaignsMap.set(campaignId, {
          org_id,
          platform: 'google_ads',
          external_id: campaignId,
          name: row.campaign.name,
          status: row.campaign.status.toLowerCase(),
          channel_type: row.campaign.advertisingChannelType,
          account_id: cleanCustomerId,
        })
      }
    }

    // Upsert campaigns
    const campaigns = Array.from(campaignsMap.values())
    const { data: upsertedCampaigns, error: campError } = await supabase
      .from('campaigns')
      .upsert(campaigns, { onConflict: 'org_id,platform,external_id' })
      .select('id, external_id')

    if (campError) {
      console.error('Campaign upsert error:', campError)
      throw campError
    }

    // Build external_id -> db id map
    const campaignIdMap = new Map(
      (upsertedCampaigns || []).map((c: { id: string; external_id: string }) => [c.external_id, c.id])
    )

    // Build daily metrics rows
    const metricsRows = rows.map((row: {
      campaign: { id: string | number };
      segments: { date: string };
      metrics: {
        impressions?: string | number;
        clicks?: string | number;
        costMicros?: string | number;
        conversions?: string | number;
      };
    }) => {
      const campaignDbId = campaignIdMap.get(row.campaign.id.toString())
      const spend = Number(row.metrics.costMicros || 0) / 1_000_000

      return {
        org_id,
        campaign_id: campaignDbId,
        metric_date: row.segments.date,
        impressions: Number(row.metrics.impressions || 0),
        clicks: Number(row.metrics.clicks || 0),
        spend,
        conversions: Number(row.metrics.conversions || 0),
        revenue: 0, // Google Ads doesn't provide revenue directly
      }
    }).filter((r: { campaign_id: string | undefined }) => r.campaign_id) // only rows with valid campaign

    // Upsert daily metrics
    const { error: metricsError } = await supabase
      .from('campaign_daily_metrics')
      .upsert(metricsRows, { onConflict: 'campaign_id,metric_date' })

    if (metricsError) {
      console.error('Metrics upsert error:', metricsError)
      throw metricsError
    }

    // Update last synced timestamp
    await supabase
      .from('ad_account_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connection.id)

    return new Response(
      JSON.stringify({
        success: true,
        customer_id: cleanCustomerId,
        campaigns_synced: campaigns.length,
        metrics_synced: metricsRows.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
