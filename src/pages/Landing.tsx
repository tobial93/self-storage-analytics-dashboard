import { Link } from 'react-router-dom'
import { BarChart3, ArrowRight, Zap, Shield, LineChart } from 'lucide-react'

const plans = [
  { name: 'Free', price: '$0', desc: '1 connection, 30-day data', cta: 'Get Started', href: '/sign-up' },
  { name: 'Starter', price: '$49', desc: '3 connections, 90-day data', cta: 'Start Free Trial', href: '/sign-up' },
  { name: 'Professional', price: '$99', desc: 'Unlimited connections, 1-year data, alerts', cta: 'Start Free Trial', href: '/sign-up', featured: true },
  { name: 'Agency', price: '$249', desc: 'Everything + white-label branding', cta: 'Contact Sales', href: '/sign-up' },
]

const features = [
  { icon: Zap, title: 'Multi-Platform Sync', desc: 'Connect Google Ads, Facebook, GA4, and LinkedIn in one dashboard. Data syncs automatically.' },
  { icon: LineChart, title: 'Revenue Forecasting', desc: 'See 14-day revenue projections based on your actual campaign performance trends.' },
  { icon: Shield, title: 'Tenant Isolation', desc: 'Each organization gets isolated data with row-level security. Your data stays yours.' },
]

export function Landing() {
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

      {/* Hero — no gradient, no decorative copy, just functional */}
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
      </section>

      {/* Features — 3 column, simple */}
      <section className="border-t border-border">
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

      {/* Pricing */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <p className="text-lg font-semibold mb-6">Pricing</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`border rounded-lg p-4 ${plan.featured ? 'border-primary' : ''}`}
              >
                <p className="text-sm font-medium">{plan.name}</p>
                <p className="text-2xl font-semibold mt-2">
                  {plan.price}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
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

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">AdInsights</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link to="/sign-up" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
