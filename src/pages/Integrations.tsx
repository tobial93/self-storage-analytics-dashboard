import { Cable, CheckCircle, XCircle } from 'lucide-react'

export function Integrations() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ad Platform Integrations</h2>
        <p className="text-muted-foreground mt-1">
          Connect your advertising accounts to sync campaign data
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Google Ads */}
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Cable className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Google Ads</h3>
                <p className="text-sm text-muted-foreground">Coming in Phase 3</p>
              </div>
            </div>
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Google Ads account to sync campaigns, ad groups, and performance metrics
          </p>
          <button
            disabled
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md opacity-50 cursor-not-allowed"
          >
            Connect Google Ads
          </button>
        </div>

        {/* Facebook Ads */}
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Cable className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold">Facebook Ads</h3>
                <p className="text-sm text-muted-foreground">Coming in Phase 4</p>
              </div>
            </div>
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Sync campaigns and ads from Facebook and Instagram
          </p>
          <button
            disabled
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md opacity-50 cursor-not-allowed"
          >
            Connect Facebook Ads
          </button>
        </div>

        {/* Google Analytics 4 */}
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Cable className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold">Google Analytics 4</h3>
                <p className="text-sm text-muted-foreground">Coming in Phase 5</p>
              </div>
            </div>
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Track conversion events and user behavior across your properties
          </p>
          <button
            disabled
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md opacity-50 cursor-not-allowed"
          >
            Connect GA4
          </button>
        </div>

        {/* LinkedIn Ads */}
        <div className="border rounded-lg p-6 bg-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Cable className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold">LinkedIn Ads</h3>
                <p className="text-sm text-muted-foreground">Coming in Phase 5</p>
              </div>
            </div>
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Manage B2B advertising campaigns and lead generation
          </p>
          <button
            disabled
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md opacity-50 cursor-not-allowed"
          >
            Connect LinkedIn Ads
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="border rounded-lg p-6 bg-muted/30">
        <h3 className="font-semibold mb-2">About Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Integration pages will be implemented in future phases. Once connected, your ad platform
          data will sync automatically every hour, and you'll see real-time updates in your
          dashboard.
        </p>
      </div>
    </div>
  )
}
