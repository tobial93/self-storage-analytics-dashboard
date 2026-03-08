import { XCircle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useCurrentOrganization } from '@/contexts/OrganizationContext'
import { useAdConnections, useDisconnectAdAccount } from '@/hooks/useApiData'
import { initiateGoogleAdsOAuth } from '@/services/googleAds'
import { connectFacebookAdsMock, syncFacebookAdsMock } from '@/services/facebookAds'
import { initiateGA4OAuth } from '@/services/ga4'
import { initiateLinkedInOAuth } from '@/services/linkedin'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'

function getPlatformDisplayName(platform: string): string {
  switch (platform) {
    case 'google_ads': return 'Google Ads'
    case 'facebook_ads': return 'Facebook Ads'
    case 'ga4': return 'Google Analytics 4'
    case 'linkedin_ads': return 'LinkedIn Ads'
    default: return platform
  }
}

export function Integrations() {
  const { organizationId } = useCurrentOrganization()
  const { data: connections, isLoading } = useAdConnections()
  const disconnectMutation = useDisconnectAdAccount()
  const queryClient = useQueryClient()
  const { getToken } = useAuth()
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<{ id: string; message: string; error?: boolean } | null>(null)
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)

  const handleConnectGoogleAds = () => {
    if (!organizationId) return
    initiateGoogleAdsOAuth(organizationId)
  }

  const handleConnectFacebook = async () => {
    if (!organizationId) return
    setConnectingPlatform('facebook_ads')
    setConnectError(null)
    try {
      const clerkToken = await getToken({ template: 'supabase' })
      if (!clerkToken) throw new Error('Not authenticated')
      await connectFacebookAdsMock(organizationId, clerkToken)
      queryClient.invalidateQueries({ queryKey: ['ad-connections', organizationId] })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect Facebook Ads'
      console.error('Facebook connect error:', err)
      setConnectError(message)
    } finally {
      setConnectingPlatform(null)
    }
  }

  const handleConnectGA4 = () => {
    if (!organizationId) return
    initiateGA4OAuth(organizationId)
  }

  const handleConnectLinkedIn = () => {
    if (!organizationId) return
    initiateLinkedInOAuth(organizationId)
  }

  const handleDisconnect = async (connectionId: string) => {
    if (confirm('Are you sure you want to disconnect this account?')) {
      await disconnectMutation.mutateAsync(connectionId)
    }
  }

  const handleSync = async (connectionId: string, platform: string) => {
    if (!organizationId) return
    setSyncingId(connectionId)
    setSyncResult(null)
    try {
      let result: { campaigns_synced: number; metrics_synced: number }

      if (platform === 'facebook_ads') {
        const clerkToken = await getToken({ template: 'supabase' })
        if (!clerkToken) throw new Error('Not authenticated')
        result = await syncFacebookAdsMock(organizationId, clerkToken)
      } else {
        const functionName =
          platform === 'ga4' ? 'sync-ga4' :
          platform === 'linkedin_ads' ? 'sync-linkedin' :
          'sync-google-ads'

        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { org_id: organizationId },
        })
        if (error) {
          let detail = error.message
          try {
            const body = await error.context?.json()
            detail = body?.error || detail
          } catch { /* ignore parse error */ }
          throw new Error(detail)
        }
        if (data?.error) throw new Error(data.error)
        result = data
      }

      setSyncResult({
        id: connectionId,
        message: `Synced ${result.campaigns_synced} campaigns, ${result.metrics_synced} metric rows`,
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

  const googleAdsConnections = connections?.filter(c => c.platform === 'google_ads') || []
  const facebookAdsConnections = connections?.filter(c => c.platform === 'facebook_ads') || []
  const ga4Connections = connections?.filter(c => c.platform === 'ga4') || []
  const linkedinConnections = connections?.filter(c => c.platform === 'linkedin_ads') || []
  const allConnections = connections || []

  const platforms = [
    { key: 'google_ads', name: 'Google Ads', desc: 'Sync campaigns, ad groups, and performance metrics', connections: googleAdsConnections, onConnect: handleConnectGoogleAds },
    { key: 'facebook_ads', name: 'Facebook Ads', desc: 'Sync campaigns and ads (demo data)', connections: facebookAdsConnections, onConnect: handleConnectFacebook, connecting: connectingPlatform === 'facebook_ads' },
    { key: 'ga4', name: 'Google Analytics 4', desc: 'Track conversion events and user behavior', connections: ga4Connections, onConnect: handleConnectGA4 },
    { key: 'linkedin_ads', name: 'LinkedIn Ads', desc: 'B2B advertising campaigns and lead generation', connections: linkedinConnections, onConnect: handleConnectLinkedIn },
  ]

  return (
    <div className="space-y-6">
      {connectError && (
        <div className="p-3 border border-red-200 dark:border-red-800 rounded-md bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">{connectError}</p>
        </div>
      )}

      {/* Connected Accounts */}
      {!isLoading && allConnections.length > 0 && (
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium mb-3">Connected Accounts</p>
          <div className="space-y-2">
            {allConnections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {connection.account_name || getPlatformDisplayName(connection.platform)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getPlatformDisplayName(connection.platform)} · {connection.last_synced_at
                        ? `Synced ${formatDistanceToNow(new Date(connection.last_synced_at))} ago`
                        : 'Never synced'}
                    </p>
                    {syncResult !== null && syncResult.id === connection.id && (
                      <p className={`text-xs mt-1 ${syncResult.error ? 'text-red-500' : 'text-green-600'}`}>
                        {syncResult.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleSync(connection.id, connection.platform)}
                    disabled={syncingId === connection.id}
                    className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50"
                    title="Sync now"
                  >
                    <RefreshCw className={`h-4 w-4 text-muted-foreground ${syncingId === connection.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDisconnect(connection.id)}
                    className="p-2 hover:bg-muted rounded-md transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration Cards — simple, no decorative icon containers */}
      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((p) => (
          <div key={p.key} className="border rounded-lg p-4 bg-card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {p.connections.length > 0
                    ? `${p.connections.length} account(s) connected`
                    : 'Not connected'}
                </p>
              </div>
              {p.connections.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">{p.desc}</p>
            <button
              onClick={p.onConnect}
              disabled={!organizationId || p.connecting}
              className="w-full px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {p.connecting
                ? 'Connecting...'
                : p.connections.length > 0
                  ? 'Add Another Account'
                  : `Connect ${p.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
