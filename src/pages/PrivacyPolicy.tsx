import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LogoIcon } from '@/components/LogoIcon'

export function PrivacyPolicy() {
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
        <h1 className="text-2xl font-semibold mb-1">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 19, 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-base font-medium text-foreground mb-2">1. Information We Collect</h2>
            <p>When you use MetricFlow, we collect information you provide directly, including your name, email address, and organization details when you create an account. We also collect data from ad platforms (Google Ads, Facebook Ads, GA4, LinkedIn Ads) that you explicitly connect to your account via OAuth authorization.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">2. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide, maintain, and improve MetricFlow services</li>
              <li>Aggregate and display your advertising performance data</li>
              <li>Generate AI-powered campaign insights and revenue forecasts</li>
              <li>Send performance alerts and scheduled reports you configure</li>
              <li>Process subscription payments through Stripe</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">3. Data Isolation & Security</h2>
            <p>Each organization's data is isolated using row-level security (RLS) at the database level. Your advertising data is never shared with other tenants. OAuth tokens are stored encrypted and are only used to sync data from your connected ad platforms.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-foreground">Clerk</strong> — Authentication and organization management</li>
              <li><strong className="text-foreground">Supabase</strong> — Database hosting and edge functions</li>
              <li><strong className="text-foreground">Stripe</strong> — Payment processing</li>
              <li><strong className="text-foreground">Anthropic (Claude)</strong> — AI-powered campaign analysis</li>
            </ul>
            <p className="mt-2">Each service processes data according to their own privacy policies. We only share the minimum data necessary for each service to function.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">5. Data Retention</h2>
            <p>Campaign metrics are retained according to your subscription tier: 30 days (Free), 90 days (Starter), or 1 year (Professional/Agency). When you disconnect an ad platform, synced data is retained until it falls outside your retention window. You can request full data deletion by contacting support.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">6. Your Rights</h2>
            <p>You can access, export, or delete your data at any time. To disconnect ad platforms, visit the Integrations page. To delete your account and all associated data, contact support at <a href="mailto:support@metricflow.io" className="text-primary hover:underline">support@metricflow.io</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">7. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of material changes by posting the updated policy on this page with a revised date.</p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">8. Contact</h2>
            <p>For questions about this privacy policy, contact us at <a href="mailto:support@metricflow.io" className="text-primary hover:underline">support@metricflow.io</a>.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
