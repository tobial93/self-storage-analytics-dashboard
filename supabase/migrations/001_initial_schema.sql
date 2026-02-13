-- Marketing Analytics Dashboard - Initial Schema
-- This migration creates the core multi-tenant database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Organizations table (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'agency')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);

CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);

-- ============================================================
-- AD PLATFORM INTEGRATIONS
-- ============================================================

-- Ad account connections
CREATE TABLE ad_account_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google_ads', 'facebook_ads', 'instagram_ads', 'linkedin_ads', 'ga4')),
  account_id TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(org_id, platform, account_id)
);

CREATE INDEX idx_connections_org_id ON ad_account_connections(org_id);
CREATE INDEX idx_connections_platform ON ad_account_connections(org_id, platform);
CREATE INDEX idx_connections_active ON ad_account_connections(org_id, is_active) WHERE is_active = TRUE;

-- ============================================================
-- CAMPAIGN DATA
-- ============================================================

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES ad_account_connections(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL, -- Platform's campaign ID
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'deleted')),
  budget DECIMAL(12, 2),
  spent DECIMAL(12, 2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, external_id)
);

CREATE INDEX idx_campaigns_org_id ON campaigns(org_id);
CREATE INDEX idx_campaigns_platform ON campaigns(org_id, platform);
CREATE INDEX idx_campaigns_status ON campaigns(org_id, status);
CREATE INDEX idx_campaigns_synced ON campaigns(synced_at DESC);

-- Daily campaign metrics
CREATE TABLE campaign_daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  spend DECIMAL(12, 2) DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  -- Computed metrics
  ctr DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN ROUND((clicks::DECIMAL / impressions * 100), 2) ELSE 0 END
  ) STORED,
  cpa DECIMAL(12, 2) GENERATED ALWAYS AS (
    CASE WHEN conversions > 0 THEN ROUND((spend / conversions), 2) ELSE 0 END
  ) STORED,
  roas DECIMAL(8, 2) GENERATED ALWAYS AS (
    CASE WHEN spend > 0 THEN ROUND((revenue / spend), 2) ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, metric_date)
);

CREATE INDEX idx_daily_metrics_org_date ON campaign_daily_metrics(org_id, metric_date DESC);
CREATE INDEX idx_daily_metrics_campaign ON campaign_daily_metrics(campaign_id, metric_date DESC);

-- ============================================================
-- ALERTS & NOTIFICATIONS
-- ============================================================

-- Performance alerts
CREATE TABLE performance_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('budget_exceeded', 'low_roas', 'high_cpa', 'low_ctr', 'anomaly')),
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  message TEXT NOT NULL,
  value DECIMAL(12, 2),
  threshold DECIMAL(12, 2),
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_org_created ON performance_alerts(org_id, created_at DESC);
CREATE INDEX idx_alerts_unresolved ON performance_alerts(org_id, is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_alerts_campaign ON performance_alerts(campaign_id, created_at DESC);

-- ============================================================
-- CONVERSION TRACKING
-- ============================================================

-- Conversion events (for funnel analysis)
CREATE TABLE conversion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'landing_page', 'add_to_cart', 'checkout', 'purchase')),
  user_identifier TEXT, -- Hashed user ID for privacy
  event_timestamp TIMESTAMPTZ NOT NULL,
  value DECIMAL(12, 2),
  metadata JSONB, -- Additional event data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_org_timestamp ON conversion_events(org_id, event_timestamp DESC);
CREATE INDEX idx_events_campaign ON conversion_events(campaign_id, event_timestamp DESC);
CREATE INDEX idx_events_type ON conversion_events(org_id, event_type, event_timestamp DESC);

-- ============================================================
-- WHITE-LABEL BRANDING
-- ============================================================

-- Organization branding settings
CREATE TABLE organization_branding (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  company_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_account_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's org_id
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
$$ LANGUAGE sql STABLE;

-- Organizations policy (users can only see their own org)
CREATE POLICY organizations_access ON organizations
  FOR ALL
  USING (id = auth.user_org_id());

-- Users policy
CREATE POLICY users_org_access ON users
  FOR ALL
  USING (org_id = auth.user_org_id());

-- Ad account connections policy
CREATE POLICY connections_org_access ON ad_account_connections
  FOR ALL
  USING (org_id = auth.user_org_id());

-- Campaigns policy
CREATE POLICY campaigns_org_access ON campaigns
  FOR ALL
  USING (org_id = auth.user_org_id());

-- Campaign metrics policy
CREATE POLICY metrics_org_access ON campaign_daily_metrics
  FOR ALL
  USING (org_id = auth.user_org_id());

-- Alerts policy
CREATE POLICY alerts_org_access ON performance_alerts
  FOR ALL
  USING (org_id = auth.user_org_id());

-- Conversion events policy
CREATE POLICY events_org_access ON conversion_events
  FOR ALL
  USING (org_id = auth.user_org_id());

-- Branding policy
CREATE POLICY branding_org_access ON organization_branding
  FOR ALL
  USING (org_id = auth.user_org_id());

-- ============================================================
-- USAGE LIMITS (by subscription tier)
-- ============================================================

-- Enforce connection limits based on subscription tier
CREATE POLICY connection_limit_enforcement ON ad_account_connections
  FOR INSERT
  WITH CHECK (
    (
      SELECT COUNT(*) FROM ad_account_connections
      WHERE org_id = auth.user_org_id()
    ) <
    (
      SELECT CASE
        WHEN subscription_tier = 'starter' THEN 5
        WHEN subscription_tier = 'professional' THEN 20
        ELSE 999999
      END
      FROM organizations
      WHERE id = auth.user_org_id()
    )
  );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for campaigns
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for branding
CREATE TRIGGER update_branding_updated_at
  BEFORE UPDATE ON organization_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA (for development/testing)
-- ============================================================

-- This section can be removed in production
-- Insert a test organization
-- INSERT INTO organizations (id, name, slug, subscription_tier)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Test Agency', 'test-agency', 'professional');

-- ============================================================
-- COMMENTS (for documentation)
-- ============================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations (agencies)';
COMMENT ON TABLE users IS 'User accounts linked to Clerk authentication';
COMMENT ON TABLE ad_account_connections IS 'Connected advertising platform accounts';
COMMENT ON TABLE campaigns IS 'Advertising campaigns from all platforms';
COMMENT ON TABLE campaign_daily_metrics IS 'Daily performance metrics for campaigns';
COMMENT ON TABLE performance_alerts IS 'Automated performance alerts and anomalies';
COMMENT ON TABLE conversion_events IS 'Conversion funnel event tracking';
COMMENT ON TABLE organization_branding IS 'White-label branding settings';
