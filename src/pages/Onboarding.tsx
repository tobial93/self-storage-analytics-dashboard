import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Cable, RefreshCw, CreditCard, Users } from 'lucide-react'
import { useCurrentOrganization } from '@/contexts/OrganizationContext'
import { useAdConnections, useMarkOnboardingComplete } from '@/hooks/useApiData'
import { initiateGoogleAdsOAuth } from '@/services/googleAds'
import { connectFacebookAdsMock, syncFacebookAdsMock } from '@/services/facebookAds'
import { initiateGA4OAuth } from '@/services/ga4'
import { initiateLinkedInOAuth } from '@/services/linkedin'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@clerk/clerk-react'
import { useQueryClient } from '@tanstack/react-query'

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { label: 'Connect', icon: Cable },
  { label: 'Sync', icon: RefreshCw },
  { label: 'Choose Plan', icon: CreditCard },
  { label: 'Invite Team', icon: Users },
]

export function Onboarding() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { organizationId } = useCurrentOrganization()
  const { data: connections } = useAdConnections()
  const markComplete = useMarkOnboardingComplete()
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ message: string; error?: boolean } | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)

  // Auto-advance to step 4 when returning from Stripe with success
  const billingStatus = searchParams.get('billing')
  useEffect(() => {
    if (billingStatus === 'success' && currentStep === 3) {
      setCurrentStep(4)
    }
  }, [billingStatus, currentStep])

  const hasConnections = (connections?.length ?? 0) > 0
  const firstConnection = connections?.[0]

  const handleConnectGoogle = () => {
    if (!organizationId) return
    initiateGoogleAdsOAuth(organizationId)
  }

  const handleConnectFacebook = async () => {
    if (!organizationId) return
    setConnectingPlatform('facebook_ads')
    try {
      const token = await getToken({ template: 'supabase' })
      if (!token) throw new Error('Not authenticated')
      await connectFacebookAdsMock(organizationId, token)
      queryClient.invalidateQueries({ queryKey: ['ad-connections', organizationId] })
    } catch (err) {
      console.error('Facebook connect error:', err)
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

  const handleSync = async () => {
    if (!organizationId || !firstConnection) return
    setSyncing(true)
    setSyncResult(null)

    try {
      if (firstConnection.platform === 'facebook_ads') {
        const token = await getToken({ template: 'supabase' })
        if (!token) throw new Error('Not authenticated')
        const result = await syncFacebookAdsMock(organizationId, token)
        setSyncResult({
          message: `Synced ${result.campaigns_synced} campaigns, ${result.metrics_synced} metric rows`,
        })
      } else {
        const functionName =
          firstConnection.platform === 'ga4' ? 'sync-ga4' :
          firstConnection.platform === 'linkedin_ads' ? 'sync-linkedin' :
          'sync-google-ads'

        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { org_id: organizationId },
        })

        if (error || data?.error) {
          throw new Error(data?.error || error?.message || 'Sync failed')
        }

        setSyncResult({
          message: `Synced ${data.campaigns_synced} campaigns, ${data.metrics_synced} metric rows`,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['ad-connections', organizationId] })
    } catch (err) {
      setSyncResult({
        message: err instanceof Error ? err.message : 'Sync failed',
        error: true,
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleUpgrade = async (tierKey: string) => {
    if (!organizationId) return
    setBillingLoading(true)
    setBillingError(null)

    const priceId =
      tierKey === 'starter' ? import.meta.env.VITE_STRIPE_PRICE_STARTER :
      tierKey === 'professional' ? import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL :
      import.meta.env.VITE_STRIPE_PRICE_AGENCY

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          org_id: organizationId,
          price_id: priceId,
          success_url: `${window.location.origin}/onboarding?billing=success`,
          cancel_url: `${window.location.origin}/onboarding`,
        },
      })

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to create checkout session')
      }

      window.location.href = data.url
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Failed to start checkout')
      setBillingLoading(false)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await markComplete.mutateAsync()
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Error completing onboarding:', err)
      // Navigate anyway to not block the user
      navigate('/', { replace: true })
    }
  }

  const goNext = () => {
    if (currentStep < 4) setCurrentStep((currentStep + 1) as Step)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-12 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            Complete these steps to start tracking your ad performance.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-4 left-0 right-0 h-px bg-border -z-0" />
          {STEPS.map((step, i) => {
            const stepNum = (i + 1) as Step
            const isDone = currentStep > stepNum
            const isActive = currentStep === stepNum
            const Icon = step.icon
            return (
              <div key={step.label} className="flex flex-col items-center gap-2 z-10">
                <div
                  className={`h-8 w-8 rounded-md flex items-center justify-center border transition-colors ${
                    isDone
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isActive
                        ? 'bg-background border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="border rounded-lg p-6 bg-card">
          {/* Step 1: Connect */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Connect an ad platform</h2>
              <p className="text-sm text-muted-foreground">
                Connect at least one platform to start syncing your campaign data.
              </p>

              {hasConnections && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    {connections!.length} platform(s) connected
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleConnectGoogle}
                  className="p-3 border rounded-lg text-sm hover:bg-muted transition-colors text-left"
                >
                  <span className="font-medium block">Google Ads</span>
                  <span className="text-muted-foreground text-xs">OAuth 2.0</span>
                </button>
                <button
                  onClick={handleConnectFacebook}
                  disabled={connectingPlatform === 'facebook_ads'}
                  className="p-3 border rounded-lg text-sm hover:bg-muted transition-colors text-left disabled:opacity-50"
                >
                  <span className="font-medium block">Facebook Ads</span>
                  <span className="text-muted-foreground text-xs">
                    {connectingPlatform === 'facebook_ads' ? 'Connecting...' : 'Demo data'}
                  </span>
                </button>
                <button
                  onClick={handleConnectGA4}
                  className="p-3 border rounded-lg text-sm hover:bg-muted transition-colors text-left"
                >
                  <span className="font-medium block">Google Analytics 4</span>
                  <span className="text-muted-foreground text-xs">OAuth 2.0</span>
                </button>
                <button
                  onClick={handleConnectLinkedIn}
                  className="p-3 border rounded-lg text-sm hover:bg-muted transition-colors text-left"
                >
                  <span className="font-medium block">LinkedIn Ads</span>
                  <span className="text-muted-foreground text-xs">OAuth 2.0</span>
                </button>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={goNext}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Skip for now
                </button>
                <button
                  onClick={goNext}
                  disabled={!hasConnections}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Sync */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Sync your data</h2>
              <p className="text-sm text-muted-foreground">
                Fetch the latest campaign data from your connected platform(s).
              </p>

              {!hasConnections && (
                <p className="text-sm text-muted-foreground italic">
                  No platforms connected yet — you can sync from the Integrations page later.
                </p>
              )}

              {hasConnections && (
                <div className="space-y-3">
                  <p className="text-sm">
                    Ready to sync from <strong>{firstConnection?.account_name || firstConnection?.platform}</strong>
                  </p>

                  {syncResult && (
                    <div className={`p-3 rounded-md border text-sm ${
                      syncResult.error
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                    }`}>
                      {syncResult.error ? '' : <CheckCircle2 className="h-4 w-4 inline mr-1" />}
                      {syncResult.message}
                    </div>
                  )}

                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  onClick={goNext}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Skip for now
                </button>
                <button
                  onClick={goNext}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Choose Plan */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Choose your plan</h2>
              <p className="text-sm text-muted-foreground">
                Pick the plan that fits your team. You can change it anytime.
              </p>

              {billingStatus === 'success' && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Payment successful! Subscription activated.
                  </p>
                </div>
              )}
              {billingError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-700 dark:text-red-300">{billingError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-4 col-span-2 sm:col-span-1">
                  <p className="font-semibold">Free</p>
                  <p className="text-2xl font-bold mt-1">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <p className="text-xs text-muted-foreground mt-1">1 connection, 30-day data</p>
                  <button
                    onClick={goNext}
                    className="mt-3 w-full px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
                  >
                    Stay on Free
                  </button>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="font-semibold">Starter</p>
                  <p className="text-2xl font-bold mt-1">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <p className="text-xs text-muted-foreground mt-1">3 connections, 90-day data</p>
                  <button
                    onClick={() => handleUpgrade('starter')}
                    disabled={billingLoading}
                    className="mt-3 w-full px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {billingLoading ? '...' : 'Upgrade'}
                  </button>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="font-semibold">Professional</p>
                  <p className="text-2xl font-bold mt-1">$99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Unlimited, 1-year data, alerts</p>
                  <button
                    onClick={() => handleUpgrade('professional')}
                    disabled={billingLoading}
                    className="mt-3 w-full px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {billingLoading ? '...' : 'Upgrade'}
                  </button>
                </div>
                <div className="border rounded-lg p-4 col-span-2 sm:col-span-1">
                  <p className="font-semibold">Agency</p>
                  <p className="text-2xl font-bold mt-1">$249<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Everything + white-label</p>
                  <button
                    onClick={() => handleUpgrade('agency')}
                    disabled={billingLoading}
                    className="mt-3 w-full px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {billingLoading ? '...' : 'Upgrade'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Invite Team */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Invite your team</h2>
              <p className="text-sm text-muted-foreground">
                Add colleagues to collaborate on the dashboard. You can always do this later
                from Settings or by clicking your profile picture in the top right.
              </p>

              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-2">How to invite members:</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Click your profile picture in the top-right header</li>
                  <li>Select "Manage organization"</li>
                  <li>Go to the "Members" tab and click "Invite members"</li>
                </ol>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {completing ? 'Setting up...' : 'Go to Dashboard'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
