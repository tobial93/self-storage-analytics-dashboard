import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Refresh a Google OAuth access token
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('GA4_CLIENT_ID') || '',
      client_secret: Deno.env.get('GA4_CLIENT_SECRET') || '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to refresh GA4 token: ${await response.text()}`)
  }

  const data = await response.json()
  return data.access_token
}

// Fetch GA4 account summaries to discover the first property ID
async function getFirstPropertyId(accessToken: string): Promise<{ propertyId: string; displayName: string }> {
  const response = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch GA4 account summaries: ${await response.text()}`)
  }

  const data = await response.json()
  const accounts = data.accountSummaries || []

  if (accounts.length === 0) {
    throw new Error('No Google Analytics accounts found for this Google account')
  }

  const properties = accounts[0].propertySummaries || []
  if (properties.length === 0) {
    throw new Error('No GA4 properties found. Make sure you have a GA4 property set up.')
  }

  // property resource name: "properties/1234567"
  const propertyResource = properties[0].property as string
  const propertyId = propertyResource.replace('properties/', '')
  const displayName = (properties[0].displayName as string) || `GA4 Property ${propertyId}`

  return { propertyId, displayName }
}

// Fetch a 30-day report from the GA4 Data API
async function fetchGA4Report(accessToken: string, propertyId: string) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
          },
        ],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'conversions' },
          { name: 'totalUsers' },
        ],
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch GA4 report: ${await response.text()}`)
  }

  return await response.json()
}

Deno.serve(async (req) => {
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // Get stored GA4 connection
    const { data: connection, error: connError } = await supabase
      .from('ad_account_connections')
      .select('*')
      .eq('org_id', org_id)
      .eq('platform', 'ga4')
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No active GA4 connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Refresh access token
    const accessToken = await refreshAccessToken(connection.refresh_token)

    await supabase
      .from('ad_account_connections')
      .update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      })
      .eq('id', connection.id)

    // Discover property ID if not yet resolved
    let propertyId: string = connection.account_id
    let propertyName: string = connection.account_name

    if (!propertyId || propertyId === 'GA4_PROPERTY') {
      const { propertyId: pid, displayName } = await getFirstPropertyId(accessToken)
      propertyId = pid
      propertyName = displayName

      // Persist the real property ID
      await supabase
        .from('ad_account_connections')
        .update({ account_id: propertyId, account_name: propertyName })
        .eq('id', connection.id)
    }

    // Fetch GA4 report
    const report = await fetchGA4Report(accessToken, propertyId)
    const rows = report.rows || []

    if (rows.length === 0) {
      await supabase
        .from('ad_account_connections')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', connection.id)

      return new Response(
        JSON.stringify({ success: true, campaigns_synced: 0, metrics_synced: 0, message: 'No data in the last 30 days' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert one campaign record for the GA4 property
    const { data: upsertedCampaigns, error: campError } = await supabase
      .from('campaigns')
      .upsert(
        [{
          org_id,
          platform: 'ga4',
          external_id: propertyId,
          name: propertyName,
          status: 'active',
          account_id: propertyId,
        }],
        { onConflict: 'org_id,platform,external_id' }
      )
      .select('id')

    if (campError) throw campError

    const campaignDbId = upsertedCampaigns?.[0]?.id
    if (!campaignDbId) {
      throw new Error('Failed to upsert GA4 campaign record')
    }

    // Map report rows to daily metrics
    // GA4 report dimensions: [date]; metrics: [sessions, screenPageViews, conversions, totalUsers]
    const metricsRows = rows.map((row: {
      dimensionValues: { value: string }[]
      metricValues: { value: string }[]
    }) => {
      const rawDate = row.dimensionValues[0].value // "20240115" format
      const metricDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`

      return {
        org_id,
        campaign_id: campaignDbId,
        metric_date: metricDate,
        impressions: Number(row.metricValues[0].value || 0), // sessions
        clicks: Number(row.metricValues[1].value || 0),      // screenPageViews
        conversions: Number(row.metricValues[2].value || 0),
        spend: 0,
        revenue: 0,
      }
    })

    const { error: metricsError } = await supabase
      .from('campaign_daily_metrics')
      .upsert(metricsRows, { onConflict: 'campaign_id,metric_date' })

    if (metricsError) throw metricsError

    await supabase
      .from('ad_account_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connection.id)

    return new Response(
      JSON.stringify({
        success: true,
        property_id: propertyId,
        campaigns_synced: 1,
        metrics_synced: metricsRows.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('GA4 sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
