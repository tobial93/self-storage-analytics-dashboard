import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  ArrowRight,
  Zap,
  LineChart,
  Sparkles,
  Bell,
  FileText,
  Clock,
  Check,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

/* ── Data ─────────────────────────────────────────────────────────── */

const features = [
  { icon: Zap, title: 'Multi-Platform Sync', desc: 'Connect Google Ads, Facebook, GA4, and LinkedIn in one dashboard. Data syncs automatically.' },
  { icon: LineChart, title: 'Revenue Forecasting', desc: 'See 14-day revenue projections based on your actual campaign performance trends.' },
  { icon: Sparkles, title: 'AI-Powered Insights', desc: 'Get automated analysis of campaign performance with actionable recommendations powered by Claude.' },
  { icon: Bell, title: 'Automated Alerts', desc: 'Get notified when campaigns underperform — spend spikes, CTR drops, or CPA exceeds thresholds.' },
  { icon: FileText, title: 'PDF Reports', desc: 'Export branded performance reports for stakeholders or clients with one click.' },
  { icon: Clock, title: 'Scheduled Syncs', desc: 'Set hourly, 6-hour, or daily sync cadence per platform. Data stays fresh without manual pulls.' },
]

const plans = [
  {
    name: 'Free',
    monthly: '$0',
    annual: '$0',
    cta: 'Get Started',
    href: '/sign-up',
    bullets: ['1 ad platform connection', '30-day data retention', 'Manual sync only', 'Community support'],
  },
  {
    name: 'Starter',
    monthly: '$49',
    annual: '$39',
    cta: 'Start Free Trial',
    href: '/sign-up',
    bullets: ['3 ad platform connections', '90-day data retention', 'Daily automated syncs', 'Email support'],
  },
  {
    name: 'Professional',
    monthly: '$99',
    annual: '$79',
    cta: 'Start Free Trial',
    href: '/sign-up',
    featured: true,
    bullets: ['Unlimited connections', '1-year data retention', 'Hourly syncs', 'Performance alerts', 'AI-powered insights', 'PDF report export'],
  },
  {
    name: 'Agency',
    monthly: '$249',
    annual: '$199',
    cta: 'Contact Sales',
    href: '/sign-up',
    bullets: ['Everything in Professional', 'White-label branding', 'Multi-org management', 'Priority support'],
  },
]

const steps = [
  { num: '1', title: 'Connect', desc: 'Link your Google Ads, Facebook, or LinkedIn account in a few clicks.' },
  { num: '2', title: 'Sync', desc: 'Data pulls in automatically on the schedule you choose.' },
  { num: '3', title: 'Analyze', desc: 'See unified KPIs, AI insights, and revenue forecasts instantly.' },
]

const faqs = [
  { q: 'Which ad platforms do you support?', a: 'Google Ads, Facebook Ads, GA4, and LinkedIn Ads. Connect in minutes with OAuth — no API keys or manual setup required.' },
  { q: 'How does data syncing work?', a: 'Once connected, we pull campaign metrics on your configured schedule — hourly, every 6 hours, or daily. You can also trigger a manual sync at any time.' },
  { q: 'Is my data secure?', a: 'Each organization\'s data is isolated with row-level security. We never share data between tenants, and all connections use encrypted OAuth tokens.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Manage your subscription through the billing portal. Downgrade to the Free tier at any time with no cancellation fees.' },
  { q: 'Do you offer a free trial?', a: 'The Free tier is available indefinitely with one connection. Paid plans include a trial period so you can evaluate before committing.' },
]

/* ── Mockup chart data (static SVG path for the hero preview) ───── */

const mockKpis = [
  { label: 'Total Ad Spend', value: '$12,408' },
  { label: 'ROAS', value: '4.12x' },
  { label: 'Conversions', value: '142' },
  { label: 'CPA', value: '$87.38' },
]

const mockTrendData = [
  { date: 'Mar 1', revenue: 2100, spend: 820 },
  { date: 'Mar 3', revenue: 2400, spend: 780 },
  { date: 'Mar 5', revenue: 1900, spend: 850 },
  { date: 'Mar 7', revenue: 2800, spend: 900 },
  { date: 'Mar 9', revenue: 3100, spend: 870 },
  { date: 'Mar 11', revenue: 2600, spend: 920 },
  { date: 'Mar 13', revenue: 3400, spend: 880 },
  { date: 'Mar 15', revenue: 3800, spend: 950 },
  { date: 'Mar 17', revenue: 3200, spend: 910 },
  { date: 'Mar 19', revenue: 4100, spend: 980 },
  { date: 'Mar 21', revenue: 3900, spend: 940 },
  { date: 'Mar 23', revenue: 4500, spend: 1020 },
]

const mockCampaignSpend = [
  { name: '10x10 Units', value: 3200 },
  { name: '5x5 Climate', value: 2800 },
  { name: 'Vehicle Storage', value: 2100 },
  { name: 'First Month Free', value: 1900 },
  { name: 'Business Storage', value: 1400 },
]

const PIE_COLORS = ['#00d4aa', '#ff6b9d', '#f5a623', '#00a3cc', '#a78bfa']

/* ── Component ────────────────────────────────────────────────────── */

export function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [annual, setAnnual] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">AdInsights</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. Hero with dashboard preview */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            Marketing analytics for self-storage businesses
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-lg">
            Aggregate ad platform data, track conversions, and forecast revenue — all in one place. Built for operators managing Google Ads, Facebook, GA4, and LinkedIn campaigns.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Link
              to="/sign-up"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="hidden md:block mt-12">
          <div className="border border-border rounded-lg overflow-hidden shadow-lg">
            {/* Browser chrome */}
            <div className="bg-muted/50 px-4 py-2.5 flex items-center gap-2 border-b border-border">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
              <div className="ml-3 text-[10px] text-muted-foreground/50 bg-muted/80 rounded px-2 py-0.5 flex-1 max-w-xs">
                app.adinsights.io/dashboard
              </div>
            </div>
            {/* Mock dashboard content */}
            <div className="bg-background/80 p-6">
              {/* KPI row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {mockKpis.map((kpi) => (
                  <div key={kpi.label} className="border border-border rounded-md p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-lg font-semibold mt-1">{kpi.value}</p>
                  </div>
                ))}
              </div>
              {/* Mock charts — mirroring dashboard layout */}
              <div className="grid grid-cols-3 gap-4">
                {/* Revenue vs Ad Spend line chart */}
                <div className="col-span-2 border border-border rounded-md p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Revenue vs Ad Spend</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <RechartsLineChart data={mockTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }} />
                      <YAxis tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 10 }}
                        formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString()}`, undefined]}
                      />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#00d4aa" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="spend" name="Ad Spend" stroke="#ff6b9d" strokeWidth={2} dot={false} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
                {/* Spend by Campaign pie chart */}
                <div className="border border-border rounded-md p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Spend by Campaign</p>
                  <ResponsiveContainer width="100%" height={155}>
                    <PieChart>
                      <Pie
                        data={mockCampaignSpend}
                        cx="50%"
                        cy="50%"
                        outerRadius={55}
                        dataKey="value"
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        style={{ fontSize: 8 }}
                      >
                        {mockCampaignSpend.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 10 }}
                        formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString()}`, undefined]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Social proof bar */}
      <div className="border-t border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span>4 platforms supported</span>
          <span className="text-border">·</span>
          <span>Automated daily syncs</span>
          <span className="text-border">·</span>
          <span>Row-level data security</span>
          <span className="text-border">·</span>
          <span>No credit card required</span>
        </div>
      </div>

      {/* 2 & 3. Features — 6 cards, 3-column grid */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title}>
                <f.icon className="h-5 w-5 text-primary mb-3" />
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How it works */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <p className="text-lg font-semibold mb-10">How it works</p>
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {steps.map((s, i) => (
              <>
                <div key={s.num} className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full border border-primary flex items-center justify-center text-sm font-medium text-primary shrink-0">
                    {s.num}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Pricing — expanded bullet lists */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-6">
            <p className="text-lg font-semibold">Pricing</p>
            <div className="flex items-center gap-2 text-sm">
              <span className={annual ? 'text-muted-foreground' : 'font-medium'}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-10 h-5 rounded-full transition-colors ${annual ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${annual ? 'translate-x-5' : ''}`} />
              </button>
              <span className={annual ? 'font-medium' : 'text-muted-foreground'}>
                Annual <span className="text-primary text-xs">save 20%</span>
              </span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`border rounded-lg p-4 flex flex-col ${plan.featured ? 'border-primary' : ''}`}
              >
                <p className="text-sm font-medium">{plan.name}</p>
                <p className="text-2xl font-semibold mt-2">
                  {annual ? plan.annual : plan.monthly}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </p>
                {annual && plan.name !== 'Free' && (
                  <p className="text-xs text-primary mt-0.5">
                    billed annually ({annual ? `${parseInt(plan.annual.replace('$', '')) * 12}` : ''}/yr)
                  </p>
                )}
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={`mt-4 block text-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                    plan.featured
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border hover:bg-muted'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <p className="text-lg font-semibold mb-6">Frequently asked questions</p>
          <div className="max-w-2xl">
            {faqs.map((faq, i) => (
              <div key={i} className={i < faqs.length - 1 ? 'border-b border-border' : ''}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="text-sm font-medium pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <p className="text-sm text-muted-foreground pb-4 -mt-1">{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Bottom CTA */}
      <section className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <p className="text-2xl font-semibold">Ready to optimize your ad spend?</p>
          <p className="text-sm text-muted-foreground mt-2">Start with the free plan — no credit card required.</p>
          <Link
            to="/sign-up"
            className="inline-flex items-center gap-2 px-4 py-2 mt-6 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 8. Footer */}
      <footer>
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-3 text-sm">
            <div>
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-3">Product</p>
              <ul className="space-y-2">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-3">Company</p>
              <ul className="space-y-2">
                <li><a href="mailto:support@adinsights.io" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground mb-3">Legal</p>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-muted-foreground">
            <p>&copy; 2026 AdInsights</p>
            <div className="flex gap-4">
              <Link to="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
              <Link to="/sign-up" className="hover:text-foreground transition-colors">Sign up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
