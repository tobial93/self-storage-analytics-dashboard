import { supabase } from '@/lib/supabase'
import type {
  Campaign,
  DailyMetrics,
  PerformanceAlert,
} from '@/data/types'

// ============================================================
// CAMPAIGNS
// ============================================================

export async function getCampaigns(orgId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching campaigns:', error)
    throw error
  }

  return data || []
}

export async function getCampaignById(
  campaignId: string
): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (error) {
    console.error('Error fetching campaign:', error)
    throw error
  }

  return data
}

export async function getCampaignsByPlatform(
  orgId: string,
  platform: string
): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('org_id', orgId)
    .eq('platform', platform)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching campaigns by platform:', error)
    throw error
  }

  return data || []
}

// ============================================================
// METRICS
// ============================================================

export interface DashboardSummary {
  totalSpend: number
  totalRevenue: number
  totalConversions: number
  totalClicks: number
  totalImpressions: number
  averageROAS: number
  averageCTR: number
  averageCPA: number
}

export async function getDashboardSummary(
  orgId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DashboardSummary> {
  let query = supabase
    .from('campaign_daily_metrics')
    .select('*')
    .eq('org_id', orgId)

  if (startDate) {
    query = query.gte('metric_date', startDate.toISOString().split('T')[0])
  }

  if (endDate) {
    query = query.lte('metric_date', endDate.toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching dashboard summary:', error)
    throw error
  }

  if (!data || data.length === 0) {
    return {
      totalSpend: 0,
      totalRevenue: 0,
      totalConversions: 0,
      totalClicks: 0,
      totalImpressions: 0,
      averageROAS: 0,
      averageCTR: 0,
      averageCPA: 0,
    }
  }

  const totalSpend = data.reduce((sum, m) => sum + Number(m.spend || 0), 0)
  const totalRevenue = data.reduce((sum, m) => sum + Number(m.revenue || 0), 0)
  const totalConversions = data.reduce((sum, m) => sum + Number(m.conversions || 0), 0)
  const totalClicks = data.reduce((sum, m) => sum + Number(m.clicks || 0), 0)
  const totalImpressions = data.reduce((sum, m) => sum + Number(m.impressions || 0), 0)

  const averageROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const averageCPA = totalConversions > 0 ? totalSpend / totalConversions : 0

  return {
    totalSpend,
    totalRevenue,
    totalConversions,
    totalClicks,
    totalImpressions,
    averageROAS,
    averageCTR,
    averageCPA,
  }
}

export async function getCampaignMetrics(
  campaignId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DailyMetrics[]> {
  let query = supabase
    .from('campaign_daily_metrics')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('metric_date', { ascending: true })

  if (startDate) {
    query = query.gte('metric_date', startDate.toISOString().split('T')[0])
  }

  if (endDate) {
    query = query.lte('metric_date', endDate.toISOString().split('T')[0])
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching campaign metrics:', error)
    throw error
  }

  return data || []
}

export async function getMetricsByDateRange(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyMetrics[]> {
  const { data, error } = await supabase
    .from('campaign_daily_metrics')
    .select('*')
    .eq('org_id', orgId)
    .gte('metric_date', startDate.toISOString().split('T')[0])
    .lte('metric_date', endDate.toISOString().split('T')[0])
    .order('metric_date', { ascending: true })

  if (error) {
    console.error('Error fetching metrics by date range:', error)
    throw error
  }

  return data || []
}

// ============================================================
// ALERTS
// ============================================================

export async function getActiveAlerts(orgId: string): Promise<PerformanceAlert[]> {
  const { data, error } = await supabase
    .from('performance_alerts')
    .select('*, campaign:campaigns(name)')
    .eq('org_id', orgId)
    .eq('is_resolved', false)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching active alerts:', error)
    throw error
  }

  return data || []
}

export async function resolveAlert(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('performance_alerts')
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', alertId)

  if (error) {
    console.error('Error resolving alert:', error)
    throw error
  }
}

// ============================================================
// CONVERSION EVENTS
// ============================================================

export async function getConversionFunnel(
  orgId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Record<string, number>> {
  let query = supabase
    .from('conversion_events')
    .select('event_type')
    .eq('org_id', orgId)

  if (startDate) {
    query = query.gte('event_timestamp', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('event_timestamp', endDate.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching conversion funnel:', error)
    throw error
  }

  if (!data) return {}

  // Count events by type
  const funnel: Record<string, number> = {}
  data.forEach((event) => {
    funnel[event.event_type] = (funnel[event.event_type] || 0) + 1
  })

  return funnel
}

// ============================================================
// AD ACCOUNT CONNECTIONS
// ============================================================

export async function getAdConnections(orgId: string) {
  const { data, error } = await supabase
    .from('ad_account_connections')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching ad connections:', error)
    throw error
  }

  return data || []
}

export async function disconnectAdAccount(connectionId: string): Promise<void> {
  const { error } = await supabase
    .from('ad_account_connections')
    .update({ is_active: false })
    .eq('id', connectionId)

  if (error) {
    console.error('Error disconnecting ad account:', error)
    throw error
  }
}

// ============================================================
// ORGANIZATION BRANDING
// ============================================================

export async function getOrganizationBranding(orgId: string) {
  const { data, error } = await supabase
    .from('organization_branding')
    .select('*')
    .eq('org_id', orgId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found, which is okay
    console.error('Error fetching branding:', error)
    throw error
  }

  return data
}

export async function updateOrganizationBranding(
  orgId: string,
  branding: {
    logo_url?: string
    primary_color?: string
    company_name?: string
  }
) {
  const { data, error } = await supabase
    .from('organization_branding')
    .upsert({ org_id: orgId, ...branding })
    .select()
    .single()

  if (error) {
    console.error('Error updating branding:', error)
    throw error
  }

  return data
}
