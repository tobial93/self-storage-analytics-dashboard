import { createAuthenticatedClient } from '@/lib/supabase'

/**
 * Connect Facebook Ads using mock/demo data (no real OAuth required).
 * Seeds a demo connection and 30 days of realistic campaign metrics.
 */
export async function connectFacebookAdsMock(orgId: string, clerkToken: string): Promise<void> {
  const db = createAuthenticatedClient(clerkToken)

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

  // Upsert demo connection record
  const { error } = await db.from('ad_account_connections').upsert(
    {
      org_id: orgId,
      platform: 'facebook_ads',
      account_id: 'mock_fb_001',
      account_name: 'Facebook Ads (Demo)',
      access_token: '',
      refresh_token: '',
      token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
    },
    { onConflict: 'org_id,platform,account_id' }
  )

  if (error) throw error

  // Seed initial campaign + metrics data
  await syncFacebookAdsMock(orgId, clerkToken)
}

/**
 * Sync (seed) Facebook Ads demo data.
 * Upserts 3 mock campaigns and 30 days of daily metrics per campaign.
 * ctr, cpa, roas are DB-computed — never written here.
 */
export async function syncFacebookAdsMock(
  orgId: string,
  clerkToken: string
): Promise<{ campaigns_synced: number; metrics_synced: number }> {
  const db = createAuthenticatedClient(clerkToken)

  const mockCampaigns = [
    {
      org_id: orgId,
      platform: 'facebook_ads',
      external_id: 'fb_camp_001',
      name: 'Self Storage – Brand Awareness',
      status: 'active',
      account_id: 'mock_fb_001',
    },
    {
      org_id: orgId,
      platform: 'facebook_ads',
      external_id: 'fb_camp_002',
      name: 'Self Storage – Lead Generation',
      status: 'active',
      account_id: 'mock_fb_001',
    },
    {
      org_id: orgId,
      platform: 'facebook_ads',
      external_id: 'fb_camp_003',
      name: 'Remarketing – Website Visitors',
      status: 'active',
      account_id: 'mock_fb_001',
    },
  ]

  const { data: upsertedCampaigns, error: campError } = await db
    .from('campaigns')
    .upsert(mockCampaigns, { onConflict: 'org_id,platform,external_id' })
    .select('id, external_id')

  if (campError) throw campError

  const campaignIdMap = new Map(
    (upsertedCampaigns || []).map((c: { id: string; external_id: string }) => [c.external_id, c.id])
  )

  // Generate 30 days of daily metrics for each campaign
  const today = new Date()
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

  for (const extId of ['fb_camp_001', 'fb_camp_002', 'fb_camp_003']) {
    const campaignDbId = campaignIdMap.get(extId)
    if (!campaignDbId) continue

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const impressions = Math.floor(5000 + Math.random() * 15000) // 5k–20k
      const clicks = Math.floor(impressions * (0.015 + Math.random() * 0.01)) // 1.5–2.5% CTR
      const conversions = Math.floor(1 + Math.random() * 4) // 1–5
      const spend = Math.round((80 + Math.random() * 70) * 100) / 100 // $80–$150
      const revenue = conversions * 250 // typical storage rental value

      metricsRows.push({
        org_id: orgId,
        campaign_id: campaignDbId,
        metric_date: dateStr,
        impressions,
        clicks,
        conversions,
        spend,
        revenue,
      })
    }
  }

  const { error: metricsError } = await db
    .from('campaign_daily_metrics')
    .upsert(metricsRows, { onConflict: 'campaign_id,metric_date' })

  if (metricsError) throw metricsError

  // Update last_synced_at on the connection
  await db
    .from('ad_account_connections')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('org_id', orgId)
    .eq('platform', 'facebook_ads')

  return { campaigns_synced: 3, metrics_synced: metricsRows.length }
}
