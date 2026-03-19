# Backup & Disaster Recovery Plan

## Overview

AdInsights uses a managed infrastructure stack (Supabase + Railway) that provides built-in redundancy. This document outlines the backup strategy, recovery procedures, and responsible parties.

## Infrastructure Components

| Component | Provider | Backup Mechanism |
|---|---|---|
| Database (PostgreSQL) | Supabase | Automatic daily backups (Pro plan: 7-day retention, point-in-time recovery) |
| Edge Functions | Supabase | Source code in `supabase/functions/` — deployed from git |
| Frontend | Railway | Stateless — rebuilt from git on every deploy |
| Auth & Users | Clerk | Managed by Clerk — data export available via Clerk Dashboard |
| Payments | Stripe | Managed by Stripe — full history in Stripe Dashboard |
| Secrets | Supabase / Railway | Not backed up automatically — documented in CLAUDE.md |

## Database Backups

### Automatic (Supabase-managed)

- **Frequency**: Daily
- **Retention**: 7 days (Pro plan) / 30 days (Team plan)
- **Point-in-time recovery**: Available on Pro plan — restore to any second within the retention window
- **Location**: Supabase infrastructure (same region as project)

### Manual Export

Run these periodically or before major migrations:

```bash
# Export full database via Supabase CLI
npx supabase db dump -f backup_$(date +%Y%m%d).sql --project-ref kvaespkemcsvguchfjxt

# Export specific tables
npx supabase db dump -f orgs_backup.sql --project-ref kvaespkemcsvguchfjxt --data-only --table organizations
npx supabase db dump -f metrics_backup.sql --project-ref kvaespkemcsvguchfjxt --data-only --table campaign_daily_metrics
```

### Key Tables to Protect

| Table | Priority | Notes |
|---|---|---|
| `organizations` | Critical | Tenant data, billing state, trial dates |
| `users` | Critical | Clerk-to-org mapping |
| `ad_account_connections` | Critical | OAuth tokens (encrypted) |
| `campaigns` | High | Can be re-synced from ad platforms |
| `campaign_daily_metrics` | High | Can be re-synced but slow for large date ranges |
| `performance_alerts` | Medium | Auto-generated, can be recreated |
| `sync_schedules` | Medium | User configuration |
| `organization_branding` | Low | White-label settings |

## Recovery Procedures

### Scenario 1: Database corruption or accidental data deletion

1. Go to Supabase Dashboard → Project → Database → Backups
2. Select the most recent backup before the incident
3. Click "Restore" (this replaces the current database)
4. Verify the app functions correctly
5. If point-in-time recovery is needed, contact Supabase support

### Scenario 2: Edge Function failure

1. Edge Functions are stateless — redeploy from git:
   ```bash
   npx supabase link --project-ref kvaespkemcsvguchfjxt
   npx supabase functions deploy sync-google-ads
   npx supabase functions deploy sync-ga4
   npx supabase functions deploy sync-linkedin
   npx supabase functions deploy ai-insights
   npx supabase functions deploy create-checkout-session
   npx supabase functions deploy create-billing-portal
   npx supabase functions deploy stripe-webhook --no-verify-jwt
   npx supabase functions deploy scheduled-sync
   npx supabase functions deploy send-alert-emails
   ```
2. Re-set secrets if needed:
   ```bash
   npx supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... [etc]
   ```

### Scenario 3: Frontend deployment failure

1. Railway auto-deploys from git — push a fix or roll back:
   ```bash
   # Rollback to previous commit
   git revert HEAD
   git push origin dev
   ```
2. Or use Railway Dashboard → Deployments → click "Rollback" on a previous successful deploy

### Scenario 4: Complete infrastructure loss

1. **Database**: Restore from Supabase backup or manual SQL dump
2. **Edge Functions**: Redeploy from git (all source is in `supabase/functions/`)
3. **Frontend**: Redeploy from git to Railway (or any static host)
4. **Auth**: Clerk manages its own infrastructure — no action needed
5. **Payments**: Stripe manages its own infrastructure — webhook endpoint may need re-registration
6. **Secrets**: Re-create from documented env vars in CLAUDE.md

## Secrets Inventory

Secrets are NOT stored in git. They must be re-created manually if lost:

**Supabase secrets** (set via `npx supabase secrets set`):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PROFESSIONAL`, `STRIPE_PRICE_AGENCY`
- `STRIPE_PRICE_STARTER_ANNUAL`, `STRIPE_PRICE_PROFESSIONAL_ANNUAL`, `STRIPE_PRICE_AGENCY_ANNUAL`
- `FRONTEND_URL`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `ALERT_FROM_EMAIL`
- `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`

**Railway env vars** (set in Railway Dashboard):
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_ADS_CLIENT_ID`, `VITE_GOOGLE_ADS_CLIENT_SECRET`, `VITE_GOOGLE_ADS_DEVELOPER_TOKEN`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_STARTER`, `VITE_STRIPE_PRICE_PROFESSIONAL`, `VITE_STRIPE_PRICE_AGENCY`
- `VITE_STRIPE_PRICE_STARTER_ANNUAL`, `VITE_STRIPE_PRICE_PROFESSIONAL_ANNUAL`, `VITE_STRIPE_PRICE_AGENCY_ANNUAL`

## Monitoring & Alerts

- **Supabase Dashboard**: Database health, edge function logs, API usage
- **Railway Dashboard**: Deploy status, resource usage
- **Stripe Dashboard**: Payment failures, webhook delivery status
- **Clerk Dashboard**: Auth errors, user activity

## Testing Recovery

Quarterly:
1. Export a manual database backup
2. Verify the backup can be restored to a test project
3. Confirm edge functions deploy cleanly from the current git branch
4. Review secrets inventory for completeness
