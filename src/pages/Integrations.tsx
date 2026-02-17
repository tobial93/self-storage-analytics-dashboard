import { Cable, XCircle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useCurrentOrganization } from '@/contexts/OrganizationContext'
import { useAdConnections, useDisconnectAdAccount } from '@/hooks/useApiData'
import { initiateGoogleAdsOAuth } from '@/services/googleAds'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

export function Integrations() {
  const { organizationId } = useCurrentOrganization()
  const { data: connections, isLoading } = useAdConnections()
  const disconnectMutation = useDisconnectAdAccount()
  const queryClient = useQueryClient()
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<{ id: string; message: string; error?: boolean } | null>(null)

  const handleConnectGoogleAds = () => {
    if (!organizationId) {
      alert('Please select an organization first')
      return
    }
    initiateGoogleAdsOAuth(organizationId)
  }

  const handleDisconnect = async (connectionId: string) => {
    if (confirm('Are you sure you want to disconnect this account?')) {
      await disconnectMutation.mutateAsync(connectionId)
    }
  }

  const handleSync = async (connectionId: string) => {
    if (!organizationId) return
    setSyncingId(connectionId)
    setSyncResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-ads', {
        body: { org_id: organizationId },
      })
      if (error) {
        // Extract actual error from response body
        let detail = error.message
        try {
          const body = await error.context?.json()
          detail = body?.error || detail
        } catch {}
        throw new Error(detail)
      }
      if (data?.error) throw new Error(data.error)
      setSyncResult({
        id: connectionId,
        message: `Synced ${data.campaigns_synced} campaigns, ${data.metrics_synced} metric rows`,
      })
      queryClient.invalidateQueries({ queryKey: ['ad-connections', organizationId] })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      console.error('Sync error:', err)
      setSyncResult({ id: connectionId, message, error: true })
    } finally {
      setSyncingId(null)
    }
  }

  // Filter connections by platform
  const googleAdsConnections = connections?.filter(c => c.platform === 'google_ads') || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ad Platform Integrations</h2>
        <p className="text-muted-foreground mt-1">
          Connect your advertising accounts to sync campaign data
        </p>
      </div>

      {/* Connected Accounts Section */}
      {!isLoading && googleAdsConnections.length > 0 && (
        <div className="border rounded-lg p-6 bg-card">
          <h3 className="font-semibold mb-4">Connected Accounts</h3>
          <div className="space-y-3">
            {googleAdsConnections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">
                      {connection.account_name || 'Google Ads Account'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {connection.last_synced_at
                        ? `Last synced ${formatDistanceToNow(new Date(connection.last_synced_at))} ago`
                        : 'Never synced'}
                    </p>
                    {syncResult?.id === connection.id && (
                      <p className={`text-xs mt-1 ${syncResult.error ? 'text-red-500' : 'text-green-600'}`}>
                        {syncResult.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSync(connection.id)}
                    disabled={syncingId === connection.id}
                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                    title="Sync now"
                  >
                    <RefreshCw className={`h-4 w-4 text-blue-600 ${syncingId === connection.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDisconnect(connection.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <p className="text-sm text-muted-foreground">
                  {googleAdsConnections.length > 0
                    ? `${googleAdsConnections.length} account(s) connected`
                    : 'Not connected'}
                </p>
              </div>
            </div>
            {googleAdsConnections.length > 0 ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Google Ads account to sync campaigns, ad groups, and performance metrics
          </p>
          <button
            onClick={handleConnectGoogleAds}
            disabled={!organizationId}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleAdsConnections.length > 0 ? 'Add Another Account' : 'Connect Google Ads'}
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
          Once connected, your ad platform data will sync automatically. You can manage connected
          accounts above and view campaign data in the dashboard.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Click the <strong>sync icon</strong> next to a connected account to fetch the latest campaign data.
        </p>
      </div>
    </div>
  )
}
