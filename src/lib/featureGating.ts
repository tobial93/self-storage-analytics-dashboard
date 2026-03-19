import type { SubscriptionTier, SyncFrequency } from '@/data/types'

/**
 * Feature gating definitions per subscription tier.
 * "Effective tier" means the tier to check — during a trial,
 * the org gets access to the tier they're trialing.
 */

export type Feature =
  | 'ai_insights'
  | 'forecast'
  | 'alerts'
  | 'pdf_export'
  | 'csv_export'
  | 'branding'

const TIER_RANK: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  agency: 3,
}

const FEATURE_MIN_TIER: Record<Feature, SubscriptionTier> = {
  ai_insights: 'professional',
  forecast: 'professional',
  alerts: 'starter',
  pdf_export: 'professional',
  csv_export: 'starter',
  branding: 'agency',
}

export function canAccess(tier: SubscriptionTier, feature: Feature): boolean {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MIN_TIER[feature]]
}

export function getMinTierLabel(feature: Feature): string {
  const labels: Record<SubscriptionTier, string> = {
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    agency: 'Agency',
  }
  return labels[FEATURE_MIN_TIER[feature]]
}

/** Connection limits per tier */
export function getConnectionLimit(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free': return 1
    case 'starter': return 3
    default: return Infinity
  }
}

/** Allowed sync frequencies per tier */
export function getAllowedFrequencies(tier: SubscriptionTier): SyncFrequency[] {
  switch (tier) {
    case 'free': return ['daily']
    case 'starter': return ['daily', 'every_6h']
    default: return ['daily', 'every_6h', 'hourly']
  }
}

/** Data retention in days per tier */
export function getRetentionDays(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free': return 30
    case 'starter': return 90
    default: return 365
  }
}

/** Trial helpers */
export function isTrialActive(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) > new Date()
}

export function trialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0
  const diff = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
