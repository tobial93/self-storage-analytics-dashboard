import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCurrentOrganization, useHasPermission } from '@/contexts/OrganizationContext'
import { getAllowedFrequencies } from '@/lib/featureGating'
import { useAdConnections, useSyncSchedules, useUpsertSyncSchedule } from '@/hooks/useApiData'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import type { SyncFrequency } from '@/data/types'

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  agency: 'Agency',
}

function getPlatformDisplayName(platform: string): string {
  switch (platform) {
    case 'google_ads': return 'Google Ads'
    case 'facebook_ads': return 'Facebook Ads'
    case 'ga4': return 'Google Analytics 4'
    case 'linkedin_ads': return 'LinkedIn Ads'
    case 'instagram_ads': return 'Instagram Ads'
    default: return platform
  }
}

export function Settings() {
  const { organizationId, organizationName, userRole, subscriptionTier, isTrialing, trialDaysLeft } = useCurrentOrganization()
  const isAdmin = useHasPermission('admin')
  const [searchParams] = useSearchParams()
  const billingStatus = searchParams.get('billing')

  const { data: connections } = useAdConnections()
  const { data: schedules } = useSyncSchedules()
  const upsertSchedule = useUpsertSyncSchedule()

  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [annualBilling, setAnnualBilling] = useState(false)

  const tier = subscriptionTier || 'free'
  const isPaidTier = tier !== 'free'

  const handleUpgrade = async (priceEnvKey: string) => {
    if (!organizationId || !isAdmin) return
    setBillingLoading(true)
    setBillingError(null)

    const suffix = annualBilling ? '_ANNUAL' : ''
    const priceId = priceEnvKey === 'starter'
      ? import.meta.env[`VITE_STRIPE_PRICE_STARTER${suffix}`] || import.meta.env.VITE_STRIPE_PRICE_STARTER
      : priceEnvKey === 'professional'
        ? import.meta.env[`VITE_STRIPE_PRICE_PROFESSIONAL${suffix}`] || import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL
        : import.meta.env[`VITE_STRIPE_PRICE_AGENCY${suffix}`] || import.meta.env.VITE_STRIPE_PRICE_AGENCY

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          org_id: organizationId,
          price_id: priceId,
          success_url: `${window.location.origin}/settings?billing=success`,
          cancel_url: `${window.location.origin}/settings?billing=cancelled`,
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

  const handleManageBilling = async () => {
    if (!organizationId) return
    setBillingLoading(true)
    setBillingError(null)

    try {
      const { data, error } = await supabase.functions.invoke('create-billing-portal', {
        body: {
          org_id: organizationId,
          return_url: `${window.location.origin}/settings`,
        },
      })

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to open billing portal')
      }

      window.location.href = data.url
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : 'Failed to open billing portal')
      setBillingLoading(false)
    }
  }

  const handleScheduleChange = (
    platform: string,
    frequency: SyncFrequency,
    isEnabled: boolean
  ) => {
    upsertSchedule.mutate({ platform, frequency, isEnabled })
  }

  const getScheduleForPlatform = (platform: string) =>
    schedules?.find(s => s.platform === platform)

  const connectedPlatforms = [...new Set(connections?.map(c => c.platform) || [])]
  const allowedFrequencies = getAllowedFrequencies(tier)
  const frequencyLabels: Record<string, string> = { hourly: 'Hourly', every_6h: 'Every 6h', daily: 'Daily' }

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-sm font-medium mb-3">Organization</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{organizationName || 'No organization selected'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your role</span>
            <span className="capitalize">{userRole || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Subscription & Billing */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <p className="text-sm font-medium">Subscription</p>
          <span className="text-xs px-1.5 py-0.5 rounded border text-muted-foreground">
            {TIER_LABELS[tier] || 'Free'}
          </span>
        </div>

        {billingStatus === 'success' && (
          <div className="mb-3 p-2 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-700 dark:text-green-300">
              Payment successful. Your subscription has been updated.
            </p>
          </div>
        )}
        {billingStatus === 'cancelled' && (
          <div className="mb-3 p-2 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Checkout was cancelled. Your subscription was not changed.
            </p>
          </div>
        )}
        {billingError && (
          <div className="mb-3 p-2 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300">{billingError}</p>
          </div>
        )}

        {isTrialing && (
          <div className="mb-3 p-2 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              You have <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}</strong> remaining in your free trial.
              {trialDaysLeft <= 3 && ' Upgrade now to avoid losing access to premium features.'}
            </p>
          </div>
        )}

        {isPaidTier ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are on the <strong>{TIER_LABELS[tier]}</strong> plan.{isTrialing ? ' (trial)' : ''}
            </p>
            {isAdmin && (
              <button
                onClick={handleManageBilling}
                disabled={billingLoading}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {billingLoading ? 'Loading...' : 'Manage Billing'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Free plan — 1 connection, 30-day data retention.
            </p>
            {isAdmin && (
              <>
                <div className="flex items-center gap-2 text-sm mb-3">
                  <span className={annualBilling ? 'text-muted-foreground' : 'font-medium'}>Monthly</span>
                  <button
                    onClick={() => setAnnualBilling(!annualBilling)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${annualBilling ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${annualBilling ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className={annualBilling ? 'font-medium' : 'text-muted-foreground'}>
                    Annual <span className="text-primary text-xs">save 20%</span>
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { key: 'starter', name: 'Starter', monthly: '$49', annual: '$39', desc: '3 connections, 90-day data' },
                    { key: 'professional', name: 'Professional', monthly: '$99', annual: '$79', desc: 'Unlimited connections, 1-year data' },
                    { key: 'agency', name: 'Agency', monthly: '$249', annual: '$199', desc: 'Everything + white-label' },
                  ].map(plan => (
                    <div key={plan.key} className="border rounded-md p-3">
                      <p className="text-sm font-medium">{plan.name}</p>
                      <p className="text-lg font-semibold mt-1">
                        {annualBilling ? plan.annual : plan.monthly}
                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                      </p>
                      {annualBilling && (
                        <p className="text-xs text-primary">billed annually</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
                      <button
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={billingLoading}
                        className="mt-2 w-full px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {billingLoading ? 'Loading...' : 'Upgrade'}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {!isAdmin && (
              <p className="text-sm text-muted-foreground">
                Contact your organization admin to upgrade the plan.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sync Scheduling */}
      {connectedPlatforms.length > 0 && (
        <div className="border rounded-lg p-4 bg-card">
          <p className="text-sm font-medium mb-3">Sync Scheduling</p>
          <div className="space-y-2">
            {connectedPlatforms.map(platform => {
              const schedule = getScheduleForPlatform(platform)
              const currentFrequency = (schedule?.frequency || 'daily') as SyncFrequency
              const currentEnabled = schedule?.is_enabled ?? true

              return (
                <div
                  key={platform}
                  className="flex items-center justify-between p-3 border rounded-md gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{getPlatformDisplayName(platform)}</p>
                    {schedule?.last_run_at && (
                      <p className="text-xs text-muted-foreground">
                        Last synced {formatDistanceToNow(new Date(schedule.last_run_at))} ago
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <select
                      value={allowedFrequencies.includes(currentFrequency) ? currentFrequency : allowedFrequencies[allowedFrequencies.length - 1]}
                      onChange={e =>
                        handleScheduleChange(
                          platform,
                          e.target.value as SyncFrequency,
                          currentEnabled
                        )
                      }
                      className="text-sm border rounded-md px-2 py-1 bg-background"
                    >
                      {allowedFrequencies.map(f => (
                        <option key={f} value={f}>{frequencyLabels[f]}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentEnabled}
                        onChange={e =>
                          handleScheduleChange(
                            platform,
                            currentFrequency,
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 rounded"
                      />
                      Enabled
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Team Management */}
      <div className="border rounded-lg p-4 bg-card">
        <p className="text-sm font-medium mb-2">Team Members</p>
        <p className="text-sm text-muted-foreground">
          Manage team members through Clerk. Click your profile picture in the header, then select "Manage organization" to invite members.
        </p>
      </div>
    </div>
  )
}
