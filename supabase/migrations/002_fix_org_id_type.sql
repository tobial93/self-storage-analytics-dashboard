-- Fix organization ID type to use Clerk org IDs instead of UUIDs
-- This migration changes org_id from UUID to TEXT to match Clerk's organization IDs

-- First, drop all foreign key constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_org_id_fkey;
ALTER TABLE ad_account_connections DROP CONSTRAINT IF EXISTS ad_account_connections_org_id_fkey;
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_org_id_fkey;
ALTER TABLE campaign_daily_metrics DROP CONSTRAINT IF EXISTS campaign_daily_metrics_org_id_fkey;
ALTER TABLE performance_alerts DROP CONSTRAINT IF EXISTS performance_alerts_org_id_fkey;
ALTER TABLE conversion_events DROP CONSTRAINT IF EXISTS conversion_events_org_id_fkey;
ALTER TABLE organization_branding DROP CONSTRAINT IF EXISTS organization_branding_org_id_fkey;

-- Drop and recreate organizations table with TEXT id
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

-- Alter all tables to use TEXT for org_id
ALTER TABLE users
  ALTER COLUMN org_id TYPE TEXT;

ALTER TABLE ad_account_connections
  ALTER COLUMN org_id TYPE TEXT;

ALTER TABLE campaigns
  ALTER COLUMN org_id TYPE TEXT;

ALTER TABLE campaign_daily_metrics
  ALTER COLUMN org_id TYPE TEXT;

ALTER TABLE performance_alerts
  ALTER COLUMN org_id TYPE TEXT;

ALTER TABLE conversion_events
  ALTER COLUMN org_id TYPE TEXT;

ALTER TABLE organization_branding
  ALTER COLUMN org_id TYPE TEXT;

-- Re-add foreign key constraints
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

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS policy for organizations
CREATE POLICY organizations_access ON organizations
  FOR ALL USING (id = (SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));
