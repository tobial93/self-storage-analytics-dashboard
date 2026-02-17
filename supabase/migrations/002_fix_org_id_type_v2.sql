-- Fix organization ID type to use Clerk org IDs instead of UUIDs
-- This migration changes org_id from UUID to TEXT to match Clerk's organization IDs

-- Step 1: Drop all RLS policies that depend on org_id
DROP POLICY IF EXISTS users_org_access ON users;
DROP POLICY IF EXISTS campaigns_org_access ON campaigns;
DROP POLICY IF EXISTS metrics_org_access ON campaign_daily_metrics;
DROP POLICY IF EXISTS alerts_org_access ON performance_alerts;
DROP POLICY IF EXISTS connections_org_access ON ad_account_connections;
DROP POLICY IF EXISTS events_org_access ON conversion_events;
DROP POLICY IF EXISTS branding_org_access ON organization_branding;

-- Step 2: Drop all foreign key constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_org_id_fkey;
ALTER TABLE ad_account_connections DROP CONSTRAINT IF EXISTS ad_account_connections_org_id_fkey;
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_org_id_fkey;
ALTER TABLE campaign_daily_metrics DROP CONSTRAINT IF EXISTS campaign_daily_metrics_org_id_fkey;
ALTER TABLE performance_alerts DROP CONSTRAINT IF EXISTS performance_alerts_org_id_fkey;
ALTER TABLE conversion_events DROP CONSTRAINT IF EXISTS conversion_events_org_id_fkey;
ALTER TABLE organization_branding DROP CONSTRAINT IF EXISTS organization_branding_org_id_fkey;

-- Step 3: Drop and recreate organizations table with TEXT id
DROP TABLE IF EXISTS organizations CASCADE;
CREATE TABLE organizations (
  id TEXT PRIMARY KEY, -- Clerk organization ID
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'agency')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Step 4: Alter all tables to use TEXT for org_id
ALTER TABLE users ALTER COLUMN org_id TYPE TEXT;
ALTER TABLE ad_account_connections ALTER COLUMN org_id TYPE TEXT;
ALTER TABLE campaigns ALTER COLUMN org_id TYPE TEXT;
ALTER TABLE campaign_daily_metrics ALTER COLUMN org_id TYPE TEXT;
ALTER TABLE performance_alerts ALTER COLUMN org_id TYPE TEXT;
ALTER TABLE conversion_events ALTER COLUMN org_id TYPE TEXT;
ALTER TABLE organization_branding ALTER COLUMN org_id TYPE TEXT;

-- Step 5: Re-add foreign key constraints
ALTER TABLE users
  ADD CONSTRAINT users_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE ad_account_connections
  ADD CONSTRAINT ad_account_connections_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE campaign_daily_metrics
  ADD CONSTRAINT campaign_daily_metrics_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE performance_alerts
  ADD CONSTRAINT performance_alerts_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE conversion_events
  ADD CONSTRAINT conversion_events_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE organization_branding
  ADD CONSTRAINT organization_branding_org_id_fkey
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Step 6: Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_account_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;

-- Step 7: Recreate RLS policies
-- Organizations policy
CREATE POLICY organizations_access ON organizations
  FOR ALL USING (id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Users policy
CREATE POLICY users_org_access ON users
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Ad connections policy
CREATE POLICY connections_org_access ON ad_account_connections
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Campaigns policy
CREATE POLICY campaigns_org_access ON campaigns
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Metrics policy
CREATE POLICY metrics_org_access ON campaign_daily_metrics
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Alerts policy
CREATE POLICY alerts_org_access ON performance_alerts
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Conversion events policy
CREATE POLICY events_org_access ON conversion_events
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Branding policy
CREATE POLICY branding_org_access ON organization_branding
  FOR ALL USING (org_id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Step 8: Usage limit enforcement for ad connections (subscription tiers)
CREATE POLICY connection_limit_check ON ad_account_connections
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM ad_account_connections WHERE org_id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub')) <
    CASE
      WHEN (SELECT subscription_tier FROM organizations WHERE id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub')) = 'starter' THEN 5
      WHEN (SELECT subscription_tier FROM organizations WHERE id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub')) = 'professional' THEN 20
      ELSE 999999
    END
  );
