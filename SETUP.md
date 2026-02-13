# SaaS Marketing Analytics Dashboard - Setup Guide

This guide will walk you through setting up the authentication and database for the Marketing Analytics Dashboard.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Clerk account (free tier available)
- A Supabase account (free tier available)

## Phase 1 & 2: Authentication and Database Setup

### Step 1: Install Dependencies

Dependencies have already been installed. If you need to reinstall:

```bash
npm install
```

### Step 2: Set Up Clerk Authentication

1. **Create a Clerk Application**
   - Go to [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
   - Sign up or log in
   - Click "Add application"
   - Name it "Marketing Analytics Dashboard"
   - Choose your preferred authentication options (Email, Google, etc.)

2. **Enable Organizations**
   - In your Clerk dashboard, go to "Organizations"
   - Enable organization features
   - Configure organization settings (roles, permissions, etc.)

3. **Get Your Clerk Keys**
   - In Clerk dashboard, go to "API Keys"
   - Copy your "Publishable Key"
   - Add it to your `.env.local` file:
     ```
     VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
     ```

### Step 3: Set Up Supabase Database

1. **Create a Supabase Project**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign up or log in
   - Click "New Project"
   - Fill in:
     - Name: "marketing-analytics-dashboard"
     - Database Password: (choose a strong password and save it)
     - Region: (choose closest to your users)

2. **Get Your Supabase Keys**
   - In Supabase dashboard, go to "Settings" → "API"
   - Copy:
     - Project URL
     - `anon` `public` key
   - Add them to your `.env.local` file:
     ```
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJxxxxx
     VITE_API_BASE_URL=https://xxxxx.supabase.co/functions/v1
     ```

3. **Run the Database Migration**
   - In Supabase dashboard, go to "SQL Editor"
   - Click "New Query"
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste into the editor and click "Run"
   - This will create all tables, indexes, and Row-Level Security policies

4. **Verify Database Setup**
   - Go to "Table Editor" in Supabase dashboard
   - You should see these tables:
     - organizations
     - users
     - ad_account_connections
     - campaigns
     - campaign_daily_metrics
     - performance_alerts
     - conversion_events
     - organization_branding

### Step 4: Configure Clerk + Supabase Integration

1. **Set Up JWT Template in Clerk**
   - In Clerk dashboard, go to "JWT Templates"
   - Click "New Template"
   - Choose "Supabase" from the templates
   - Name it "supabase"
   - In the claims section, ensure it includes:
     ```json
     {
       "sub": "{{user.id}}"
     }
     ```
   - Save the template

2. **Configure Supabase to Accept Clerk JWTs**
   - In Clerk dashboard, find your JWT Template's JWKS endpoint
   - In Supabase dashboard, go to "Authentication" → "Providers"
   - Scroll to "External Providers"
   - Add Clerk as a provider using the JWKS endpoint

### Step 5: Start the Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:5173`

### Step 6: Test the Setup

1. **Sign Up**
   - Navigate to `http://localhost:5173`
   - You should be redirected to the sign-in page
   - Click "Sign up" and create an account

2. **Create an Organization**
   - After signing in, you may be prompted to create an organization
   - Create one (e.g., "My Agency")

3. **Verify Multi-Tenancy**
   - Click the organization switcher in the header
   - You should see your organization name
   - The sidebar should show "Organization: My Agency"

4. **Check Database**
   - In Supabase dashboard, go to "Table Editor" → "users"
   - You should see your user record with the Clerk user ID
   - Note: The organizations table won't have a record yet (that will be added when we sync organizations from Clerk in a future phase)

## Current Status

✅ **Phase 1: Authentication & Multi-Tenancy** - COMPLETE
- Clerk authentication integrated
- Organization context created
- Protected routes configured
- UI updated with org switcher and user menu

✅ **Phase 2: Supabase Backend Setup** - COMPLETE
- Database schema created with RLS
- API service layer implemented
- React Query hooks created
- Multi-tenant architecture configured

## Next Steps

- **Phase 3**: Google Ads Integration (Coming Soon)
- **Phase 4**: Facebook/Instagram Ads Integration
- **Phase 5**: GA4 & LinkedIn Ads
- **Phase 6**: Real-Time Features
- **Phase 7**: White-Label & Subscriptions
- **Phase 8**: Production Hardening

## Troubleshooting

### "Missing Clerk Publishable Key" Error
- Make sure `.env.local` exists and contains `VITE_CLERK_PUBLISHABLE_KEY`
- Restart the dev server after adding environment variables

### "Missing Supabase environment variables" Error
- Make sure `.env.local` contains both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the dev server

### Database Connection Errors
- Verify your Supabase project is running (not paused)
- Check that the URL and anon key are correct
- Ensure the database migration ran successfully

### RLS Policy Errors
- Make sure you ran the full migration script
- Verify that the `auth.user_org_id()` function was created
- Check that all tables have RLS enabled

## Architecture Notes

### Multi-Tenancy Model
- **Pooled schema**: All tenants share the same tables
- **Tenant isolation**: Enforced via Row-Level Security (RLS)
- **Org ID propagation**: Every table has an `org_id` column
- **Security**: Clerk JWT contains user ID, which maps to org_id

### Data Flow
1. User signs in via Clerk
2. Clerk provides JWT with user ID
3. Supabase validates JWT
4. RLS policies use JWT to filter data by org_id
5. React Query caches data and manages refetching

### Why This Stack?

**Clerk**: Best-in-class auth with built-in multi-tenancy
**Supabase**: PostgreSQL + real-time + edge functions in one platform
**React Query**: Powerful data fetching with caching and optimistic updates
**RLS**: Database-level security prevents data leaks

## Support

For issues or questions:
- Check the main README.md
- Review the implementation plan
- Check Supabase logs in the dashboard
- Check browser console for errors
