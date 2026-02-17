import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kvaespkemcsvguchfjxt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2YWVzcGtlbWNzdmd1Y2hmanh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4NzA0MCwiZXhwIjoyMDg2NTYzMDQwfQ.h09osVtGsrmJIE0Ufbot2Ekey-7RFmf0zcIVRU0l7RM'
)

const ORG_ID = 'org_39iJocHF258OSYt3RaJWME2YImw'

async function seed() {
  console.log('Seeding database...')

  // 1. Upsert organization
  const { error: orgError } = await supabase.from('organizations').upsert({
    id: ORG_ID,
    name: 'My Storage Company',
    slug: 'my-storage-company',
    subscription_tier: 'professional',
  }, { onConflict: 'id' })
  if (orgError) { console.error('Org error:', orgError.message); process.exit(1) }
  console.log('✓ Organization created')

  // 2. Get or create an ad connection
  let connectionId
  const { data: existingConn } = await supabase
    .from('ad_account_connections')
    .select('id')
    .eq('org_id', ORG_ID)
    .eq('platform', 'google_ads')
    .single()

  if (existingConn) {
    connectionId = existingConn.id
    console.log('✓ Using existing Google Ads connection')
  } else {
    const { data: newConn, error: connError } = await supabase
      .from('ad_account_connections')
      .insert({
        org_id: ORG_ID,
        platform: 'google_ads',
        account_id: 'test_12345',
        account_name: 'Google Ads (Test Account)',
        access_token: 'test_token',
        refresh_token: 'test_refresh',
        is_active: true,
      })
      .select('id')
      .single()
    if (connError) { console.error('Connection error:', connError.message); process.exit(1) }
    connectionId = newConn.id
    console.log('✓ Test ad connection created')
  }

  // 3. Insert campaigns
  const campaignDefs = [
    { external_id: 'gads_001', name: 'Storage Units - Brand', status: 'active' },
    { external_id: 'gads_002', name: 'Storage Units - Competitor', status: 'active' },
    { external_id: 'gads_003', name: 'Storage Units - Generic', status: 'active' },
    { external_id: 'gads_004', name: 'Climate Controlled Units', status: 'active' },
    { external_id: 'gads_005', name: 'Moving & Storage Combo', status: 'paused' },
  ]

  const campaigns = campaignDefs.map(c => ({
    org_id: ORG_ID,
    connection_id: connectionId,
    platform: 'google_ads',
    ...c,
  }))

  const { data: insertedCampaigns, error: campError } = await supabase
    .from('campaigns')
    .upsert(campaigns, { onConflict: 'connection_id,external_id' })
    .select('id, name')
  if (campError) { console.error('Campaign error:', campError.message); process.exit(1) }
  console.log(`✓ ${insertedCampaigns.length} campaigns created`)

  // 4. Generate 30 days of metrics
  const metrics = []
  const today = new Date()

  for (const campaign of insertedCampaigns) {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const metricDate = date.toISOString().split('T')[0]

      const impressions = Math.floor(Math.random() * 3000 + 500)
      const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.02))
      const spend = Math.round(clicks * (Math.random() * 1.5 + 0.5) * 100) / 100
      const conversions = Math.floor(clicks * (Math.random() * 0.08 + 0.02))
      const revenue = Math.round(conversions * (Math.random() * 80 + 40) * 100) / 100

      metrics.push({
        org_id: ORG_ID,
        campaign_id: campaign.id,
        metric_date: metricDate,
        impressions,
        clicks,
        spend,
        conversions,
        revenue,
      })
    }
  }

  // Insert in batches of 50
  for (let i = 0; i < metrics.length; i += 50) {
    const batch = metrics.slice(i, i + 50)
    const { error: metricsError } = await supabase
      .from('campaign_daily_metrics')
      .upsert(batch, { onConflict: 'campaign_id,metric_date' })
    if (metricsError) { console.error('Metrics error:', metricsError.message); process.exit(1) }
  }

  console.log(`✓ ${metrics.length} metric rows created (${insertedCampaigns.length} campaigns × 30 days)`)
  console.log('\nDone! Database is seeded with test data.')
}

seed()
