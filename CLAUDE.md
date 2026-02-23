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

**TypeScript is strict** — `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` are all enabled. Prefix intentionally unused parameters with `_` (e.g., `_accessToken`).

## Architecture Overview

This is a **multi-tenant SaaS marketing analytics dashboard** for self-storage businesses. It aggregates ad platform data (Google Ads, Facebook Ads, etc.) per organization.

### Auth & Multi-Tenancy

- **Clerk** handles authentication and organizations. The Clerk organization ID is used as `org_id` throughout the database.
- **Supabase** stores all app data. Row-Level Security (RLS) enforces tenant isolation via `public.get_user_org_id()`, a SQL function that looks up `org_id` from the `users` table by matching `clerk_user_id = auth.jwt()->>'sub'`.
- To make authenticated Supabase calls from the frontend (respecting RLS), use `createAuthenticatedClient(clerkToken)` from `src/lib/supabase.ts`. The plain `supabase` client uses the anon key; it works for RLS because Clerk tokens are passed as the Authorization header.
- Supabase Edge Functions bypass RLS using `SUPABASE_SERVICE_ROLE_KEY` (admin client).

### Frontend Stack

- **React 19 + TypeScript** with Vite
- **Path alias**: `@/` → `src/`
- **React Query** (`@tanstack/react-query`) for all data fetching — hooks live in `src/hooks/useApiData.ts`, which call functions in `src/services/api.ts`
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed)
- **Shadcn/ui** for reusable UI primitives (`src/components/ui/`)
- **Recharts** for charts, **@react-pdf/renderer** for PDF export, **lucide-react** for icons

### State Management

- **Auth**: Clerk (global)
- **Organization context**: `src/contexts/OrganizationContext.tsx` — provides `organizationId`, `organizationName`, `userRole`, and `isLoading`. Consumed via `useCurrentOrganization()`. Also exports `useHasPermission(role)` for role-gated UI. Roles map from Clerk (`org:admin`, `org:member`) to app roles (`admin`, `manager`, `viewer`).
- **Theme**: `src/contexts/ThemeContext.tsx` — light/dark toggle
- **Server data**: React Query (30-second stale time, 1 retry, refetch on window focus). Alerts additionally refetch every 60 seconds.

### Data Flow

```
Ad Platform API
    ↓  (Supabase Edge Function)
Supabase DB (campaigns + campaign_daily_metrics)
    ↓  (React Query via src/services/api.ts)
Dashboard pages
```

Pages in `src/pages/` consume React Query hooks. The hooks call `src/services/api.ts`, which queries Supabase tables filtered by `org_id`. All TypeScript interfaces are defined in `src/data/types.ts`.

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
/                           → DashboardLayout shell
  /                         → ExecutiveOverview (KPIs + charts)
  /units                    → UnitPerformance (campaign table)
  /customers                → CustomerAnalytics (conversion funnel)
  /forecast                 → Forecast (predictive analytics)
  /integrations             → Integrations (connect/sync ad accounts)
  /settings                 → Settings (org branding, preferences)
```

### Database Schema (key tables)

| Table | Purpose |
|---|---|
| `organizations` | Tenants; `id` = Clerk org ID |
| `users` | Maps `clerk_user_id` → `org_id` |
| `ad_account_connections` | OAuth tokens per platform per org |
| `campaigns` | Synced campaigns; unique on `(org_id, platform, external_id)` |
| `campaign_daily_metrics` | Daily metrics; unique on `(campaign_id, metric_date)`; `ctr`/`cpa`/`roas` are **`GENERATED ALWAYS AS` computed columns** — never write them manually |
| `performance_alerts` | Auto-generated alerts |
| `conversion_events` | Funnel event tracking |
| `organization_branding` | White-label settings |

`platform` column is constrained to: `google_ads`, `facebook_ads`, `instagram_ads`, `linkedin_ads`, `ga4`.

### Ad Platform Integration Pattern

Each integration follows this pattern:

1. **`src/services/{platform}.ts`** — `initiate{Platform}OAuth(orgId)` opens a popup; `exchangeCodeForTokens(code, orgId, clerkToken)` stores tokens in `ad_account_connections`
2. **`src/pages/auth/OAuthCallback.tsx`** — handles the redirect, reads `state` param (contains `orgId` + `platform`), calls the appropriate token exchange function
3. **`supabase/functions/sync-{platform}/index.ts`** — Deno edge function; refreshes token, fetches campaigns/metrics from the platform API, upserts into `campaigns` and `campaign_daily_metrics`
4. **`src/pages/Integrations.tsx`** — shows connected accounts and triggers sync via `supabase.functions.invoke('sync-{platform}', ...)`

Currently implemented: **Google Ads** (OAuth complete, sync via edge function).

### Supabase Edge Functions

- Located in `supabase/functions/`
- Written in **Deno TypeScript** (import from `https://esm.sh/`)
- Use `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars (set in Supabase dashboard)
- Platform API credentials are also set as Supabase secrets (not `VITE_` prefixed)
- Deploy with: `supabase functions deploy {function-name}`

### Deployment

- **Frontend**: Railway — runs `npm run build` then `npm run start` (serves `dist/` with `serve`)
- **Database + Edge Functions**: Supabase
- Production URL: `https://self-storage-analytics-dashboard-production.up.railway.app`
- Environment variables are prefixed `VITE_` for frontend access; Edge Functions use unprefixed secrets

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
# Facebook (Phase 4):
VITE_FACEBOOK_ADS_APP_ID=
VITE_FACEBOOK_ADS_APP_SECRET=
VITE_FACEBOOK_ADS_REDIRECT_URI=http://localhost:5175/integrations/callback
```
