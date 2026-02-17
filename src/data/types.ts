export type PlatformType = 'google_ads' | 'facebook_ads' | 'instagram_ads' | 'linkedin_ads' | 'tiktok_ads'

export interface Campaign {
  id: string
  name: string
  platform: PlatformType
  status: 'active' | 'paused' | 'completed'
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  startDate: string
  endDate?: string
}

export interface PlatformMetrics {
  platform: PlatformType
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  ctr: number // Click-through rate
  cpa: number // Cost per acquisition
  roas: number // Return on ad spend
  avgCpc: number // Average cost per click
  conversionRate: number
}

export interface DailyMetrics {
  id?: string
  org_id?: string
  campaign_id?: string
  metric_date?: string
  date?: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr?: number
  cpa?: number
  roas?: number
}

export interface MonthlyMetrics {
  month: string
  spend: number
  revenue: number
  conversions: number
  roas: number
  newCampaigns: number
  activeCampaigns: number
}

export interface ConversionFunnel {
  stage: string
  users: number
  conversionRate: number
  dropoffRate: number
}

export interface PerformanceAlert {
  id: string
  campaignId: string
  campaignName: string
  platform: PlatformType
  type: 'budget_exceeded' | 'low_roas' | 'high_cpa' | 'low_ctr' | 'anomaly'
  message: string
  severity: 'high' | 'medium' | 'low'
  value: number
  threshold: number
  createdAt: string
}

export interface ForecastData {
  month: string
  actual?: number
  forecast?: number
  lowerBound?: number
  upperBound?: number
}

export interface DashboardSummary {
  totalSpend: number
  spendChange: number // Percentage change vs previous period
  totalRevenue: number
  revenueChange: number
  totalConversions: number
  conversionsChange: number
  overallROAS: number
  roasChange: number
  overallCPA: number
  cpaChange: number
  overallCTR: number
  ctrChange: number
  activeCampaigns: number
  totalImpressions: number
  totalClicks: number
  avgBudgetUtilization: number
}

export interface CampaignPerformance {
  campaignId: string
  campaignName: string
  platform: PlatformType
  spend: number
  revenue: number
  conversions: number
  roas: number
  cpa: number
  ctr: number
  impressions: number
  clicks: number
  budgetUtilization: number
  performance: 'excellent' | 'good' | 'average' | 'poor'
}

export interface AttributionData {
  channel: string
  firstTouch: number
  lastTouch: number
  linear: number
  timeDecay: number
}
