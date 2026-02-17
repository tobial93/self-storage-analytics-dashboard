import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { KPICard } from '@/components/cards/KPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard, SkeletonChart } from '@/components/ui/skeleton'
import { useDashboardSummary, useMetricsByDateRange, useCampaigns } from '@/hooks/useApiData'
import { DollarSign, Target, TrendingUp, MousePointerClick } from 'lucide-react'
import { useMemo } from 'react'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function ExecutiveOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart height={300} /><SkeletonChart height={300} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart height={250} /><SkeletonChart height={250} />
      </div>
    </div>
  )
}

export function ExecutiveOverview() {
  const endDate = useMemo(() => new Date(), [])
  const startDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return d
  }, [])

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(startDate, endDate)
  const { data: metrics, isLoading: metricsLoading } = useMetricsByDateRange(startDate, endDate)
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns()

  const isLoading = summaryLoading || metricsLoading || campaignsLoading

  // Group metrics by date for the trend chart
  const trendData = useMemo(() => {
    if (!metrics) return []
    const byDate: Record<string, { date: string; revenue: number; spend: number; clicks: number }> = {}
    for (const m of metrics) {
      if (!byDate[m.metric_date]) {
        byDate[m.metric_date] = { date: m.metric_date, revenue: 0, spend: 0, clicks: 0 }
      }
      byDate[m.metric_date].revenue += Number(m.revenue || 0)
      byDate[m.metric_date].spend += Number(m.spend || 0)
      byDate[m.metric_date].clicks += Number(m.clicks || 0)
    }
    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, date: d.date.slice(5) })) // Show MM-DD
  }, [metrics])

  // Campaign spend breakdown for pie chart
  const campaignSpend = useMemo(() => {
    if (!metrics || !campaigns) return []
    const byCampaign: Record<string, number> = {}
    for (const m of metrics) {
      byCampaign[m.campaign_id] = (byCampaign[m.campaign_id] || 0) + Number(m.spend || 0)
    }
    return campaigns
      .map(c => ({ name: c.name, value: Math.round((byCampaign[c.id] || 0) * 100) / 100 }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [metrics, campaigns])

  // Top campaigns table
  const topCampaigns = useMemo(() => {
    if (!metrics || !campaigns) return []
    const stats: Record<string, { spend: number; clicks: number; conversions: number; revenue: number }> = {}
    for (const m of metrics) {
      if (!stats[m.campaign_id]) stats[m.campaign_id] = { spend: 0, clicks: 0, conversions: 0, revenue: 0 }
      stats[m.campaign_id].spend += Number(m.spend || 0)
      stats[m.campaign_id].clicks += Number(m.clicks || 0)
      stats[m.campaign_id].conversions += Number(m.conversions || 0)
      stats[m.campaign_id].revenue += Number(m.revenue || 0)
    }
    return campaigns
      .map(c => ({
        ...c,
        ...(stats[c.id] || { spend: 0, clicks: 0, conversions: 0, revenue: 0 }),
        roas: stats[c.id]?.spend > 0 ? stats[c.id].revenue / stats[c.id].spend : 0,
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5)
  }, [metrics, campaigns])

  if (isLoading) return <ExecutiveOverviewSkeleton />

  const totalSpend = summary?.totalSpend || 0
  const totalRevenue = summary?.totalRevenue || 0
  const totalConversions = summary?.totalConversions || 0
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Ad Spend"
          value={formatCurrency(totalSpend)}
          change={0}
          changeLabel="last 30 days"
          icon={DollarSign}
          iconColor="text-blue-500"
        />
        <KPICard
          title="Return on Ad Spend"
          value={`${roas.toFixed(2)}x`}
          change={0}
          changeLabel="last 30 days"
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <KPICard
          title="Total Conversions"
          value={totalConversions.toLocaleString()}
          change={0}
          changeLabel="last 30 days"
          icon={Target}
          iconColor="text-purple-500"
        />
        <KPICard
          title="Cost per Acquisition"
          value={formatCurrency(cpa)}
          change={0}
          changeLabel="last 30 days"
          icon={MousePointerClick}
          iconColor="text-orange-500"
          invertChange
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spend vs Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Ad Spend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} interval={4} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="spend" name="Ad Spend" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Spend Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spend by Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={campaignSpend} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name.split(' - ')[1] || name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {campaignSpend.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-3 font-medium">Campaign</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Spend</th>
                  <th className="text-right pb-3 font-medium">Revenue</th>
                  <th className="text-right pb-3 font-medium">ROAS</th>
                  <th className="text-right pb-3 font-medium">Clicks</th>
                  <th className="text-right pb-3 font-medium">Conversions</th>
                </tr>
              </thead>
              <tbody>
                {topCampaigns.map((c, i) => (
                  <tr key={c.id} className={i < topCampaigns.length - 1 ? 'border-b' : ''}>
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">{formatCurrency(c.spend)}</td>
                    <td className="py-3 text-right">{formatCurrency(c.revenue)}</td>
                    <td className="py-3 text-right font-medium">{c.roas.toFixed(2)}x</td>
                    <td className="py-3 text-right">{c.clicks.toLocaleString()}</td>
                    <td className="py-3 text-right">{c.conversions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
