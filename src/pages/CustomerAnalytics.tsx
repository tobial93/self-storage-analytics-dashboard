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
import { DateRangePicker, useDateRange } from '@/components/DateRangePicker'
import { exportCsv } from '@/components/CsvExport'
import { useDashboardSummary, useMetricsByDateRange, useCampaigns } from '@/hooks/useApiData'
import { Target, TrendingUp, DollarSign, MousePointerClick, Download } from 'lucide-react'
import { useMemo } from 'react'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const COLORS = ['#00d4aa', '#ff6b9d', '#f5a623', '#00a3cc', '#a78bfa']

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
  const { range, setRange, startDate, endDate } = useDateRange()

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(startDate, endDate)
  const { data: metrics, isLoading: metricsLoading } = useMetricsByDateRange(startDate, endDate)
  const { data: campaigns, isLoading: campLoading } = useCampaigns()

  const funnelData = useMemo(() => {
    if (!metrics || !campaigns) return []
    const stats: Record<string, { impressions: number; clicks: number; conversions: number }> = {}
    for (const m of metrics) {
      const cid = m.campaign_id
      if (!cid) continue
      if (!stats[cid]) stats[cid] = { impressions: 0, clicks: 0, conversions: 0 }
      stats[cid].impressions += Number(m.impressions || 0)
      stats[cid].clicks += Number(m.clicks || 0)
      stats[cid].conversions += Number(m.conversions || 0)
    }
    return campaigns.map((c, i) => ({
      name: c.name.replace('Storage Units - ', '').replace(' Units', ''),
      impressions: stats[c.id]?.impressions || 0,
      clicks: stats[c.id]?.clicks || 0,
      conversions: stats[c.id]?.conversions || 0,
      color: COLORS[i % COLORS.length],
    })).filter(c => c.impressions > 0)
  }, [metrics, campaigns])

  const weeklyTrend = useMemo(() => {
    if (!metrics) return []
    const byWeek: Record<string, { week: string; conversions: number; clicks: number }> = {}
    for (const m of metrics) {
      const d = m.metric_date
      if (!d) continue
      const date = new Date(d)
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

  const isLoading = summaryLoading || metricsLoading || campLoading

  const handleCsvExport = () => {
    exportCsv({
      data: funnelData.map(c => ({
        name: c.name,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
        ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0',
        cvr: c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(2) : '0',
      })),
      filename: `conversions_${range.label}`,
      columns: [
        { key: 'name', label: 'Campaign' },
        { key: 'impressions', label: 'Impressions' },
        { key: 'clicks', label: 'Clicks' },
        { key: 'conversions', label: 'Conversions' },
        { key: 'ctr', label: 'CTR %' },
        { key: 'cvr', label: 'CVR %' },
      ],
    })
  }

  return (
    <div className="space-y-6">
      <DateRangePicker value={range} onChange={setRange} />

      {isLoading ? (
        <CustomerAnalyticsSkeleton />
      ) : !metrics?.length || !campaigns?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No conversion data yet</p>
          <p className="text-sm text-muted-foreground mt-1">Connect an ad platform and sync to see conversion analytics.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard title="Conversions" value={(summary?.totalConversions || 0).toLocaleString()} icon={Target} iconColor="text-muted-foreground" />
            <KPICard title="Conversion Rate" value={`${((summary?.totalClicks || 0) > 0 ? ((summary?.totalConversions || 0) / (summary?.totalClicks || 1)) * 100 : 0).toFixed(2)}%`} icon={TrendingUp} iconColor="text-muted-foreground" />
            <KPICard title="Cost per Conversion" value={formatCurrency((summary?.totalConversions || 0) > 0 ? (summary?.totalSpend || 0) / (summary?.totalConversions || 1) : 0)} icon={DollarSign} iconColor="text-muted-foreground" invertChange />
            <KPICard title="Revenue per Conversion" value={formatCurrency((summary?.totalConversions || 0) > 0 ? (summary?.totalRevenue || 0) / (summary?.totalConversions || 1) : 0)} icon={MousePointerClick} iconColor="text-muted-foreground" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Funnel by Campaign</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }} />
                      <Legend />
                      <Bar dataKey="clicks" name="Clicks" fill="#00a3cc" />
                      <Bar dataKey="conversions" name="Conversions" fill="#00d4aa" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Weekly Conversion Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="clicks" name="Clicks" stroke="#00a3cc" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#00d4aa" strokeWidth={2} dot={{ fill: '#00d4aa' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conversion Details by Campaign</CardTitle>
                <button onClick={handleCsvExport} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="h-4 w-4" /> Export CSV
                </button>
              </div>
            </CardHeader>
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
                      <div className="w-full bg-muted rounded-md h-2">
                        <div className="h-2 rounded-md" style={{ width: `${Math.min(cvr * 10, 100)}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
