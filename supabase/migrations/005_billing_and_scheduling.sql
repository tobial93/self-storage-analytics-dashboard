-- Add onboarding flag
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Sync schedules table
CREATE TABLE IF NOT EXISTS sync_schedules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL CHECK (platform IN ('google_ads','facebook_ads','instagram_ads','linkedin_ads','ga4')),
  frequency   TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('hourly','every_6h','daily')),
  is_enabled  BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_sync_schedules_next ON sync_schedules(next_run_at)
  WHERE is_enabled = true;

CREATE TRIGGER update_sync_schedules_updated_at
  BEFORE UPDATE ON sync_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE sync_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_schedules_org_access ON sync_schedules
  FOR ALL TO authenticated
  USING (org_id = public.current_user_org_id())
  WITH CHECK (org_id = public.current_user_org_id());

-- Fix connection limit policy (free:1, starter:3, pro/agency:unlimited)
DROP POLICY IF EXISTS connection_limit_check ON ad_account_connections;
DROP POLICY IF EXISTS connection_limit_enforcement ON ad_account_connections;

CREATE POLICY connection_limit_check ON ad_account_connections
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT COUNT(*) FROM ad_account_connections
     WHERE org_id = public.current_user_org_id() AND is_active = true) <
    CASE (SELECT subscription_tier FROM organizations WHERE id = public.current_user_org_id())
      WHEN 'free'         THEN 1
      WHEN 'starter'      THEN 3
      WHEN 'professional' THEN 999999
      WHEN 'agency'       THEN 999999
      ELSE 1
    END
  );
