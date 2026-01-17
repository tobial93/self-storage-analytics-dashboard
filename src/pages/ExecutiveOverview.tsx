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
} from 'recharts'
import { KPICard } from '@/components/cards/KPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard, SkeletonChart } from '@/components/ui/skeleton'
import { useDashboard, useUnitStats } from '@/hooks/useApi'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Percent, Euro, Box, Clock } from 'lucide-react'

function ExecutiveOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart height={300} />
        <SkeletonChart height={300} />
      </div>
      <SkeletonChart height={250} />
    </div>
  )
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-red-500 mb-2">Error loading data</p>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  )
}

export function ExecutiveOverview() {
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboard()
  const { data: unitStats, isLoading: statsLoading, error: statsError } = useUnitStats()

  const isLoading = dashboardLoading || statsLoading
  const error = dashboardError || statsError

  if (isLoading) {
    return <ExecutiveOverviewSkeleton />
  }

  if (error || !dashboardData || !unitStats) {
    return <ErrorDisplay message={error || 'Failed to load data'} />
  }

  const { overview, trends, historicalMetrics } = dashboardData

  // Transform historical metrics for charts
  const revenueChartData = historicalMetrics.map((m) => ({
    month: m.month.substring(5), // Extract MM from YYYY-MM
    revenue: m.totalRevenue,
  }))

  const occupancyChartData = historicalMetrics.map((m) => ({
    month: m.month.substring(5),
    occupancyRate: parseFloat(String(m.occupancyRate)),
  }))

  // Transform unit stats by size for bar chart
  const unitSizeData = unitStats.bySize.map((item) => ({
    size: item.size,
    occupiedUnits: item.occupied,
    availableUnits: item.available,
  }))

  // Calculate average rental duration from metrics
  const avgRentalDuration = historicalMetrics.length > 0
    ? (historicalMetrics.reduce((sum, m) => sum + (m.averageRentalDuration || 0), 0) / historicalMetrics.length).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Belegungsrate"
          value={formatPercent(parseFloat(overview.occupancyRate))}
          change={trends.occupancyChange}
          changeLabel="vs. Vormonat"
          icon={Percent}
          iconColor="text-blue-500"
        />
        <KPICard
          title="Monatlicher Umsatz"
          value={formatCurrency(overview.currentRevenue)}
          change={trends.revenueChange}
          changeLabel="vs. Vormonat"
          icon={Euro}
          iconColor="text-green-500"
        />
        <KPICard
          title="Verfügbare Einheiten"
          value={`${overview.availableUnits} / ${overview.totalUnits}`}
          icon={Box}
          iconColor="text-orange-500"
        />
        <KPICard
          title="Ø Mietdauer"
          value={`${avgRentalDuration} Monate`}
          icon={Clock}
          iconColor="text-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Umsatzentwicklung (12 Monate)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
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
                    formatter={(value) => [formatCurrency(Number(value)), 'Umsatz']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Units by Size */}
        <Card>
          <CardHeader>
            <CardTitle>Einheiten nach Größe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitSizeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="size"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="occupiedUnits"
                    name="Belegt"
                    fill="hsl(var(--primary))"
                    stackId="a"
                  />
                  <Bar
                    dataKey="availableUnits"
                    name="Verfügbar"
                    fill="hsl(var(--muted))"
                    stackId="a"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Belegungsrate (12 Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancyChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  domain={[70, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`${value}%`, 'Belegung']}
                />
                <Line
                  type="monotone"
                  dataKey="occupancyRate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
