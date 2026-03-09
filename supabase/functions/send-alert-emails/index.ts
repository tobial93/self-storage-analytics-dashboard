import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Optional: pass org_id to send for a specific org, or omit for all orgs
    let orgFilter: string | undefined
    try {
      const body = await req.json()
      orgFilter = body?.org_id
    } catch {
      // No body is fine — process all orgs
    }

    // Fetch unresolved, un-emailed alerts
    let alertQuery = supabase
      .from('performance_alerts')
      .select('id, org_id, campaign_id, alert_type, severity, message, created_at, emailed_at, campaign:campaigns(name)')
      .eq('is_resolved', false)
      .is('emailed_at', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (orgFilter) {
      alertQuery = alertQuery.eq('org_id', orgFilter)
    }

    const { data: alerts, error: alertsError } = await alertQuery

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch alerts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No pending alerts' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Group alerts by org_id
    const byOrg: Record<string, typeof alerts> = {}
    for (const alert of alerts) {
      if (!byOrg[alert.org_id]) byOrg[alert.org_id] = []
      byOrg[alert.org_id].push(alert)
    }

    // Get admin email addresses for each org
    const orgIds = Object.keys(byOrg)
    const { data: users } = await supabase
      .from('users')
      .select('org_id, email, role')
      .in('org_id', orgIds)
      .in('role', ['admin', 'owner'])

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'No admin users found for affected orgs' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailsByOrg: Record<string, string[]> = {}
    for (const u of users) {
      if (!u.email) continue
      if (!emailsByOrg[u.org_id]) emailsByOrg[u.org_id] = []
      emailsByOrg[u.org_id].push(u.email)
    }

    const fromEmail = Deno.env.get('ALERT_FROM_EMAIL') || 'alerts@yourdomain.com'
    let totalSent = 0
    const sentAlertIds: string[] = []

    for (const orgId of orgIds) {
      const orgAlerts = byOrg[orgId]
      const recipients = emailsByOrg[orgId]
      if (!recipients?.length || !orgAlerts?.length) continue

      const severityOrder = { high: 0, medium: 1, low: 2 }
      const sorted = [...orgAlerts].sort((a, b) =>
        (severityOrder[a.severity as keyof typeof severityOrder] ?? 2) -
        (severityOrder[b.severity as keyof typeof severityOrder] ?? 2)
      )

      const alertRows = sorted.map(a => {
        const campaignName = (a.campaign as { name?: string })?.name || 'Unknown'
        const severity = (a.severity || 'medium').toUpperCase()
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;"><strong>${severity}</strong></td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;">${campaignName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;">${a.message || a.alert_type}</td>
        </tr>`
      }).join('')

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#111;font-size:18px;margin-bottom:16px;">Campaign Performance Alerts</h2>
          <p style="color:#555;font-size:14px;margin-bottom:16px;">
            You have ${orgAlerts.length} new alert${orgAlerts.length > 1 ? 's' : ''} requiring attention.
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:8px 12px;text-align:left;">Severity</th>
                <th style="padding:8px 12px;text-align:left;">Campaign</th>
                <th style="padding:8px 12px;text-align:left;">Details</th>
              </tr>
            </thead>
            <tbody>${alertRows}</tbody>
          </table>
          <p style="color:#555;font-size:13px;margin-top:20px;">
            Log in to your dashboard to review and resolve these alerts.
          </p>
        </div>
      `

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: recipients,
          subject: `[Alert] ${orgAlerts.length} campaign alert${orgAlerts.length > 1 ? 's' : ''} need attention`,
          html,
        }),
      })

      if (emailRes.ok) {
        totalSent++
        sentAlertIds.push(...orgAlerts.map(a => a.id))
      } else {
        const errText = await emailRes.text()
        console.error(`Failed to send email for org ${orgId}:`, errText)
      }
    }

    // Mark alerts as emailed
    if (sentAlertIds.length > 0) {
      await supabase
        .from('performance_alerts')
        .update({ emailed_at: new Date().toISOString() })
        .in('id', sentAlertIds)
    }

    return new Response(JSON.stringify({ sent: totalSent, alertsProcessed: sentAlertIds.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error in send-alert-emails:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
