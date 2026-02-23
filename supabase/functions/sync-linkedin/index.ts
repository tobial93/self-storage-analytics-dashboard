import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// LinkedIn API requires this version header
const LINKEDIN_VERSION = '202401'

// Fetch all ad accounts accessible with the given token
async function getAdAccounts(accessToken: string): Promise<{ id: string; name: string }[]> {
  const response = await fetch(
    'https://api.linkedin.com/rest/adAccounts?q=search&search.status.values[0]=ACTIVE',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': LINKEDIN_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch LinkedIn ad accounts: ${await response.text()}`)
  }

  const data = await response.json()
  return (data.elements || []).map((el: { id: number; name: string }) => ({
    id: String(el.id),
    name: el.name || `Account ${el.id}`,
  }))
}

// Fetch campaigns for a given ad account
async function getCampaigns(accessToken: string, accountId: string) {
  const accountUrn = encodeURIComponent(`urn:li:sponsoredAccount:${accountId}`)
  const response = await fetch(
    `https://api.linkedin.com/rest/adCampaigns?q=search&search.account.values[0]=${accountUrn}&search.status.values[0]=ACTIVE`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': LINKEDIN_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  )

  if (!response.ok) {
    const text = await response.text()
    console.warn(`Failed to fetch campaigns for account ${accountId}:`, text)
    return []
  }

  const data = await response.json()
  return data.elements || []
}

// Fetch daily analytics for a campaign (last 30 days)
async function getCampaignAnalytics(accessToken: string, campaignUrn: string) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const params = new URLSearchParams({
    q: 'analytics',
    pivot: 'CAMPAIGN',
    'dateRange.start.day': String(startDate.getDate()),
    'dateRange.start.month': String(startDate.getMonth() + 1),
    'dateRange.start.year': String(startDate.getFullYear()),
    'dateRange.end.day': String(endDate.getDate()),
    'dateRange.end.month': String(endDate.getMonth() + 1),
    'dateRange.end.year': String(endDate.getFullYear()),
    'campaigns[0]': campaignUrn,
    timeGranularity: 'DAILY',
    fields: 'costInLocalCurrency,impressions,clicks,externalWebsiteConversions,dateRange',
  })

  const response = await fetch(
    `https://api.linkedin.com/rest/adAnalytics?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': LINKEDIN_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  )

  if (!response.ok) {
    console.warn(`Failed to fetch analytics for campaign ${campaignUrn}:`, await response.text())
    return []
  }

  const data = await response.json()
  return data.elements || []
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

    // Get stored LinkedIn connection
    const { data: connection, error: connError } = await supabase
      .from('ad_account_connections')
      .select('*')
      .eq('org_id', org_id)
      .eq('platform', 'linkedin_ads')
      .eq('is_active', true)
      .single()

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'No active LinkedIn Ads connection found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check token expiry (LinkedIn tokens last 60 days, no refresh available)
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'LinkedIn access token has expired. Please reconnect your LinkedIn account.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = connection.access_token

    // Fetch ad accounts
    const adAccounts = await getAdAccounts(accessToken)

    if (adAccounts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active LinkedIn ad accounts found. Make sure you have an active LinkedIn Campaign Manager account.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use first account; update connection record with real account ID
    const firstAccount = adAccounts[0]
    await supabase
      .from('ad_account_connections')
      .update({
        account_id: firstAccount.id,
        account_name: firstAccount.name,
      })
      .eq('id', connection.id)

    let totalCampaignsSynced = 0
    let totalMetricsSynced = 0

    for (const account of adAccounts) {
      const campaigns = await getCampaigns(accessToken, account.id)

      if (campaigns.length === 0) continue

      // Upsert campaign records
      const campaignUpserts = campaigns.map((c: { id: number; name: string; status: string }) => ({
        org_id,
        platform: 'linkedin_ads',
        external_id: String(c.id),
        name: c.name || `Campaign ${c.id}`,
        status: (c.status || 'active').toLowerCase(),
        account_id: account.id,
      }))

      const { data: upsertedCampaigns, error: campError } = await supabase
        .from('campaigns')
        .upsert(campaignUpserts, { onConflict: 'org_id,platform,external_id' })
        .select('id, external_id')

      if (campError) {
        console.error('Campaign upsert error:', campError)
        continue
      }

      const campaignIdMap = new Map(
        (upsertedCampaigns || []).map((c: { id: string; external_id: string }) => [c.external_id, c.id])
      )

      totalCampaignsSynced += campaignUpserts.length

      // Fetch analytics for each campaign
      const metricsRows: {
        org_id: string
        campaign_id: string
        metric_date: string
        impressions: number
        clicks: number
        conversions: number
        spend: number
        revenue: number
      }[] = []

      for (const campaign of campaigns) {
        const campaignId = String(campaign.id)
        const campaignUrn = encodeURIComponent(`urn:li:sponsoredCampaign:${campaignId}`)
        const campaignDbId = campaignIdMap.get(campaignId)

        if (!campaignDbId) continue

        const analytics = await getCampaignAnalytics(accessToken, campaignUrn)

        for (const row of analytics) {
          const dr = row.dateRange?.start
          if (!dr) continue

          const metricDate = `${dr.year}-${String(dr.month).padStart(2, '0')}-${String(dr.day).padStart(2, '0')}`

          metricsRows.push({
            org_id,
            campaign_id: campaignDbId,
            metric_date: metricDate,
            impressions: Number(row.impressions || 0),
            clicks: Number(row.clicks || 0),
            conversions: Number(row.externalWebsiteConversions || 0),
            spend: Number(row.costInLocalCurrency || 0),
            revenue: 0,
          })
        }
      }

      if (metricsRows.length > 0) {
        const { error: metricsError } = await supabase
          .from('campaign_daily_metrics')
          .upsert(metricsRows, { onConflict: 'campaign_id,metric_date' })

        if (metricsError) {
          console.error('Metrics upsert error:', metricsError)
        } else {
          totalMetricsSynced += metricsRows.length
        }
      }
    }

    await supabase
      .from('ad_account_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connection.id)

    return new Response(
      JSON.stringify({
        success: true,
        campaigns_synced: totalCampaignsSynced,
        metrics_synced: totalMetricsSynced,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('LinkedIn sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
