import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
import { useLoading } from '@/hooks/useLoading'
import { mockForecastData, mockMonthlyMetrics, formatCurrency } from '@/data/mockData'
import { TrendingUp, Calendar, DollarSign } from 'lucide-react'

function ForecastSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonChart height={350} />
      <SkeletonChart height={300} />
    </div>
  )
}

export function Forecast() {
  const isLoading = useLoading(1000)
  const forecastData = mockForecastData
  const monthlyData = mockMonthlyMetrics

  if (isLoading) {
    return <ForecastSkeleton />
  }

  // Calculate forecast metrics
  const nextMonthForecast = forecastData.find(d => d.forecast)
  const lastActual = forecastData.filter(d => d.actual).slice(-1)[0]
  const forecastGrowth = nextMonthForecast && lastActual
    ? ((nextMonthForecast.forecast! - lastActual.actual!) / lastActual.actual!) * 100
    : 0

  // Calculate average monthly growth from historical data
  const avgMonthlyGrowth = monthlyData.reduce((sum, m) => sum + m.roas, 0) / monthlyData.length

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="Next Month Forecast"
          value={nextMonthForecast ? formatCurrency(nextMonthForecast.forecast!) : 'N/A'}
          change={forecastGrowth}
          changeLabel="vs. current month"
          icon={TrendingUp}
          iconColor="text-blue-500"
        />
        <KPICard
          title="Forecast Confidence"
          value="87%"
          icon={Calendar}
          iconColor="text-green-500"
        />
        <KPICard
          title="Avg ROAS Trend"
          value={`${avgMonthlyGrowth.toFixed(2)}x`}
          icon={DollarSign}
          iconColor="text-purple-500"
        />
      </div>

      {/* Revenue Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast (Next 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="actual"
                  name="Actual Revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorActual)"
                />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#colorForecast)"
                />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  name="Upper Bound"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  fill="url(#colorRange)"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  name="Lower Bound"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ROAS Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Historical ROAS Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}x`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`${(value as number).toFixed(2)}x`, 'ROAS']}
                />
                <Line
                  type="monotone"
                  dataKey="roas"
                  name="ROAS"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Projected Growth
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Revenue is expected to increase by {forecastGrowth.toFixed(1)}% next month based on
                  current trends and seasonality patterns.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 dark:text-green-100">
                  Seasonality Pattern
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Historical data shows stronger performance in Q4, with a 12-15% increase in conversions
                  compared to other quarters.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <DollarSign className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                  ROAS Stability
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  Your ROAS has remained stable at 4.2-4.5x over the past 6 months, indicating
                  consistent campaign performance.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
