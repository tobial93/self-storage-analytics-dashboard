import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRateLimit, rateLimitResponse } from '../_shared/rateLimit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { org_id, start_date, end_date } = await req.json()

    if (!org_id) {
      return new Response(JSON.stringify({ error: 'org_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Rate limit: 10 requests per org per hour
    const rl = await checkRateLimit(org_id, 'ai-insights', 10, 3600)
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds!)

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch metrics from DB
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const startDateStr = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDateStr = end_date || new Date().toISOString().split('T')[0]

    // Get campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, platform, status')
      .eq('org_id', org_id)

    // Get metrics
    const { data: metrics } = await supabase
      .from('campaign_daily_metrics')
      .select('campaign_id, metric_date, spend, impressions, clicks, conversions, revenue')
      .eq('org_id', org_id)
      .gte('metric_date', startDateStr)
      .lte('metric_date', endDateStr)
      .order('metric_date', { ascending: true })

    if (!campaigns?.length || !metrics?.length) {
      return new Response(JSON.stringify({
        insights: 'Not enough data to generate insights. Connect an ad platform and sync campaign data first.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Aggregate per campaign
    const campaignMap = new Map(campaigns.map(c => [c.id, c]))
    const stats: Record<string, { name: string; platform: string; spend: number; revenue: number; clicks: number; impressions: number; conversions: number; days: number }> = {}

    for (const m of metrics) {
      const c = campaignMap.get(m.campaign_id)
      if (!c) continue
      if (!stats[m.campaign_id]) {
        stats[m.campaign_id] = { name: c.name, platform: c.platform, spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0, days: 0 }
      }
      stats[m.campaign_id].spend += Number(m.spend || 0)
      stats[m.campaign_id].revenue += Number(m.revenue || 0)
      stats[m.campaign_id].clicks += Number(m.clicks || 0)
      stats[m.campaign_id].impressions += Number(m.impressions || 0)
      stats[m.campaign_id].conversions += Number(m.conversions || 0)
      stats[m.campaign_id].days++
    }

    const summaryRows = Object.values(stats).map(s => ({
      ...s,
      roas: s.spend > 0 ? (s.revenue / s.spend).toFixed(2) : '0',
      cpa: s.conversions > 0 ? (s.spend / s.conversions).toFixed(2) : 'N/A',
      ctr: s.impressions > 0 ? ((s.clicks / s.impressions) * 100).toFixed(2) : '0',
    }))

    const totalSpend = summaryRows.reduce((s, r) => s + r.spend, 0)
    const totalRevenue = summaryRows.reduce((s, r) => s + r.revenue, 0)
    const totalConversions = summaryRows.reduce((s, r) => s + r.conversions, 0)

    const dataContext = `
Period: ${startDateStr} to ${endDateStr}
Total spend: $${totalSpend.toFixed(2)}
Total revenue: $${totalRevenue.toFixed(2)}
Overall ROAS: ${totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 0}x
Total conversions: ${totalConversions}
Overall CPA: $${totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : 'N/A'}

Campaign breakdown:
${summaryRows.map(r =>
  `- ${r.name} (${r.platform}): $${r.spend.toFixed(0)} spend, $${r.revenue.toFixed(0)} revenue, ${r.roas}x ROAS, ${r.conversions} conversions, $${r.cpa} CPA, ${r.ctr}% CTR, ${r.days} days of data`
).join('\n')}
`.trim()

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [
          {
            role: 'user',
            content: `You are an advertising analytics assistant. Analyze this campaign performance data and provide 3-4 concise, actionable insights. Focus on what's working, what's underperforming, and specific recommendations. Be direct — no filler, no hedging. Use numbers.\n\n${dataContext}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Claude API error:', err)
      return new Response(JSON.stringify({ error: 'Failed to generate insights' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await response.json()
    const insightsText = result.content?.[0]?.text || 'Unable to generate insights.'

    return new Response(JSON.stringify({ insights: insightsText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error in ai-insights:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
