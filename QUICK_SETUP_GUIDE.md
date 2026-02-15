# Quick Setup Guide - Clerk + Supabase

Follow these steps to get your dashboard running with authentication and database.

---

## Part 1: Clerk Setup (5 minutes)

### Step 1: Create Clerk Account & Application

1. **Go to Clerk:** https://dashboard.clerk.com/sign-up
   - Sign up with your email or GitHub

2. **Create Application:**
   - Click "Add application"
   - Name: `Marketing Analytics Dashboard`
   - Choose authentication methods:
     - ✅ Email (recommended)
     - ✅ Google (optional)
     - ✅ GitHub (optional)
   - Click "Create application"

3. **Enable Organizations:**
   - In left sidebar, click "Organizations"
   - Toggle "Enable organizations" → ON
   - Set "Organization membership limit" → Unlimited
   - Under "Roles", verify these exist:
     - `org:admin` - Full access
     - `org:member` - Can be customized
   - Click "Save"

### Step 2: Get Your Clerk Keys

1. **Get Publishable Key:**
   - In left sidebar, click "API Keys"
   - Copy your **Publishable Key** (starts with `pk_test_`)
   - Keep this page open, you'll need it soon

2. **Update .env.local:**
   ```bash
   # Open .env.local and paste your key:
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 3: Configure JWT Template (for Supabase integration)

1. **Create JWT Template:**
   - In Clerk sidebar, click "JWT Templates"
   - Click "New template"
   - Select "Supabase" from the dropdown
   - Name: `supabase`
   - **Important:** The template should look like this:
   ```json
   {
     "aud": "authenticated",
     "exp": {{token.exp}},
     "sub": "{{user.id}}",
     "email": "{{user.primary_email_address}}",
     "app_metadata": {
       "provider": "clerk"
     },
     "user_metadata": {}
   }
   ```
   - Click "Save"

4. **Copy JWKS Endpoint:**
   - After saving, you'll see a "JWKS Endpoint URL"
   - Copy this URL (you'll need it for Supabase)
   - It looks like: `https://your-app.clerk.accounts.dev/.well-known/jwks.json`

✅ **Clerk Setup Complete!**

---

## Part 2: Supabase Setup (10 minutes)

### Step 1: Create Supabase Project

1. **Go to Supabase:** https://supabase.com/dashboard
   - Sign up with GitHub (recommended) or email

2. **Create New Project:**
   - Click "New project"
   - Organization: Create one if needed (e.g., "My Agency")
   - Name: `marketing-analytics-dashboard`
   - **Database Password:** Choose a strong password
     - ⚠️ SAVE THIS PASSWORD - You'll need it later
   - Region: Choose closest to you (e.g., US East)
   - Plan: Free tier is fine for now
   - Click "Create new project"
   - ⏳ Wait 2-3 minutes for project setup

### Step 2: Get Supabase Keys

1. **Get API Keys:**
   - In left sidebar, click "Settings" (gear icon at bottom)
   - Click "API" in settings menu
   - Copy these values:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon public key** (starts with `eyJ...`)

2. **Update .env.local:**
   ```bash
   # Add these to your .env.local:
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxx
   VITE_API_BASE_URL=https://xxxxx.supabase.co/functions/v1
   ```

### Step 3: Configure Clerk JWT Authentication

1. **Add Clerk as Auth Provider:**
   - In Supabase, go to "Authentication" → "Providers"
   - Scroll down to "Custom JWT"
   - Toggle "Enable Custom JWT" → ON
   - **JWKS URL:** Paste the Clerk JWKS endpoint from earlier
     - Example: `https://your-app.clerk.accounts.dev/.well-known/jwks.json`
   - Click "Save"

### Step 4: Run Database Migration

1. **Open SQL Editor:**
   - In Supabase sidebar, click "SQL Editor"
   - Click "New query"

2. **Run Migration:**
   - Open this file in VS Code: `supabase/migrations/001_initial_schema.sql`
   - Copy ALL the contents (it's a long file ~400 lines)
   - Paste into Supabase SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - ✅ You should see "Success. No rows returned"

3. **Verify Tables Created:**
   - Click "Table Editor" in sidebar
   - You should see 8 tables:
     - ✅ organizations
     - ✅ users
     - ✅ ad_account_connections
     - ✅ campaigns
     - ✅ campaign_daily_metrics
     - ✅ performance_alerts
     - ✅ conversion_events
     - ✅ organization_branding

### Step 5: Configure RLS Policies (Already Done!)

The migration script already created all Row-Level Security policies. To verify:

1. Click any table (e.g., "campaigns")
2. Click the "Policies" tab
3. You should see policies like "campaigns_org_access"

✅ **Supabase Setup Complete!**

---

## Part 3: Test Your Setup

### Step 1: Check Environment Variables

Your `.env.local` should now have:
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxx
VITE_API_BASE_URL=https://xxxxx.supabase.co/functions/v1
VITE_ENVIRONMENT=development
```

### Step 2: Restart Dev Server

1. **Stop current server** (if running):
   - Press Ctrl+C in the terminal

2. **Start server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   - Go to http://localhost:5174 (or whatever port it shows)

### Step 3: Sign Up & Test

1. **You should see the Sign In page**
   - If you see an error about Clerk keys, double-check `.env.local`

2. **Click "Sign up"**
   - Enter your email and password
   - Verify your email (check inbox)

3. **Create Organization**
   - You may be prompted to create an organization
   - Name: "Test Agency" (or whatever you like)
   - Click "Create organization"

4. **You should now see the dashboard!**
   - Check the header: Organization switcher should show your org
   - Click your profile picture: Should show user menu
   - Sidebar: Should show "Organization: Test Agency"

### Step 4: Verify Database Integration

1. **Check Supabase:**
   - Go to Supabase dashboard → Table Editor
   - Click "users" table
   - You should see YOUR user record with:
     - clerk_user_id: Your Clerk user ID
     - email: Your email
     - role: viewer (default)

2. **Test Organization Context:**
   - In the browser console (F12), type:
     ```javascript
     localStorage
     ```
   - You should see Clerk session data

---

## Part 4: Troubleshooting

### "Missing Clerk Publishable Key"
- Check `.env.local` exists in project root
- Verify key starts with `pk_test_`
- Restart dev server

### "Invalid JWT" or Auth Errors
- Verify JWT Template in Clerk is set to "Supabase"
- Check JWKS URL is correct in Supabase Auth settings
- Try signing out and back in

### Database Connection Errors
- Verify Supabase project is not paused (free tier auto-pauses after 7 days inactivity)
- Check URL and anon key are correct
- Ensure migration ran successfully

### No User in Database
- Check RLS policies were created (they should be in migration)
- Verify Clerk JWT is configured in Supabase
- Check browser console for errors

### Organization Not Showing
- Make sure Organizations are enabled in Clerk
- Create an organization from the org switcher in header
- Refresh the page

---

## ✅ Success Checklist

After completing setup, you should be able to:

- [ ] Sign up for an account
- [ ] Verify your email
- [ ] Create an organization
- [ ] See your organization name in the sidebar
- [ ] Click organization switcher in header
- [ ] Access all pages (Overview, Campaigns, Conversions, Forecast)
- [ ] See your user in Supabase `users` table
- [ ] Toggle dark/light theme
- [ ] Sign out and sign back in

---

## 🎉 What's Next?

Once everything is working:

1. **Explore the UI:**
   - Check out all pages
   - Currently showing mock data (will be real in Phase 3)
   - Try the PDF export button

2. **Invite Team Members:**
   - Click your profile picture → Manage organization
   - Invite others to test multi-tenancy

3. **Ready for Phase 3:**
   - Google Ads integration
   - Real campaign data
   - See `IMPLEMENTATION_STATUS.md` for roadmap

---

## 🚀 Railway Deployment (Optional - Later)

Once Clerk + Supabase are working locally, deploying to Railway is easy:

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Deploy to Railway:**
   - Go to railway.app
   - "New Project" → "Deploy from GitHub repo"
   - Select your repo
   - Railway will auto-detect Vite and deploy

3. **Add Environment Variables in Railway:**
   - In Railway dashboard, go to "Variables"
   - Add all variables from `.env.local`
   - Redeploy

---

## Need Help?

- **Clerk Docs:** https://clerk.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Check SETUP.md** for more detailed explanations

Good luck! 🚀
