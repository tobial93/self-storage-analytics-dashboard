-- Rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INT NOT NULL DEFAULT 1
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- Auto-cleanup: delete expired windows older than 1 hour
-- (can be run periodically or via pg_cron)
