import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { KPICard } from '@/components/cards/KPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard, SkeletonChart } from '@/components/ui/skeleton'
import { useDashboardSummary, useMetricsByDateRange, useCampaigns } from '@/hooks/useApiData'
import { Target, TrendingUp, DollarSign, MousePointerClick } from 'lucide-react'
import { useMemo } from 'react'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function CustomerAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart height={350} /><SkeletonChart height={350} />
      </div>
    </div>
  )
}

export function CustomerAnalytics() {
  const endDate = useMemo(() => new Date(), [])
  const startDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d }, [])

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(startDate, endDate)
  const { data: metrics, isLoading: metricsLoading } = useMetricsByDateRange(startDate, endDate)
  const { data: campaigns, isLoading: campLoading } = useCampaigns()

  // Clicks-to-conversion funnel by campaign
  const funnelData = useMemo(() => {
    if (!metrics || !campaigns) return []
    const stats: Record<string, { impressions: number; clicks: number; conversions: number }> = {}
    for (const m of metrics) {
      if (!stats[m.campaign_id]) stats[m.campaign_id] = { impressions: 0, clicks: 0, conversions: 0 }
      stats[m.campaign_id].impressions += Number(m.impressions || 0)
      stats[m.campaign_id].clicks += Number(m.clicks || 0)
      stats[m.campaign_id].conversions += Number(m.conversions || 0)
    }
    return campaigns.map((c, i) => ({
      name: c.name.replace('Storage Units - ', '').replace(' Units', ''),
      impressions: stats[c.id]?.impressions || 0,
      clicks: stats[c.id]?.clicks || 0,
      conversions: stats[c.id]?.conversions || 0,
      color: COLORS[i % COLORS.length],
    })).filter(c => c.impressions > 0)
  }, [metrics, campaigns])

  // Weekly conversions trend
  const weeklyTrend = useMemo(() => {
    if (!metrics) return []
    const byWeek: Record<string, { week: string; conversions: number; clicks: number }> = {}
    for (const m of metrics) {
      const date = new Date(m.metric_date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const key = weekStart.toISOString().split('T')[0]
      const label = `${(weekStart.getMonth() + 1)}/${weekStart.getDate()}`
      if (!byWeek[key]) byWeek[key] = { week: label, conversions: 0, clicks: 0 }
      byWeek[key].conversions += Number(m.conversions || 0)
      byWeek[key].clicks += Number(m.clicks || 0)
    }
    return Object.values(byWeek).sort((a, b) => a.week.localeCompare(b.week))
  }, [metrics])

  if (summaryLoading || metricsLoading || campLoading) return <CustomerAnalyticsSkeleton />

  const totalConversions = summary?.totalConversions || 0
  const totalClicks = summary?.totalClicks || 0
  const totalSpend = summary?.totalSpend || 0
  const totalRevenue = summary?.totalRevenue || 0
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0
  const revenuePerConversion = totalConversions > 0 ? totalRevenue / totalConversions : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Conversions" value={totalConversions.toLocaleString()} change={0} changeLabel="last 30 days" icon={Target} iconColor="text-blue-500" />
        <KPICard title="Conversion Rate" value={`${conversionRate.toFixed(2)}%`} change={0} changeLabel="clicks → conversions" icon={TrendingUp} iconColor="text-green-500" />
        <KPICard title="Cost per Conversion" value={formatCurrency(cpa)} change={0} changeLabel="last 30 days" icon={DollarSign} iconColor="text-purple-500" invertChange />
        <KPICard title="Revenue per Conversion" value={formatCurrency(revenuePerConversion)} change={0} changeLabel="last 30 days" icon={MousePointerClick} iconColor="text-orange-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Impressions → Clicks → Conversions by Campaign */}
        <Card>
          <CardHeader><CardTitle>Funnel by Campaign</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="clicks" name="Clicks" fill="#3b82f6" />
                  <Bar dataKey="conversions" name="Conversions" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Conversion Trend */}
        <Card>
          <CardHeader><CardTitle>Weekly Conversion Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Conversion Breakdown */}
      <Card>
        <CardHeader><CardTitle>Conversion Details by Campaign</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((c) => {
              const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0
              const cvr = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0
              return (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.conversions} conversions · {cvr.toFixed(1)}% CVR · {ctr.toFixed(2)}% CTR</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(cvr * 10, 100)}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
