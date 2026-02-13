# Marketing Analytics Dashboard - SaaS Platform

A comprehensive multi-tenant SaaS platform for marketing agencies to manage and analyze advertising campaigns across multiple platforms.

## 🎯 Project Overview

This platform enables marketing agencies to:
- **Manage multiple client accounts** with organization-based multi-tenancy
- **Connect advertising platforms** - Google Ads, Facebook/Instagram, GA4, LinkedIn
- **Track campaign performance** in real-time with automated data sync
- **Visualize metrics** with interactive charts and dashboards
- **Generate reports** with PDF export capabilities
- **White-label the platform** with custom branding

### Target Market
- Marketing agencies managing 5-20 client accounts
- Monthly subscription pricing ($199-$999/month)
- Tiered plans: Starter, Professional, Agency

## ✨ Current Status

### ✅ Implemented (Phases 1-2)
- **Authentication**: Full Clerk integration with organization support
- **Multi-Tenancy**: Organization-based data isolation with RLS
- **Database**: Complete PostgreSQL schema on Supabase
- **API Layer**: React Query hooks for data fetching
- **UI Foundation**: Protected routes, navigation, theme support

### 🚧 In Progress
- **Phase 3**: Google Ads integration (OAuth + data sync)
- See `IMPLEMENTATION_STATUS.md` for detailed progress

## 🛠️ Tech Stack

**Frontend**
- React 19.2 + TypeScript
- Vite 7.2.4 (build tool)
- React Router DOM 7.12
- Tailwind CSS 4.1.18
- Recharts 3.6.0 (charts)
- React Query (data fetching & caching)

**Backend & Infrastructure**
- Clerk (authentication & organizations)
- Supabase (PostgreSQL + Edge Functions + Realtime)
- Stripe (subscriptions - Phase 7)

**API Integrations** (Planned)
- Google Ads API
- Facebook Marketing API
- Google Analytics 4 API
- LinkedIn Ads API

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Clerk account (free tier)
- Supabase account (free tier)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd self-storage-analytics-dashboard
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your keys in `.env.local`:
   - `VITE_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
   - `VITE_SUPABASE_URL` - From Supabase dashboard
   - `VITE_SUPABASE_ANON_KEY` - From Supabase dashboard

3. **Set up Clerk**
   - Create an application at [clerk.com](https://dashboard.clerk.com)
   - Enable Organizations feature
   - Copy your publishable key to `.env.local`
   - See `SETUP.md` for detailed instructions

4. **Set up Supabase**
   - Create a project at [supabase.com](https://supabase.com/dashboard)
   - Run the migration: Copy contents of `supabase/migrations/001_initial_schema.sql` and run in SQL Editor
   - Copy project URL and anon key to `.env.local`
   - See `SETUP.md` for detailed instructions

5. **Start development server**
   ```bash
   npm run dev
   ```

   Navigate to `http://localhost:5173`

## 📖 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup guide for Clerk and Supabase
- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - Current progress and roadmap
- **Implementation Plan** - See `.claude/` directory for full plan

## 🏗️ Architecture

### Multi-Tenancy Model
- **Pattern**: Pooled schema with tenant IDs (`org_id`)
- **Isolation**: PostgreSQL Row-Level Security (RLS)
- **Auth Flow**: User → Clerk → JWT → Supabase → RLS policies

### Security
- All database tables have RLS enabled
- Policies automatically filter data by organization
- No cross-tenant data access possible
- Usage limits enforced at database level

### Data Flow
```
User Login (Clerk)
    ↓
JWT with user_id
    ↓
Supabase Client
    ↓
RLS Policies (filter by org_id)
    ↓
React Query (caching)
    ↓
React Components
```

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── layout/        # Header, Sidebar, DashboardLayout
│   ├── cards/         # KPI cards, Alert cards
│   ├── charts/        # Recharts wrappers
│   ├── reports/       # PDF export components
│   └── ui/            # Reusable UI components
├── contexts/
│   ├── OrganizationContext.tsx  # Multi-tenancy context
│   └── ThemeContext.tsx         # Dark/light theme
├── hooks/
│   └── useApiData.ts  # React Query hooks
├── lib/
│   └── supabase.ts    # Supabase client
├── pages/
│   ├── auth/          # Sign in/up, Create org
│   ├── ExecutiveOverview.tsx
│   ├── UnitPerformance.tsx
│   ├── CustomerAnalytics.tsx
│   ├── Forecast.tsx
│   ├── Integrations.tsx
│   └── Settings.tsx
├── services/
│   └── api.ts         # API service layer
└── data/
    ├── types.ts       # TypeScript types
    └── mockData.backup.ts  # Archived mock data

supabase/
└── migrations/
    └── 001_initial_schema.sql  # Database schema

```

## 🎨 Features

### Current Features
- ✅ User authentication with email/OAuth
- ✅ Organization creation and management
- ✅ Organization switching
- ✅ Protected routes
- ✅ Dark/light theme toggle
- ✅ Responsive design (mobile-friendly)
- ✅ Multi-tenant database with RLS
- ✅ PDF report generation

### Planned Features (Phases 3-8)
- 🔄 Google Ads integration
- 🔄 Facebook/Instagram Ads integration
- 🔄 GA4 conversion tracking
- 🔄 LinkedIn Ads integration
- 🔄 Real-time data updates via WebSockets
- 🔄 Performance alerts and anomaly detection
- 🔄 White-label branding
- 🔄 Stripe subscription billing
- 🔄 Multi-touch attribution
- 🔄 Automated campaign optimization suggestions

## 🧪 Development

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Testing (Phase 8)

Testing infrastructure will be added in Phase 8:
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright

## 🚢 Deployment

Deployment will be configured in Phase 8:
- Platform: Vercel
- CI/CD: GitHub Actions
- Custom domain support
- Environment variables managed via Vercel dashboard

## 📊 Database Schema

See `supabase/migrations/001_initial_schema.sql` for complete schema.

**Core Tables**:
- `organizations` - Tenant organizations (agencies)
- `users` - User accounts linked to Clerk
- `ad_account_connections` - Connected ad platforms
- `campaigns` - Advertising campaigns
- `campaign_daily_metrics` - Daily performance data
- `performance_alerts` - Automated alerts
- `conversion_events` - Conversion funnel tracking
- `organization_branding` - White-label settings

## 🤝 Contributing

This is a private project currently in active development.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For setup issues:
1. Check `SETUP.md` for detailed instructions
2. Review `IMPLEMENTATION_STATUS.md` for current state
3. Check Supabase dashboard logs
4. Check browser console for errors

## 🗺️ Roadmap

- [x] Phase 1: Authentication & Multi-Tenancy
- [x] Phase 2: Supabase Backend Setup
- [ ] Phase 3: Google Ads Integration (In Progress)
- [ ] Phase 4: Facebook/Instagram Ads
- [ ] Phase 5: GA4 & LinkedIn Ads
- [ ] Phase 6: Real-Time Features
- [ ] Phase 7: White-Label & Subscriptions
- [ ] Phase 8: Production Hardening

**Estimated Completion**: 6-8 weeks remaining

---

**Built with** ⚡ Vite + ⚛️ React + 🔐 Clerk + 🗄️ Supabase
