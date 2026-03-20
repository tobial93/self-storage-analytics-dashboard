import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const DEFAULTS = {
  cpa_max: 50.0,
  ctr_min: 1.0,
  spend_spike_pct: 50.0,
  roas_min: 2.0,
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { org_id } = await req.json()
    if (!org_id) {
      return new Response(JSON.stringify({ error: 'Missing org_id' }), { status: 400 })
    }

    // Fetch org thresholds (or use defaults)
    const { data: thresholdRow } = await supabase
      .from('alert_thresholds')
      .select('*')
      .eq('org_id', org_id)
      .single()

    if (thresholdRow && !thresholdRow.is_enabled) {
      return new Response(JSON.stringify({ message: 'Alerts disabled for org' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const thresholds = {
      cpa_max: thresholdRow?.cpa_max ?? DEFAULTS.cpa_max,
      ctr_min: thresholdRow?.ctr_min ?? DEFAULTS.ctr_min,
      spend_spike_pct: thresholdRow?.spend_spike_pct ?? DEFAULTS.spend_spike_pct,
      roas_min: thresholdRow?.roas_min ?? DEFAULTS.roas_min,
    }

    // Get campaigns for this org
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, platform')
      .eq('org_id', org_id)
      .eq('status', 'active')

    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ message: 'No active campaigns' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const today = new Date().toISOString().split('T')[0]
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    let alertsCreated = 0

    for (const campaign of campaigns) {
      // Get latest day's metrics
      const { data: latestMetrics } = await supabase
        .from('campaign_daily_metrics')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('metric_date', { ascending: false })
        .limit(1)

      if (!latestMetrics || latestMetrics.length === 0) continue
      const latest = latestMetrics[0]

      // Check CPA threshold
      if (latest.cpa !== null && latest.cpa > thresholds.cpa_max) {
        await createAlertIfNew(org_id, campaign, 'high_cpa',
          `CPA ($${Number(latest.cpa).toFixed(2)}) exceeds threshold ($${thresholds.cpa_max})`,
          'high', latest.cpa, thresholds.cpa_max)
        alertsCreated++
      }

      // Check CTR threshold
      if (latest.ctr !== null && latest.ctr < thresholds.ctr_min) {
        await createAlertIfNew(org_id, campaign, 'low_ctr',
          `CTR (${Number(latest.ctr).toFixed(2)}%) below threshold (${thresholds.ctr_min}%)`,
          'medium', latest.ctr, thresholds.ctr_min)
        alertsCreated++
      }

      // Check ROAS threshold
      if (latest.roas !== null && latest.roas < thresholds.roas_min) {
        await createAlertIfNew(org_id, campaign, 'low_roas',
          `ROAS (${Number(latest.roas).toFixed(2)}x) below threshold (${thresholds.roas_min}x)`,
          'high', latest.roas, thresholds.roas_min)
        alertsCreated++
      }

      // Check spend spike
      const { data: weekMetrics } = await supabase
        .from('campaign_daily_metrics')
        .select('spend')
        .eq('campaign_id', campaign.id)
        .gte('metric_date', sevenDaysAgo)
        .lte('metric_date', today)

      if (weekMetrics && weekMetrics.length >= 3) {
        const avgSpend = weekMetrics.reduce((sum: number, m: { spend: number }) => sum + Number(m.spend), 0) / weekMetrics.length
        const spikeThreshold = avgSpend * (1 + thresholds.spend_spike_pct / 100)
        if (Number(latest.spend) > spikeThreshold && avgSpend > 0) {
          const spikePct = ((Number(latest.spend) - avgSpend) / avgSpend * 100).toFixed(0)
          await createAlertIfNew(org_id, campaign, 'anomaly',
            `Spend spike: $${Number(latest.spend).toFixed(2)} is ${spikePct}% above 7-day average ($${avgSpend.toFixed(2)})`,
            'medium', Number(latest.spend), spikeThreshold)
          alertsCreated++
        }
      }
    }

    return new Response(JSON.stringify({ alerts_created: alertsCreated }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('evaluate-alerts error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function createAlertIfNew(
  orgId: string,
  campaign: { id: string; name: string; platform: string },
  alertType: string,
  message: string,
  severity: string,
  value: number,
  threshold: number
) {
  // Check for existing unresolved alert of same type for same campaign
  const { data: existing } = await supabase
    .from('performance_alerts')
    .select('id')
    .eq('org_id', orgId)
    .eq('campaign_id', campaign.id)
    .eq('alert_type', alertType)
    .eq('is_resolved', false)
    .limit(1)

  if (existing && existing.length > 0) return

  await supabase.from('performance_alerts').insert({
    org_id: orgId,
    campaign_id: campaign.id,
    alert_type: alertType,
    message,
    severity,
    metric_value: value,
    threshold_value: threshold,
  })
}
