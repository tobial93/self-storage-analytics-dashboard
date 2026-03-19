# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start local dev server (Vite, typically port 5173–5175)
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint on all .ts/.tsx files
npm run preview    # Serve the built dist/ locally
npm run start      # Serve dist/ with `serve` (used by Railway in production)
```

There are no tests in this project.

**TypeScript is strict** — `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` are all enabled. Prefix intentionally unused parameters with `_` (e.g., `_accessToken`). Always use `import type` for type-only imports.

### Supabase Edge Function Deployment

```bash
npx supabase functions deploy {function-name}

# stripe-webhook MUST be deployed with JWT verification disabled:
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

The project has no `supabase/config.toml` (not linked via CLI). Use `npx supabase link --project-ref kvaespkemcsvguchfjxt` first, or run migrations manually in the Supabase SQL editor.

## Architecture Overview

This is a **multi-tenant SaaS ad spend analytics dashboard** (branded as **MetricFlow**). It aggregates ad platform data (Google Ads, Facebook Ads, GA4, LinkedIn) per organization, with Stripe subscription billing and a guided onboarding flow.

### Auth & Multi-Tenancy

- **Clerk** handles authentication and organizations. The Clerk organization ID is used as `org_id` throughout the database.
- **Supabase** stores all app data. RLS enforces tenant isolation via `public.current_user_org_id()` — a `SECURITY DEFINER` SQL function that looks up `org_id` from the `users` table by matching `clerk_user_id = auth.jwt()->>'sub'`.
- The plain `supabase` client (anon key, `src/lib/supabase.ts`) is used for nearly all frontend queries — RLS is enforced via the Clerk JWT passed in the Authorization header. Use `createAuthenticatedClient(clerkToken)` only when you need to explicitly pass a fresh Clerk token (e.g., OAuth token exchange flows). `setSupabaseAuth` is a no-op stub kept for compatibility.
- Edge Functions bypass RLS using `SUPABASE_SERVICE_ROLE_KEY` (admin client).

### Frontend Stack

- **React 19 + TypeScript** with Vite
- **Path alias**: `@/` → `src/`
- **React Query** (`@tanstack/react-query`) for all data fetching — hooks live in `src/hooks/useApiData.ts`, which call functions in `src/services/api.ts`
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed)
- **Shadcn/ui** for reusable UI primitives (`src/components/ui/`)
- **Recharts** for charts, **@react-pdf/renderer** for PDF export, **lucide-react** for icons, **date-fns** for date formatting

### State Management

- **Auth**: Clerk (global)
- **Organization context**: `src/contexts/OrganizationContext.tsx` — provides `organizationId`, `organizationName`, `organizationSlug`, `userRole`, `isLoading`, `subscriptionTier`, `onboardingCompleted`, and `refetchOrgData`. Consumed via `useCurrentOrganization()`. `useHasPermission(role)` for role-gated UI. Roles map from Clerk (`org:admin`, `org:member`) to app roles (`admin`, `manager`, `viewer`).
  - `onboardingCompleted === null` means still loading from DB. `=== false` means redirect to `/onboarding`. Use strict equality — `!onboardingCompleted` is wrong because null is also falsy.
- **Theme**: `src/contexts/ThemeContext.tsx` — light/dark toggle
- **Server data**: React Query (30-second stale time, 1 retry, refetch on window focus). Alerts additionally refetch every 60 seconds.
- **No toast library** — use inline `useState` for loading/error/success feedback throughout.

### Data Flow

```
Ad Platform API
    ↓  (Supabase Edge Function)
Supabase DB (campaigns + campaign_daily_metrics)
    ↓  (React Query via src/services/api.ts)
Dashboard pages
```

Pages in `src/pages/` consume React Query hooks. The hooks call `src/services/api.ts`, which queries Supabase tables filtered by `org_id`. All TypeScript interfaces are in `src/data/types.ts`.

### React Query Hook Pattern

All hooks in `src/hooks/useApiData.ts` follow this pattern — they auto-inject `organizationId` from context and disable when org is not yet loaded:

```typescript
export function useCampaigns() {
  const { organizationId } = useCurrentOrganization()
  return useQuery({
    queryKey: ['campaigns', organizationId],
    queryFn: () => api.getCampaigns(organizationId!),
    enabled: !!organizationId,
  })
}

// Mutations invalidate related query keys:
onSuccess: () => queryClient.invalidateQueries({ queryKey: ['active-alerts', organizationId] })
```

### Route Structure

```
/sign-in, /sign-up          → Public (Clerk hosted UI)
/create-organization        → Protected, no org required
/integrations/callback      → OAuth redirect handler (OAuthCallback.tsx)
/onboarding                 → 4-step onboarding wizard (outside DashboardLayout)
/                           → DashboardLayout shell (redirects to /onboarding if not completed)
  /                         → ExecutiveOverview (KPIs + charts)
  /units                    → UnitPerformance (campaign table)
  /customers                → CustomerAnalytics (conversion funnel)
  /forecast                 → Forecast (predictive analytics)
  /integrations             → Integrations (connect/sync ad accounts)
  /settings                 → Settings (billing, sync scheduling, branding)
```

`/onboarding` must remain **outside** `DashboardLayout` in `App.tsx` to prevent a redirect loop.

### Database Schema (key tables)

| Table | Purpose |
|---|---|
| `organizations` | Tenants; `id` = Clerk org ID; has `stripe_customer_id`, `stripe_subscription_id`, `subscription_tier` CHECK(`free`\|`starter`\|`professional`\|`agency`), `onboarding_completed` |
| `users` | Maps `clerk_user_id` → `org_id` |
| `ad_account_connections` | OAuth tokens per platform per org |
| `campaigns` | Synced campaigns; unique on `(org_id, platform, external_id)` |
| `campaign_daily_metrics` | Daily metrics; unique on `(campaign_id, metric_date)`; `ctr`/`cpa`/`roas` are **`GENERATED ALWAYS AS` computed columns** — never write them manually |
| `performance_alerts` | Auto-generated alerts |
| `conversion_events` | Funnel event tracking |
| `organization_branding` | White-label settings |
| `sync_schedules` | Per-org, per-platform sync frequency; unique on `(org_id, platform)`; `frequency` CHECK(`hourly`\|`every_6h`\|`daily`) |

`platform` column is constrained to: `google_ads`, `facebook_ads`, `instagram_ads`, `linkedin_ads`, `ga4`.

### Ad Platform Integration Pattern

Each integration follows this pattern:

1. **`src/services/{platform}.ts`** — `initiate{Platform}OAuth(orgId)` opens a popup; `exchangeCodeForTokens(code, orgId, clerkToken)` stores tokens in `ad_account_connections`
2. **`src/pages/auth/OAuthCallback.tsx`** — handles the redirect, reads `state` param (contains `orgId` + `platform`), calls the appropriate token exchange function
3. **`supabase/functions/sync-{platform}/index.ts`** — Deno edge function; refreshes token, fetches campaigns/metrics from the platform API, upserts into `campaigns` and `campaign_daily_metrics`
4. **`src/pages/Integrations.tsx`** — shows connected accounts and triggers sync via `supabase.functions.invoke('sync-{platform}', ...)`

Implemented: **Google Ads** (OAuth + edge function), **Facebook Ads** (mock/demo data), **GA4** (OAuth + edge function), **LinkedIn Ads** (OAuth + edge function).

### Supabase Edge Functions

Located in `supabase/functions/`. Written in **Deno TypeScript** (import from `https://esm.sh/`). Use `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars.

| Function | Purpose | Notes |
|---|---|---|
| `sync-google-ads` | Sync Google Ads campaigns/metrics | |
| `sync-ga4` | Sync GA4 conversion events | |
| `sync-linkedin` | Sync LinkedIn Ads campaigns | |
| `create-checkout-session` | Create Stripe Checkout session | |
| `create-billing-portal` | Open Stripe Customer Portal | |
| `stripe-webhook` | Handle Stripe subscription events → update `subscription_tier` | Deploy with `--no-verify-jwt` |
| `scheduled-sync` | Hourly cron + HTTP; runs due `sync_schedules` rows | `Deno.cron('0 * * * *', ...)` |
| `ai-insights` | Claude-powered campaign analysis | Requires `ANTHROPIC_API_KEY` secret |
| `send-alert-emails` | Email delivery for unresolved alerts | Requires `RESEND_API_KEY` + `ALERT_FROM_EMAIL` secrets |

### Stripe Billing

- Tiers: `free` (default), `starter` ($49), `professional` ($99), `agency` ($249)
- Frontend triggers `create-checkout-session` edge function → redirects `window.location.href = url`
- Webhook maps price IDs to tiers via env vars `STRIPE_PRICE_STARTER/PROFESSIONAL/AGENCY`
- `stripe-webhook` **must** be deployed with `--no-verify-jwt` (Stripe sends its own signature, not a Clerk JWT)
- Billing status communicated via `?billing=success|cancelled` query params (no toast library)

### Deployment

- **Frontend**: Railway — runs `npm run build` then `npm run start` (serves `dist/` with `serve`)
- **Database + Edge Functions**: Supabase (project ref: `kvaespkemcsvguchfjxt`)
- Production URL: `https://self-storage-analytics-dashboard-production.up.railway.app`
- Frontend env vars are prefixed `VITE_`; Edge Function secrets are unprefixed (set via `supabase secrets set`)

## Environment Variables

Required in `.env.local`:

```bash
VITE_CLERK_PUBLISHABLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_ADS_CLIENT_ID=
VITE_GOOGLE_ADS_CLIENT_SECRET=
VITE_GOOGLE_ADS_DEVELOPER_TOKEN=
VITE_GOOGLE_ADS_REDIRECT_URI=http://localhost:5175/integrations/callback
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_STRIPE_PRICE_STARTER=
VITE_STRIPE_PRICE_PROFESSIONAL=
VITE_STRIPE_PRICE_AGENCY=
VITE_STRIPE_PRICE_STARTER_ANNUAL=
VITE_STRIPE_PRICE_PROFESSIONAL_ANNUAL=
VITE_STRIPE_PRICE_AGENCY_ANNUAL=
```

Required Supabase secrets (set via `supabase secrets set`):

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER=
STRIPE_PRICE_PROFESSIONAL=
STRIPE_PRICE_AGENCY=
STRIPE_PRICE_STARTER_ANNUAL=
STRIPE_PRICE_PROFESSIONAL_ANNUAL=
STRIPE_PRICE_AGENCY_ANNUAL=
FRONTEND_URL=https://self-storage-analytics-dashboard-production.up.railway.app
ANTHROPIC_API_KEY=
RESEND_API_KEY=
ALERT_FROM_EMAIL=alerts@yourdomain.com
```
