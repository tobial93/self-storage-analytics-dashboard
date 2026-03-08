import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const INTERVAL_MS: Record<string, number> = {
  hourly: 60 * 60 * 1000,
  every_6h: 6 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
}

const PLATFORM_TO_FUNCTION: Record<string, string | null> = {
  google_ads: 'sync-google-ads',
  ga4: 'sync-ga4',
  linkedin_ads: 'sync-linkedin',
  facebook_ads: null, // client-side mock, skip
  instagram_ads: null,
}

async function runDueSchedules() {
  const now = new Date().toISOString()

  const { data: schedules, error } = await supabase
    .from('sync_schedules')
    .select('*')
    .eq('is_enabled', true)
    .lte('next_run_at', now)

  if (error) {
    console.error('Error fetching due schedules:', error)
    return
  }

  if (!schedules || schedules.length === 0) {
    console.log('No due schedules found')
    return
  }

  console.log(`Found ${schedules.length} due schedule(s)`)

  for (const schedule of schedules) {
    const functionName = PLATFORM_TO_FUNCTION[schedule.platform]
    const intervalMs = INTERVAL_MS[schedule.frequency] || INTERVAL_MS.daily
    const nextRunAt = new Date(Date.now() + intervalMs).toISOString()

    // Update timestamps regardless of success/failure
    await supabase
      .from('sync_schedules')
      .update({ last_run_at: now, next_run_at: nextRunAt })
      .eq('id', schedule.id)

    if (!functionName) {
      console.log(`Skipping ${schedule.platform} (no server-side sync function)`)
      continue
    }

    try {
      const { error: invokeError } = await supabase.functions.invoke(functionName, {
        body: { org_id: schedule.org_id },
      })

      if (invokeError) {
        console.error(`Error syncing ${schedule.platform} for org ${schedule.org_id}:`, invokeError)
      } else {
        console.log(`Successfully synced ${schedule.platform} for org ${schedule.org_id}`)
      }
    } catch (err) {
      console.error(`Exception syncing ${schedule.platform} for org ${schedule.org_id}:`, err)
    }
  }
}

// Scheduled cron: runs every hour
Deno.cron('scheduled-platform-sync', '0 * * * *', runDueSchedules)

// Also expose HTTP for manual invocation / health check
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  await runDueSchedules()
  return new Response(JSON.stringify({ ok: true, message: 'Scheduled sync triggered manually' }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
