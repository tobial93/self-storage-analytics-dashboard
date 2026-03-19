import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LogoIcon } from '@/components/LogoIcon'

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">MetricFlow</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-1">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 19, 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-medium text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using MetricFlow ("the Service"), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these terms.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">2. Description of Service</h2>
            <p>MetricFlow is a multi-tenant SaaS platform that aggregates advertising data from connected ad platforms (Google Ads, Facebook Ads, GA4, LinkedIn Ads) and provides analytics, forecasting, and AI-powered insights.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">3. Accounts & Organizations</h2>
            <p>You must create an account and an organization to use the Service. You are responsible for maintaining the security of your account credentials. Each organization's data is isolated — you may only access data belonging to organizations you are a member of.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">4. Subscription & Billing</h2>
            <p>The Service offers Free, Starter ($49/mo), Professional ($99/mo), and Agency ($249/mo) subscription tiers. Paid subscriptions are billed monthly through Stripe. You may upgrade, downgrade, or cancel at any time through the Settings page. Downgrades take effect at the end of the current billing cycle.</p>
            <p className="mt-2">Paid plans include a 14-day free trial. You will not be charged until the trial period ends. You can cancel during the trial at no cost.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">5. Feature Availability</h2>
            <p>Features are gated by subscription tier. The Free tier includes basic dashboard access with one ad platform connection and 30-day data retention. Higher tiers unlock additional features including AI insights, forecasting, performance alerts, PDF exports, and white-label branding. Specific feature availability is described on the pricing page.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">6. Ad Platform Data</h2>
            <p>You authorize MetricFlow to access your ad platform accounts via OAuth to sync campaign and performance data. You are responsible for ensuring you have the right to share this data. MetricFlow does not modify your ad campaigns or settings — access is read-only.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use the Service to violate any applicable laws or regulations</li>
              <li>Attempt to access data belonging to other organizations</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated tools to scrape or extract data from the Service</li>
              <li>Share your account credentials with unauthorized third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">8. Limitation of Liability</h2>
            <p>MetricFlow is provided "as is" without warranty of any kind. We are not liable for decisions made based on data, forecasts, or AI insights provided by the Service. Our total liability is limited to the amount you have paid for the Service in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">9. Termination</h2>
            <p>You may terminate your account at any time. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, your data will be retained for 30 days before permanent deletion, unless you request immediate deletion.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">10. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated terms. Material changes will be communicated via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">11. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:support@metricflow.io" className="text-primary hover:underline">support@metricflow.io</a>.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
