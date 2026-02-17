-- Fix RLS infinite recursion by using helper function with SECURITY DEFINER
-- This allows the function to bypass RLS when looking up the user's org_id

-- Drop existing policies
DROP POLICY IF EXISTS organizations_access ON organizations;
DROP POLICY IF EXISTS users_org_access ON users;
DROP POLICY IF EXISTS connections_org_access ON ad_account_connections;
DROP POLICY IF EXISTS campaigns_org_access ON campaigns;
DROP POLICY IF EXISTS metrics_org_access ON campaign_daily_metrics;
DROP POLICY IF EXISTS alerts_org_access ON performance_alerts;
DROP POLICY IF EXISTS events_org_access ON conversion_events;
DROP POLICY IF EXISTS branding_org_access ON organization_branding;
DROP POLICY IF EXISTS connection_limit_check ON ad_account_connections;

-- Drop old helper function if it exists
DROP FUNCTION IF EXISTS public.get_user_org_id();
DROP FUNCTION IF EXISTS public.get_current_user_org_id();

-- Create helper function that bypasses RLS to get current user's org_id
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.users WHERE clerk_user_id = auth.jwt()->>'sub' LIMIT 1
$$;

-- Recreate RLS policies using the helper function
-- Organizations: users can only access their own organization
CREATE POLICY organizations_access ON organizations
  FOR ALL
  USING (id = public.current_user_org_id());

-- Users: users can access users in their organization
CREATE POLICY users_org_access ON users
  FOR ALL
  USING (org_id = public.current_user_org_id());

-- Ad connections: users can only access connections for their organization
CREATE POLICY connections_org_access ON ad_account_connections
  FOR ALL
  USING (org_id = public.current_user_org_id());

-- Campaigns: users can only access campaigns for their organization
CREATE POLICY campaigns_org_access ON campaigns
  FOR ALL
  USING (org_id = public.current_user_org_id());

-- Metrics: users can only access metrics for their organization
CREATE POLICY metrics_org_access ON campaign_daily_metrics
  FOR ALL
  USING (org_id = public.current_user_org_id());

-- Alerts: users can only access alerts for their organization
CREATE POLICY alerts_org_access ON performance_alerts
  FOR ALL
  USING (org_id = public.current_user_org_id());

-- Events: users can only access events for their organization
CREATE POLICY events_org_access ON conversion_events
  FOR ALL
  USING (org_id = public.current_user_org_id());

-- Branding: users can only access branding for their organization
CREATE POLICY branding_org_access ON organization_branding
  FOR ALL
  USING (org_id = public.current_user_org_id());

-- Usage limit enforcement for ad connections based on subscription tier
CREATE POLICY connection_limit_check ON ad_account_connections
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*)
     FROM ad_account_connections
     WHERE org_id = public.current_user_org_id()) <
    CASE
      WHEN (SELECT subscription_tier
            FROM organizations
            WHERE id = public.current_user_org_id()) = 'starter' THEN 5
      WHEN (SELECT subscription_tier
            FROM organizations
            WHERE id = public.current_user_org_id()) = 'professional' THEN 20
      ELSE 999999
    END
  );
