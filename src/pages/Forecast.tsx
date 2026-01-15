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
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCard } from '@/components/cards/AlertCard'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard, SkeletonChart, Skeleton } from '@/components/ui/skeleton'
import { useLoading } from '@/hooks/useLoading'
import { getForecastData, getPricingAlerts, monthlyMetrics, getUnitSizeMetrics } from '@/data/mockData'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Calendar, AlertCircle, Lightbulb } from 'lucide-react'

function ForecastSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonChart height={350} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="p-6 pb-2">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-6 pt-2 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <SkeletonChart height={280} />
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function Forecast() {
  const isLoading = useLoading(1000)
  const forecastData = getForecastData()
  const pricingAlerts = getPricingAlerts()
  const unitSizeData = getUnitSizeMetrics()

  if (isLoading) {
    return <ForecastSkeleton />
  }

  // Calculate seasonal trends (using monthly metrics)
  const seasonalData = monthlyMetrics.map((m, index) => ({
    ...m,
    seasonalIndex: 1 + Math.sin((index - 2) * Math.PI / 6) * 0.1,
  }))

  // Pricing recommendations based on occupancy
  const pricingRecommendations = unitSizeData.map((size) => {
    let recommendation = ''
    let type: 'increase' | 'decrease' | 'maintain' = 'maintain'

    if (size.occupancyRate > 90) {
      recommendation = `Preiserhöhung um 5-10% möglich bei ${size.size} Einheiten`
      type = 'increase'
    } else if (size.occupancyRate < 70) {
      recommendation = `Preissenkung um 5% empfohlen für ${size.size} Einheiten`
      type = 'decrease'
    } else {
      recommendation = `Preise für ${size.size} Einheiten beibehalten`
      type = 'maintain'
    }

    return { size: size.size, occupancy: size.occupancyRate, recommendation, type }
  })

  // Calculate 3-month forecast summary
  const forecastOnly = forecastData.filter((d) => d.forecast)
  const totalForecast = forecastOnly.reduce((sum, d) => sum + (d.forecast || 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">3-Monats Prognose</p>
                <p className="text-2xl font-bold">{formatCurrency(totalForecast)}</p>
                <p className="text-sm text-green-600">+6% vs. Vorjahr</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preisanpassungen</p>
                <p className="text-2xl font-bold">{pricingAlerts.length}</p>
                <p className="text-sm text-muted-foreground">empfohlen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saisonaler Trend</p>
                <p className="text-2xl font-bold">Stabil</p>
                <p className="text-sm text-muted-foreground">nächste 3 Monate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>3-Monats Umsatzprognose</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value, name) => {
                    const labels: Record<string, string> = {
                      actual: 'Ist-Umsatz',
                      forecast: 'Prognose',
                      upperBound: 'Obere Grenze',
                      lowerBound: 'Untere Grenze',
                    }
                    return [formatCurrency(Number(value)), labels[String(name)] || String(name)]
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      actual: 'Ist-Umsatz',
                      forecast: 'Prognose',
                      upperBound: 'Obere Grenze',
                      lowerBound: 'Untere Grenze',
                    }
                    return labels[value] || value
                  }}
                />
                <ReferenceLine
                  x={forecastData.find((d) => d.forecast)?.month}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label={{ value: 'Prognose Start', position: 'top', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill="hsl(var(--background))"
                  fillOpacity={1}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#22c55e' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pricing Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Preisempfehlungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pricingRecommendations.map((rec) => (
                <div
                  key={rec.size}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{rec.size}</Badge>
                    <span className="text-sm">{rec.recommendation}</span>
                  </div>
                  <Badge
                    variant={
                      rec.type === 'increase'
                        ? 'success'
                        : rec.type === 'decrease'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {rec.occupancy.toFixed(0)}% belegt
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seasonal Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Saisonale Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    domain={[0.85, 1.15]}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [
                      `${(Number(value) * 100).toFixed(1)}%`,
                      'Saisonindex',
                    ]}
                  />
                  <ReferenceLine y={1} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="seasonalIndex"
                    name="Saisonindex"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Alerts */}
      <AlertCard alerts={pricingAlerts} />
    </div>
  )
}
