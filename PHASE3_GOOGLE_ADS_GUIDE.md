# Phase 3: Google Ads Integration Guide

This guide walks you through connecting real Google Ads campaign data to your dashboard.

---

## 📋 Prerequisites

Before starting, you need:
- [ ] Google account (Gmail)
- [ ] Google Cloud account (free - will be created in Step 1)
- [ ] Google Ads account (can be test account)
- [ ] Credit card (for Google Cloud verification - won't be charged on free tier)

**Time Required:**
- Setup: 2-3 hours
- Google Ads token approval: 24-48 hours (waiting period)
- Development: 1-2 weeks

---

## 🎯 Phase 3 Objectives

By the end of Phase 3, you'll have:
1. ✅ Google Ads API enabled and configured
2. ✅ OAuth flow to connect Google Ads accounts
3. ✅ Automatic data sync every hour
4. ✅ Real campaign data in your dashboard
5. ✅ Multiple ad accounts support

---

## 📝 Step-by-Step Guide

### Step 1: Create Google Cloud Project (20 minutes)

#### 1.1 Create Project

1. **Go to:** https://console.cloud.google.com
2. **Sign in** with your Google account
3. If prompted for billing, add a credit card (free tier won't charge)
4. Click **"Select a project"** (top left, near Google Cloud logo)
5. Click **"NEW PROJECT"**
6. Project name: **"Marketing Analytics Dashboard"**
7. Click **"CREATE"**
8. Wait for project creation (~30 seconds)
9. **Select** the new project from the dropdown

#### 1.2 Enable Google Ads API

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for: **"Google Ads API"**
3. Click on **"Google Ads API"**
4. Click **"ENABLE"** button
5. Wait for it to enable (~10 seconds)

#### 1.3 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

**If you see "Configure consent screen first":**
1. Click **"CONFIGURE CONSENT SCREEN"**
2. Choose **"External"** (unless you have a Google Workspace)
3. Click **"CREATE"**

**Fill out OAuth consent screen:**
- **App name:** Marketing Analytics Dashboard
- **User support email:** Your email
- **Developer contact:** Your email
- **App logo:** (optional)
- Click **"SAVE AND CONTINUE"**

**Scopes:**
- Click **"ADD OR REMOVE SCOPES"**
- Search for: **"Google Ads API"**
- Select: `https://www.googleapis.com/auth/adwords`
- Click **"UPDATE"**
- Click **"SAVE AND CONTINUE"**

**Test users:**
- Click **"+ ADD USERS"**
- Add your email (the one with Google Ads access)
- Click **"SAVE AND CONTINUE"**
- Click **"BACK TO DASHBOARD"**

**Now create OAuth credentials:**
1. Go back to **"Credentials"** tab
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: **"Marketing Analytics OAuth"**

**Authorized redirect URIs:**
- Click **"+ ADD URI"**
- Add your **Supabase project URL** + `/functions/v1/google-ads-oauth-callback`
- Example: `https://kvaespkemcsvguchfjxt.supabase.co/functions/v1/google-ads-oauth-callback`
- Also add for local testing: `http://localhost:54321/functions/v1/google-ads-oauth-callback`

5. Click **"CREATE"**

**Save your credentials:**
- **Client ID:** Copy and save (starts with something like `123456789-xxxxx.apps.googleusercontent.com`)
- **Client Secret:** Copy and save
- Click **"OK"**

✅ **Google Cloud Project Setup Complete!**

---

### Step 2: Request Google Ads Developer Token (5 minutes + 24-48hr wait)

#### 2.1 Access Google Ads API Center

1. **Go to:** https://ads.google.com
2. Sign in with your Google Ads account
3. Click **"Tools & Settings"** (wrench icon, top right)
4. Under **"Setup"**, click **"API Center"**

#### 2.2 Apply for Developer Token

1. Look for **"Developer token"** section
2. If you see a token (long string), **copy it** - you're approved! ✅
3. If you see **"Request developer token"**, click it

**Fill out application:**
- **What will you use the API for?**
  - "Building a SaaS marketing analytics dashboard to help agencies manage multiple client campaigns"
- **Have you used Google Ads API before?**
  - Select appropriate answer
- **What is your monthly API usage estimate?**
  - "Low to medium - syncing campaign data hourly for 5-20 accounts"

4. Click **"SUBMIT"**

**⏰ Wait for approval:** Google typically approves in 24-48 hours. You'll get an email.

**While waiting, you can:**
- Use the **test account** mode (limited functionality)
- Continue building the infrastructure
- Test with mock data

✅ **Application submitted! Check back in 24-48 hours.**

---

### Step 3: Set Up Environment Variables

Add these to your `.env.local` file:

```bash
# Google Ads API
VITE_GOOGLE_ADS_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
VITE_GOOGLE_ADS_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
VITE_GOOGLE_ADS_DEVELOPER_TOKEN=YOUR_DEV_TOKEN_HERE_WHEN_APPROVED
VITE_GOOGLE_ADS_REDIRECT_URI=http://localhost:5175/integrations
```

**And in Railway Variables:**
```bash
VITE_GOOGLE_ADS_CLIENT_ID=...
VITE_GOOGLE_ADS_CLIENT_SECRET=...
VITE_GOOGLE_ADS_DEVELOPER_TOKEN=...
VITE_GOOGLE_ADS_REDIRECT_URI=https://your-app.up.railway.app/integrations
```

---

### Step 4: Create Supabase Edge Functions

We need to create serverless functions in Supabase to handle:
1. OAuth callback (exchange code for tokens)
2. Data sync (fetch campaigns and metrics)

#### 4.1 Install Supabase CLI

```bash
npm install -g supabase
```

#### 4.2 Initialize Supabase Functions

```bash
supabase login
supabase link --project-ref kvaespkemcsvguchfjxt
supabase functions new google-ads-oauth-callback
supabase functions new google-ads-sync
```

#### 4.3 Create OAuth Callback Function

See the implementation files we'll create next!

---

### Step 5: Build OAuth Flow in Frontend

Update the Integrations page to:
1. Show "Connect Google Ads" button
2. Open OAuth popup when clicked
3. Handle callback and store tokens
4. Display connected accounts
5. Show sync status

---

### Step 6: Build Data Sync Function

Create Supabase Edge Function that:
1. Fetches campaigns from Google Ads API
2. Fetches daily metrics
3. Transforms data to match our schema
4. Inserts/updates database records
5. Handles errors and retries

---

### Step 7: Set Up Cron Job

Configure Supabase to run sync every hour:
```sql
SELECT cron.schedule(
  'google-ads-sync-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT net.http_post(
    url:='https://kvaespkemcsvguchfjxt.supabase.co/functions/v1/google-ads-sync',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

---

### Step 8: Update Dashboard with Real Data

Modify dashboard components to:
1. Fetch from `campaigns` and `campaign_daily_metrics` tables
2. Show loading states
3. Handle empty states (no campaigns yet)
4. Add refresh button
5. Display last sync time

---

## 🔍 Testing Checklist

- [ ] Can click "Connect Google Ads" button
- [ ] OAuth popup opens with Google sign-in
- [ ] After auth, returns to dashboard
- [ ] Token stored in `ad_account_connections` table
- [ ] Sync function fetches campaigns successfully
- [ ] Campaigns appear in database
- [ ] Dashboard shows real campaign data
- [ ] Metrics update hourly
- [ ] Can disconnect account
- [ ] Can reconnect account

---

## 🚨 Common Issues & Solutions

### Issue: "Developer token not approved"
**Solution:** Use test mode or wait for approval. Test mode has limited accounts.

### Issue: "OAuth redirect URI mismatch"
**Solution:** Make sure the redirect URI in Google Cloud matches exactly (including trailing slash).

### Issue: "Invalid grant" error
**Solution:** Refresh token expired. User needs to reconnect account.

### Issue: "Quota exceeded"
**Solution:** Google Ads API has rate limits. Implement exponential backoff.

### Issue: "Cannot access campaigns"
**Solution:** User needs manager account access to read campaigns.

---

## 📊 Data Structure

**What we'll sync from Google Ads:**

```typescript
// Campaigns
{
  id: string (UUID)
  external_id: string (Google Ads campaign ID)
  name: string
  platform: 'google_ads'
  status: 'active' | 'paused' | 'completed'
  budget: number
  spent: number
  start_date: Date
  end_date: Date | null
}

// Daily Metrics
{
  campaign_id: UUID
  metric_date: Date
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  ctr: number (computed)
  cpa: number (computed)
  roas: number (computed)
}
```

---

## 🎯 Success Metrics

After Phase 3, you should have:
- ✅ At least 1 Google Ads account connected
- ✅ Real campaign data syncing hourly
- ✅ Dashboard showing live metrics
- ✅ Charts updating with real data
- ✅ Zero errors in sync logs

---

## 📚 Resources

- **Google Ads API Docs:** https://developers.google.com/google-ads/api/docs/start
- **OAuth 2.0 Guide:** https://developers.google.com/identity/protocols/oauth2
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Google Ads API Client:** https://www.npmjs.com/package/google-ads-api

---

## ⏭️ Next Steps

Once Phase 3 is complete, you'll move to:
- **Phase 4:** Facebook/Instagram Ads Integration
- **Phase 5:** GA4 & LinkedIn Ads
- **Phase 6:** Real-time WebSocket updates

---

## 🆘 Need Help?

If you get stuck:
1. Check Google Cloud logs
2. Check Supabase Edge Function logs
3. Check browser console errors
4. Review Google Ads API error codes
5. Ask for help!

Let's build this! 🚀
