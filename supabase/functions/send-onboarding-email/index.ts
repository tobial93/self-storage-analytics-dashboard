const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
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

    const { user_email, user_name, org_name } = await req.json()

    if (!user_email) {
      return new Response(JSON.stringify({ error: 'Missing user_email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const fromEmail = Deno.env.get('ALERT_FROM_EMAIL') || 'hello@metricflow.io'
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://self-storage-analytics-dashboard-production.up.railway.app'
    const displayName = user_name || 'there'
    const displayOrg = org_name || 'your organization'

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <h1 style="font-size:22px;font-weight:600;margin-bottom:8px;">Welcome to MetricFlow</h1>
        <p style="font-size:14px;color:#555;margin-bottom:20px;">
          Hi ${displayName}, your organization <strong>${displayOrg}</strong> is all set up.
        </p>

        <p style="font-size:14px;color:#333;margin-bottom:8px;font-weight:500;">Here's what you can do next:</p>
        <ul style="font-size:14px;color:#555;padding-left:20px;margin-bottom:24px;line-height:1.8;">
          <li>Connect your ad platforms (Google Ads, Facebook, GA4, LinkedIn)</li>
          <li>View unified campaign analytics and KPIs</li>
          <li>Set up automated sync schedules</li>
          <li>Configure performance alerts</li>
        </ul>

        <a href="${frontendUrl}"
           style="display:inline-block;padding:10px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">
          Go to Dashboard
        </a>

        <p style="font-size:13px;color:#999;margin-top:28px;border-top:1px solid #eee;padding-top:16px;">
          Questions? Reply to this email or reach us at
          <a href="mailto:support@metricflow.io" style="color:#6366f1;">support@metricflow.io</a>
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
        to: [user_email],
        subject: `Welcome to MetricFlow!`,
        html,
      }),
    })

    if (!emailRes.ok) {
      const errText = await emailRes.text()
      console.error('Failed to send onboarding email:', errText)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error in send-onboarding-email:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
