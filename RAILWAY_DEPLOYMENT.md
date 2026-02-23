# Railway Deployment Guide

## 🚀 Quick Deploy Steps

### 1. Configure Environment Variables in Railway

**CRITICAL:** Your app needs these environment variables to work on Railway!

1. Go to your Railway project dashboard
2. Click on your service
3. Go to **"Variables"** tab
4. Click **"+ New Variable"** and add each of these:

```bash
# Clerk Authentication (REQUIRED)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_aW52aXRpbmctcGVuZ3Vpbi00Mi5jbGVyay5hY2NvdW50cy5kZXYk

# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://kvaespkemcsvguchfjxt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2YWVzcGtlbWNzdmd1Y2hmanh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODcwNDAsImV4cCI6MjA4NjU2MzA0MH0.REG-i8NjpTqEEAgdnDvOJM_P338dqHfIPTWK828OF48

# API Configuration (REQUIRED)
VITE_API_BASE_URL=https://kvaespkemcsvguchfjxt.supabase.co/functions/v1
VITE_ENVIRONMENT=production

# Optional (for later phases)
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_SENTRY_DSN=
```

### 2. Add Allowed Origins in Clerk

Your Railway domain needs to be whitelisted in Clerk:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your app
3. Go to **"Domains"** (or "Settings" → "Home URL")
4. Add your Railway URL:
   - Example: `https://your-app.up.railway.app`
5. Also add to **"Allowed redirect URLs"**:
   - `https://your-app.up.railway.app/*`

### 3. Add Allowed Origins in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/kvaespkemcsvguchfjxt)
2. Go to **"Authentication"** → **"URL Configuration"**
3. Add your Railway URL to **"Site URL"**:
   - `https://your-app.up.railway.app`
4. Add to **"Redirect URLs"**:
   - `https://your-app.up.railway.app/**`

### 4. Redeploy

After adding environment variables:
1. Go to your Railway project
2. Click **"Deployments"**
3. Click **"Redeploy"** on the latest deployment
4. OR push a new commit to trigger deployment

---

## 🔍 Troubleshooting

### Healthcheck Failing (Service Unavailable)

**Cause:** App not binding to correct port or host

**Fix:**
- Make sure `package.json` has: `"preview": "vite preview --port ${PORT:-4173} --host 0.0.0.0"`
- Make sure environment variables are set in Railway

### "Missing Clerk Publishable Key" Error

**Cause:** Environment variables not set in Railway

**Fix:**
- Add all VITE_* variables in Railway Variables tab
- Redeploy after adding

### Clerk Authentication Not Working

**Cause:** Railway domain not whitelisted in Clerk

**Fix:**
- Add Railway URL to Clerk allowed domains
- Add to redirect URLs

### Database Connection Errors

**Cause:** Supabase URL or key incorrect, or CORS issue

**Fix:**
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct
- Add Railway URL to Supabase allowed origins

### Build Succeeds but App Won't Start

**Cause:** Preview server not starting correctly

**Fix:**
- Check Railway logs for errors
- Verify `npm run preview` works locally
- Make sure PORT is being used correctly

---

## 📊 Railway Deployment Checklist

- [ ] Environment variables added in Railway
- [ ] Railway URL added to Clerk allowed domains
- [ ] Railway URL added to Supabase allowed origins
- [ ] Code committed and pushed to GitHub
- [ ] Deployment triggered in Railway
- [ ] Healthcheck passing
- [ ] Can access app at Railway URL
- [ ] Can sign in with Clerk
- [ ] Database queries working

---

## 🎯 After Successful Deployment

Your app will be live at: `https://your-project-name.up.railway.app`

Test these features:
1. Sign up for an account
2. Create an organization
3. See the dashboard
4. Toggle dark/light theme
5. Navigate between pages
6. Export PDF report

---

## 💰 Railway Costs

**Free Tier:**
- $5 credit per month
- Good for development/testing
- Sleeps after inactivity

**Paid Plans:**
- Start at $5/month
- No sleep mode
- Better performance
- Custom domains

---

## 🔄 Continuous Deployment

Railway auto-deploys when you push to your GitHub repo:

```bash
git add .
git commit -m "your changes"
git push
```

Railway will automatically:
1. Pull latest code
2. Run build
3. Deploy new version
4. Run healthcheck
5. Switch traffic to new version

---

## 📝 Common Commands

**View logs:**
- Go to Railway dashboard → Deployments → Click deployment → Logs

**Restart service:**
- Railway dashboard → Service → Settings → Restart

**Change domain:**
- Railway dashboard → Service → Settings → Domains

**Scale up:**
- Railway dashboard → Service → Settings → Resources

---

## 🆘 Still Having Issues?

Check:
1. Railway deployment logs
2. Browser console (F12) when visiting the app
3. Clerk dashboard for auth errors
4. Supabase logs for database errors

**Common issues:**
- Environment variables not set correctly
- Domains not whitelisted
- CORS errors
- Port binding issues
