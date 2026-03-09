-- Add emailed_at column to track which alerts have been sent via email
ALTER TABLE performance_alerts ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_alerts_not_emailed
  ON performance_alerts(org_id, is_resolved)
  WHERE is_resolved = FALSE AND emailed_at IS NULL;
