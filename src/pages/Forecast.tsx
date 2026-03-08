import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '@/components/cards/KPICard'
import { SkeletonCard, SkeletonChart } from '@/components/ui/skeleton'
import { useMetricsByDateRange } from '@/hooks/useApiData'
import { TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { useMemo } from 'react'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

function ForecastSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      <SkeletonChart height={350} />
      <SkeletonChart height={300} />
    </div>
  )
}

export function Forecast() {
  const endDate = useMemo(() => new Date(), [])
  const startDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d }, [])

  const { data: metrics, isLoading } = useMetricsByDateRange(startDate, endDate)

  const dailyData = useMemo(() => {
    if (!metrics) return []
    const byDate: Record<string, { date: string; revenue: number; spend: number; conversions: number }> = {}
    for (const m of metrics) {
      const d = m.metric_date
      if (!d) continue
      if (!byDate[d]) byDate[d] = { date: d, revenue: 0, spend: 0, conversions: 0 }
      byDate[d].revenue += Number(m.revenue || 0)
      byDate[d].spend += Number(m.spend || 0)
      byDate[d].conversions += Number(m.conversions || 0)
    }
    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
  }, [metrics])

  const forecastData = useMemo(() => {
    if (dailyData.length < 7) return []
    const last7 = dailyData.slice(-7)
    const avgRevenue = last7.reduce((s, d) => s + d.revenue, 0) / 7
    const avgSpend = last7.reduce((s, d) => s + d.spend, 0) / 7
    const trend = dailyData.length > 14
      ? (dailyData.slice(-7).reduce((s, d) => s + d.revenue, 0) / 7) /
        (dailyData.slice(-14, -7).reduce((s, d) => s + d.revenue, 0) / 7)
      : 1

    const historical = dailyData.map(d => ({
      date: d.date.slice(5),
      actual: Math.round(d.revenue),
      spend: Math.round(d.spend),
    }))

    const forecasted = Array.from({ length: 14 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() + i + 1)
      const growth = Math.pow(trend, (i + 1) / 7)
      const forecast = Math.round(avgRevenue * growth)
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        forecast,
        upperBound: Math.round(forecast * 1.15),
        lowerBound: Math.round(forecast * 0.85),
        spendForecast: Math.round(avgSpend),
      }
    })

    return [...historical, ...forecasted]
  }, [dailyData])

  const roasTrend = useMemo(() => {
    if (dailyData.length === 0) return []
    const weeks: { week: string; roas: number; revenue: number; spend: number }[] = []
    for (let i = 0; i < dailyData.length; i += 7) {
      const chunk = dailyData.slice(i, i + 7)
      const revenue = chunk.reduce((s, d) => s + d.revenue, 0)
      const spend = chunk.reduce((s, d) => s + d.spend, 0)
      weeks.push({
        week: `W${Math.floor(i / 7) + 1}`,
        roas: spend > 0 ? Math.round((revenue / spend) * 100) / 100 : 0,
        revenue: Math.round(revenue),
        spend: Math.round(spend),
      })
    }
    return weeks
  }, [dailyData])

  if (isLoading) return <ForecastSkeleton />

  if (!metrics?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium">No data to forecast</p>
        <p className="text-sm text-muted-foreground mt-1">Sync at least 7 days of campaign data to generate forecasts.</p>
      </div>
    )
  }

  const totalRevenue = dailyData.reduce((s, d) => s + d.revenue, 0)
  const totalSpend = dailyData.reduce((s, d) => s + d.spend, 0)
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const forecastedRevenue = forecastData.filter(d => 'forecast' in d && d.forecast).reduce((s, d) => s + (('forecast' in d ? d.forecast : 0) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard title="14-Day Revenue Forecast" value={formatCurrency(forecastedRevenue)} change={0} changeLabel="next 14 days" icon={TrendingUp} iconColor="text-muted-foreground" />
        <KPICard title="Avg ROAS (30 days)" value={`${avgRoas.toFixed(2)}x`} change={0} changeLabel="actual" icon={DollarSign} iconColor="text-muted-foreground" />
        <KPICard title="Total Ad Spend" value={formatCurrency(totalSpend)} change={0} changeLabel="last 30 days" icon={Calendar} iconColor="text-muted-foreground" />
      </div>

      <Card>
        <CardHeader><CardTitle>Revenue Forecast (Actual + Next 14 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00a3cc" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00a3cc" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4aa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00d4aa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} className="text-xs" interval={4} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Legend />
                <Area type="monotone" dataKey="actual" name="Actual Revenue" stroke="#00a3cc" strokeWidth={2} fill="url(#colorActual)" connectNulls />
                <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#00d4aa" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorForecast)" connectNulls />
                <Area type="monotone" dataKey="upperBound" name="Upper Bound" stroke="#f5a623" strokeWidth={1} strokeOpacity={0.5} fill="transparent" connectNulls />
                <Area type="monotone" dataKey="lowerBound" name="Lower Bound" stroke="#f5a623" strokeWidth={1} strokeOpacity={0.5} fill="transparent" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Weekly ROAS Trend</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roasTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}x`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                  formatter={(v, name) => name === 'ROAS' ? [`${Number(v).toFixed(2)}x`, name] : [formatCurrency(Number(v)), name]}
                />
                <Legend />
                <Line type="monotone" dataKey="roas" name="ROAS" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights — simple text list, no decorative boxes */}
      <Card>
        <CardHeader><CardTitle>Forecast Insights</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground shrink-0">1.</span>
              <p>Based on the last 7 days, projected revenue is {formatCurrency(forecastedRevenue)} over the next 14 days (±15% confidence).</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground shrink-0">2.</span>
              <p>Average ROAS of {avgRoas.toFixed(2)}x indicates {avgRoas >= 4 ? 'strong' : avgRoas >= 2.5 ? 'healthy' : 'below-average'} campaign efficiency.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground shrink-0">3.</span>
              <p>Connect additional ad platforms for more accurate forecasting based on historical seasonal trends.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
