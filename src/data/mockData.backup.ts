import type {
  Campaign,
  PlatformMetrics,
  DailyMetrics,
  MonthlyMetrics,
  ConversionFunnel,
  PerformanceAlert,
  DashboardSummary,
  CampaignPerformance,
  ForecastData,
  AttributionData,
  PlatformType,
} from './types'

// Mock Campaigns
export const mockCampaigns: Campaign[] = [
  {
    id: 'camp_1',
    name: 'Spring Sale 2026',
    platform: 'google_ads',
    status: 'active',
    budget: 5000,
    spent: 4235.50,
    impressions: 125000,
    clicks: 3250,
    conversions: 145,
    revenue: 18500,
    startDate: '2026-01-15',
  },
  {
    id: 'camp_2',
    name: 'Product Launch - Facebook',
    platform: 'facebook_ads',
    status: 'active',
    budget: 3000,
    spent: 2850.00,
    impressions: 95000,
    clicks: 2100,
    conversions: 89,
    revenue: 12400,
    startDate: '2026-01-20',
  },
  {
    id: 'camp_3',
    name: 'Brand Awareness',
    platform: 'instagram_ads',
    status: 'active',
    budget: 2000,
    spent: 1950.00,
    impressions: 180000,
    clicks: 4500,
    conversions: 67,
    revenue: 7800,
    startDate: '2026-02-01',
  },
  {
    id: 'camp_4',
    name: 'B2B Lead Generation',
    platform: 'linkedin_ads',
    status: 'active',
    budget: 4000,
    spent: 3680.00,
    impressions: 45000,
    clicks: 890,
    conversions: 34,
    revenue: 15300,
    startDate: '2026-01-10',
  },
  {
    id: 'camp_5',
    name: 'Retargeting Campaign',
    platform: 'google_ads',
    status: 'active',
    budget: 1500,
    spent: 1420.00,
    impressions: 68000,
    clicks: 1850,
    conversions: 92,
    revenue: 9200,
    startDate: '2026-02-05',
  },
  {
    id: 'camp_6',
    name: 'Holiday Special',
    platform: 'facebook_ads',
    status: 'paused',
    budget: 2500,
    spent: 2500.00,
    impressions: 110000,
    clicks: 2200,
    conversions: 78,
    revenue: 8900,
    startDate: '2025-12-01',
    endDate: '2025-12-31',
  },
]

// Platform Performance Metrics
export const mockPlatformMetrics: PlatformMetrics[] = [
  {
    platform: 'google_ads',
    totalSpend: 5655.50,
    totalImpressions: 193000,
    totalClicks: 5100,
    totalConversions: 237,
    totalRevenue: 27700,
    ctr: 2.64,
    cpa: 23.86,
    roas: 4.90,
    avgCpc: 1.11,
    conversionRate: 4.65,
  },
  {
    platform: 'facebook_ads',
    totalSpend: 5350.00,
    totalImpressions: 205000,
    totalClicks: 4300,
    totalConversions: 167,
    totalRevenue: 21300,
    ctr: 2.10,
    cpa: 32.04,
    roas: 3.98,
    avgCpc: 1.24,
    conversionRate: 3.88,
  },
  {
    platform: 'instagram_ads',
    totalSpend: 1950.00,
    totalImpressions: 180000,
    totalClicks: 4500,
    totalConversions: 67,
    totalRevenue: 7800,
    ctr: 2.50,
    cpa: 29.10,
    roas: 4.00,
    avgCpc: 0.43,
    conversionRate: 1.49,
  },
  {
    platform: 'linkedin_ads',
    totalSpend: 3680.00,
    totalImpressions: 45000,
    totalClicks: 890,
    totalConversions: 34,
    totalRevenue: 15300,
    ctr: 1.98,
    cpa: 108.24,
    roas: 4.16,
    avgCpc: 4.13,
    conversionRate: 3.82,
  },
]

// Daily Metrics (Last 30 days)
export const mockDailyMetrics: DailyMetrics[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  const baseSpend = 500 + Math.random() * 300
  const impressions = Math.floor(15000 + Math.random() * 10000)
  const clicks = Math.floor(impressions * (0.02 + Math.random() * 0.01))
  const conversions = Math.floor(clicks * (0.03 + Math.random() * 0.02))
  const revenue = conversions * (80 + Math.random() * 60)

  return {
    date: date.toISOString().split('T')[0],
    spend: baseSpend,
    impressions,
    clicks,
    conversions,
    revenue,
    ctr: (clicks / impressions) * 100,
    cpa: baseSpend / conversions,
    roas: revenue / baseSpend,
  }
})

// Monthly Metrics (Last 12 months)
export const mockMonthlyMetrics: MonthlyMetrics[] = [
  { month: 'Mar 2025', spend: 12500, revenue: 52000, conversions: 420, roas: 4.16, newCampaigns: 2, activeCampaigns: 8 },
  { month: 'Apr 2025', spend: 13800, revenue: 58900, conversions: 465, roas: 4.27, newCampaigns: 3, activeCampaigns: 9 },
  { month: 'May 2025', spend: 15200, revenue: 64300, conversions: 512, roas: 4.23, newCampaigns: 1, activeCampaigns: 10 },
  { month: 'Jun 2025', spend: 14100, revenue: 61200, conversions: 487, roas: 4.34, newCampaigns: 2, activeCampaigns: 11 },
  { month: 'Jul 2025', spend: 16500, revenue: 69800, conversions: 545, roas: 4.23, newCampaigns: 4, activeCampaigns: 12 },
  { month: 'Aug 2025', spend: 17800, revenue: 75600, conversions: 598, roas: 4.25, newCampaigns: 2, activeCampaigns: 13 },
  { month: 'Sep 2025', spend: 16200, revenue: 71500, conversions: 562, roas: 4.41, newCampaigns: 1, activeCampaigns: 12 },
  { month: 'Oct 2025', spend: 18900, revenue: 82400, conversions: 645, roas: 4.36, newCampaigns: 3, activeCampaigns: 14 },
  { month: 'Nov 2025', spend: 21500, revenue: 95300, conversions: 734, roas: 4.43, newCampaigns: 5, activeCampaigns: 16 },
  { month: 'Dec 2025', spend: 24800, revenue: 108600, conversions: 812, roas: 4.38, newCampaigns: 3, activeCampaigns: 17 },
  { month: 'Jan 2026', spend: 19200, revenue: 84100, conversions: 665, roas: 4.38, newCampaigns: 4, activeCampaigns: 15 },
  { month: 'Feb 2026', spend: 16635, revenue: 72200, conversions: 505, roas: 4.34, newCampaigns: 2, activeCampaigns: 14 },
]

// Conversion Funnel
export const mockConversionFunnel: ConversionFunnel[] = [
  { stage: 'Impressions', users: 617000, conversionRate: 100, dropoffRate: 0 },
  { stage: 'Clicks', users: 14790, conversionRate: 2.40, dropoffRate: 97.60 },
  { stage: 'Landing Page', users: 12350, conversionRate: 83.50, dropoffRate: 16.50 },
  { stage: 'Add to Cart', users: 3680, conversionRate: 29.80, dropoffRate: 70.20 },
  { stage: 'Checkout', users: 1240, conversionRate: 33.70, dropoffRate: 66.30 },
  { stage: 'Purchase', users: 505, conversionRate: 40.73, dropoffRate: 59.27 },
]

// Performance Alerts
export const mockAlerts: PerformanceAlert[] = [
  {
    id: 'alert_1',
    campaignId: 'camp_2',
    campaignName: 'Product Launch - Facebook',
    platform: 'facebook_ads',
    type: 'budget_exceeded',
    message: 'Campaign budget 95% depleted. Consider increasing budget or pausing campaign.',
    severity: 'high',
    value: 95,
    threshold: 90,
    createdAt: '2026-02-12T08:30:00Z',
  },
  {
    id: 'alert_2',
    campaignId: 'camp_4',
    campaignName: 'B2B Lead Generation',
    platform: 'linkedin_ads',
    type: 'high_cpa',
    message: 'Cost per acquisition ($108.24) is 45% higher than target ($75).',
    severity: 'medium',
    value: 108.24,
    threshold: 75,
    createdAt: '2026-02-12T10:15:00Z',
  },
  {
    id: 'alert_3',
    campaignId: 'camp_3',
    campaignName: 'Brand Awareness',
    platform: 'instagram_ads',
    type: 'low_ctr',
    message: 'Click-through rate (2.5%) is below platform average (3.2%).',
    severity: 'low',
    value: 2.5,
    threshold: 3.2,
    createdAt: '2026-02-11T14:45:00Z',
  },
  {
    id: 'alert_4',
    campaignId: 'camp_1',
    campaignName: 'Spring Sale 2026',
    platform: 'google_ads',
    type: 'anomaly',
    message: 'Conversion rate dropped 34% in the last 24 hours. Investigate ad creative or landing page.',
    severity: 'high',
    value: -34,
    threshold: -20,
    createdAt: '2026-02-12T09:00:00Z',
  },
]

// Dashboard Summary
export const mockDashboardSummary: DashboardSummary = {
  totalSpend: 16635.50,
  spendChange: -13.4, // vs previous month
  totalRevenue: 72200,
  revenueChange: -14.2,
  totalConversions: 505,
  conversionsChange: -24.1,
  overallROAS: 4.34,
  roasChange: -0.9,
  overallCPA: 32.94,
  cpaChange: 13.8,
  overallCTR: 2.39,
  ctrChange: -3.2,
  activeCampaigns: 5,
  totalImpressions: 617000,
  totalClicks: 14790,
  avgBudgetUtilization: 87.5,
}

// Campaign Performance Rankings
export const mockCampaignPerformance: CampaignPerformance[] = [
  {
    campaignId: 'camp_1',
    campaignName: 'Spring Sale 2026',
    platform: 'google_ads',
    spend: 4235.50,
    revenue: 18500,
    conversions: 145,
    roas: 4.37,
    cpa: 29.21,
    ctr: 2.60,
    impressions: 125000,
    clicks: 3250,
    budgetUtilization: 84.7,
    performance: 'excellent',
  },
  {
    campaignId: 'camp_5',
    campaignName: 'Retargeting Campaign',
    platform: 'google_ads',
    spend: 1420.00,
    revenue: 9200,
    conversions: 92,
    roas: 6.48,
    cpa: 15.43,
    ctr: 2.72,
    impressions: 68000,
    clicks: 1850,
    budgetUtilization: 94.7,
    performance: 'excellent',
  },
  {
    campaignId: 'camp_2',
    campaignName: 'Product Launch - Facebook',
    platform: 'facebook_ads',
    spend: 2850.00,
    revenue: 12400,
    conversions: 89,
    roas: 4.35,
    cpa: 32.02,
    ctr: 2.21,
    impressions: 95000,
    clicks: 2100,
    budgetUtilization: 95.0,
    performance: 'good',
  },
  {
    campaignId: 'camp_4',
    campaignName: 'B2B Lead Generation',
    platform: 'linkedin_ads',
    spend: 3680.00,
    revenue: 15300,
    conversions: 34,
    roas: 4.16,
    cpa: 108.24,
    ctr: 1.98,
    impressions: 45000,
    clicks: 890,
    budgetUtilization: 92.0,
    performance: 'good',
  },
  {
    campaignId: 'camp_3',
    campaignName: 'Brand Awareness',
    platform: 'instagram_ads',
    spend: 1950.00,
    revenue: 7800,
    conversions: 67,
    roas: 4.00,
    cpa: 29.10,
    ctr: 2.50,
    impressions: 180000,
    clicks: 4500,
    budgetUtilization: 97.5,
    performance: 'average',
  },
]

// Forecast Data (Next 6 months)
export const mockForecastData: ForecastData[] = [
  { month: 'Jan 2026', actual: 84100 },
  { month: 'Feb 2026', actual: 72200 },
  { month: 'Mar 2026', forecast: 78500, lowerBound: 71200, upperBound: 85800 },
  { month: 'Apr 2026', forecast: 82300, lowerBound: 74100, upperBound: 90500 },
  { month: 'May 2026', forecast: 86700, lowerBound: 77800, upperBound: 95600 },
  { month: 'Jun 2026', forecast: 84200, lowerBound: 75400, upperBound: 93000 },
  { month: 'Jul 2026', forecast: 91500, lowerBound: 82100, upperBound: 100900 },
  { month: 'Aug 2026', forecast: 95800, lowerBound: 85900, upperBound: 105700 },
]

// Attribution Data
export const mockAttributionData: AttributionData[] = [
  { channel: 'Google Ads', firstTouch: 145, lastTouch: 189, linear: 167, timeDecay: 178 },
  { channel: 'Facebook Ads', firstTouch: 98, lastTouch: 112, linear: 105, timeDecay: 108 },
  { channel: 'Instagram Ads', firstTouch: 78, lastTouch: 45, linear: 62, timeDecay: 54 },
  { channel: 'LinkedIn Ads', firstTouch: 56, lastTouch: 67, linear: 62, timeDecay: 64 },
  { channel: 'Organic Search', firstTouch: 89, lastTouch: 56, linear: 73, timeDecay: 65 },
  { channel: 'Direct', firstTouch: 39, lastTouch: 36, linear: 36, timeDecay: 36 },
]

// Helper function to format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Helper function to format percentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`
}

// Helper function to format large numbers
export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}

// Helper function to get platform color
export const getPlatformColor = (platform: PlatformType): string => {
  const colors: Record<PlatformType, string> = {
    google_ads: '#4285F4',
    facebook_ads: '#1877F2',
    instagram_ads: '#E4405F',
    linkedin_ads: '#0A66C2',
    ga4: '#E37400',
  }
  return colors[platform]
}

// Helper function to get platform name
export const getPlatformName = (platform: PlatformType): string => {
  const names: Record<PlatformType, string> = {
    google_ads: 'Google Ads',
    facebook_ads: 'Facebook Ads',
    instagram_ads: 'Instagram Ads',
    linkedin_ads: 'LinkedIn Ads',
    ga4: 'Google Analytics 4',
  }
  return names[platform]
}
