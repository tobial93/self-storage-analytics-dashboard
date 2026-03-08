import {
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
import { DateRangePicker, useDateRange } from '@/components/DateRangePicker'
import { useDashboardSummary, useMetricsByDateRange, useCampaigns } from '@/hooks/useApiData'
import { DollarSign, Target, TrendingUp, MousePointerClick } from 'lucide-react'
import { useMemo } from 'react'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

const COLORS = ['#00d4aa', '#ff6b9d', '#f5a623', '#00a3cc', '#a78bfa']

function ExecutiveOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart height={300} /><SkeletonChart height={300} />
      </div>
    </div>
  )
}

export function ExecutiveOverview() {
  const { range, setRange, startDate, endDate } = useDateRange()

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(startDate, endDate)
  const { data: metrics, isLoading: metricsLoading } = useMetricsByDateRange(startDate, endDate)
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns()

  const isLoading = summaryLoading || metricsLoading || campaignsLoading

  const trendData = useMemo(() => {
    if (!metrics) return []
    const byDate: Record<string, { date: string; revenue: number; spend: number; clicks: number }> = {}
    for (const m of metrics) {
      const d = m.metric_date
      if (!d) continue
      if (!byDate[d]) byDate[d] = { date: d, revenue: 0, spend: 0, clicks: 0 }
      byDate[d].revenue += Number(m.revenue || 0)
      byDate[d].spend += Number(m.spend || 0)
      byDate[d].clicks += Number(m.clicks || 0)
    }
    return Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, date: d.date.slice(5) }))
  }, [metrics])

  const campaignSpend = useMemo(() => {
    if (!metrics || !campaigns) return []
    const byCampaign: Record<string, number> = {}
    for (const m of metrics) {
      const cid = m.campaign_id
      if (!cid) continue
      byCampaign[cid] = (byCampaign[cid] || 0) + Number(m.spend || 0)
    }
    return campaigns
      .map(c => ({ name: c.name, value: Math.round((byCampaign[c.id] || 0) * 100) / 100 }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [metrics, campaigns])

  const topCampaigns = useMemo(() => {
    if (!metrics || !campaigns) return []
    const stats: Record<string, { spend: number; clicks: number; conversions: number; revenue: number }> = {}
    for (const m of metrics) {
      const cid = m.campaign_id
      if (!cid) continue
      if (!stats[cid]) stats[cid] = { spend: 0, clicks: 0, conversions: 0, revenue: 0 }
      stats[cid].spend += Number(m.spend || 0)
      stats[cid].clicks += Number(m.clicks || 0)
      stats[cid].conversions += Number(m.conversions || 0)
      stats[cid].revenue += Number(m.revenue || 0)
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

  return (
    <div className="space-y-6">
      <DateRangePicker value={range} onChange={setRange} />

      {isLoading ? (
        <ExecutiveOverviewSkeleton />
      ) : !metrics?.length && !campaigns?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <DollarSign className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No campaign data yet</p>
          <p className="text-sm text-muted-foreground mt-1">Connect an ad platform from Integrations and sync your first campaigns.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard title="Total Ad Spend" value={formatCurrency(summary?.totalSpend || 0)} icon={DollarSign} iconColor="text-muted-foreground" />
            <KPICard title="ROAS" value={`${((summary?.totalSpend || 0) > 0 ? (summary?.totalRevenue || 0) / (summary?.totalSpend || 1) : 0).toFixed(2)}x`} icon={TrendingUp} iconColor="text-muted-foreground" />
            <KPICard title="Conversions" value={(summary?.totalConversions || 0).toLocaleString()} icon={Target} iconColor="text-muted-foreground" />
            <KPICard title="CPA" value={formatCurrency((summary?.totalConversions || 0) > 0 ? (summary?.totalSpend || 0) / (summary?.totalConversions || 1) : 0)} icon={MousePointerClick} iconColor="text-muted-foreground" invertChange />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Revenue vs Ad Spend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} interval={4} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }} formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#00d4aa" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="spend" name="Ad Spend" stroke="#ff6b9d" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Spend by Campaign</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={campaignSpend} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }: { name?: string; percent?: number }) => { const n = name ?? ''; return `${n.split(' - ')[1] || n} ${((percent ?? 0) * 100).toFixed(0)}%` }} labelLine={false}>
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

          <Card>
            <CardHeader><CardTitle>Campaign Performance</CardTitle></CardHeader>
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
                          <span className={`px-2 py-0.5 rounded text-xs ${c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
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
        </>
      )}
    </div>
  )
}
