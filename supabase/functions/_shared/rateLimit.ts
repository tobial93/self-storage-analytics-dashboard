import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Simple rate limiter using Supabase as storage.
 * Tracks requests per org_id per function within a sliding window.
 *
 * Uses the `rate_limits` table:
 *   CREATE TABLE IF NOT EXISTS rate_limits (
 *     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *     key TEXT NOT NULL,
 *     window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 *     request_count INT NOT NULL DEFAULT 1,
 *     UNIQUE(key)
 *   );
 */

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds?: number
}

export async function checkRateLimit(
  orgId: string,
  functionName: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const key = `${functionName}:${orgId}`
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowSeconds * 1000)

  // Try to get existing rate limit record
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('id, window_start, request_count')
    .eq('key', key)
    .single()

  if (!existing) {
    // First request — create record
    await supabase
      .from('rate_limits')
      .upsert({ key, window_start: now.toISOString(), request_count: 1 })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  const existingWindowStart = new Date(existing.window_start)

  if (existingWindowStart < windowStart) {
    // Window expired — reset
    await supabase
      .from('rate_limits')
      .update({ window_start: now.toISOString(), request_count: 1 })
      .eq('key', key)
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (existing.request_count >= maxRequests) {
    // Rate limited
    const windowEnd = new Date(existingWindowStart.getTime() + windowSeconds * 1000)
    const retryAfterSeconds = Math.ceil((windowEnd.getTime() - now.getTime()) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  // Increment counter
  await supabase
    .from('rate_limits')
    .update({ request_count: existing.request_count + 1 })
    .eq('key', key)

  return { allowed: true, remaining: maxRequests - existing.request_count - 1 }
}

export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
