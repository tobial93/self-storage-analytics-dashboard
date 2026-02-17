-- Fix RLS policies to allow inserting new organizations and users
-- The issue: when creating a new org, there's no user record yet, so current_user_org_id() returns NULL

-- Drop existing policies
DROP POLICY IF EXISTS organizations_access ON organizations;
DROP POLICY IF EXISTS users_org_access ON users;

-- ============================================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================================

-- Allow authenticated users to insert organizations (for new org creation)
CREATE POLICY organizations_insert ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view/update/delete their own organization
CREATE POLICY organizations_select ON organizations
  FOR SELECT
  TO authenticated
  USING (id = public.current_user_org_id());

CREATE POLICY organizations_update ON organizations
  FOR UPDATE
  TO authenticated
  USING (id = public.current_user_org_id())
  WITH CHECK (id = public.current_user_org_id());

CREATE POLICY organizations_delete ON organizations
  FOR DELETE
  TO authenticated
  USING (id = public.current_user_org_id());

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Allow authenticated users to insert themselves
CREATE POLICY users_insert ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (clerk_user_id = auth.jwt()->>'sub');

-- Allow users to view users in their organization
CREATE POLICY users_select ON users
  FOR SELECT
  TO authenticated
  USING (org_id = public.current_user_org_id() OR clerk_user_id = auth.jwt()->>'sub');

-- Allow users to update their own record
CREATE POLICY users_update ON users
  FOR UPDATE
  TO authenticated
  USING (clerk_user_id = auth.jwt()->>'sub')
  WITH CHECK (clerk_user_id = auth.jwt()->>'sub');

-- Only allow deleting own user record
CREATE POLICY users_delete ON users
  FOR DELETE
  TO authenticated
  USING (clerk_user_id = auth.jwt()->>'sub');
