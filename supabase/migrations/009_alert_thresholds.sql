-- Alert thresholds per organization
CREATE TABLE IF NOT EXISTS alert_thresholds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  cpa_max     DECIMAL(12, 2),
  ctr_min     DECIMAL(5, 2),
  spend_spike_pct DECIMAL(5, 2),
  roas_min    DECIMAL(8, 2),
  is_enabled  BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY alert_thresholds_org_access ON alert_thresholds
  FOR ALL TO authenticated
  USING (org_id = public.current_user_org_id())
  WITH CHECK (org_id = public.current_user_org_id());
