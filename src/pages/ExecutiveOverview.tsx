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
import { AlertCard } from '@/components/cards/AlertCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonCard, SkeletonChart } from '@/components/ui/skeleton'
import { useLoading } from '@/hooks/useLoading'
import {
  mockDashboardSummary,
  mockPlatformMetrics,
  mockMonthlyMetrics,
  mockAlerts,
  formatCurrency,
  formatPercentage,
  getPlatformColor,
  getPlatformName,
} from '@/data/mockData'
import { DollarSign, Target, TrendingUp, MousePointerClick } from 'lucide-react'

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
      <div className="grid gap-6 lg:grid-cols-3">
        <SkeletonChart height={250} />
        <SkeletonChart height={250} />
        <SkeletonChart height={250} />
      </div>
    </div>
  )
}

export function ExecutiveOverview() {
  const isLoading = useLoading(1000)
  const summary = mockDashboardSummary
  const platformData = mockPlatformMetrics

  if (isLoading) {
    return <ExecutiveOverviewSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Ad Spend"
          value={formatCurrency(summary.totalSpend)}
          change={summary.spendChange}
          changeLabel="vs. last month"
          icon={DollarSign}
          iconColor="text-blue-500"
        />
        <KPICard
          title="Return on Ad Spend (ROAS)"
          value={`${summary.overallROAS.toFixed(2)}x`}
          change={summary.roasChange}
          changeLabel="vs. last month"
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <KPICard
          title="Total Conversions"
          value={summary.totalConversions.toLocaleString()}
          change={summary.conversionsChange}
          changeLabel="vs. last month"
          icon={Target}
          iconColor="text-purple-500"
        />
        <KPICard
          title="Cost per Acquisition"
          value={formatCurrency(summary.overallCPA)}
          change={-summary.cpaChange}
          changeLabel="vs. last month"
          icon={MousePointerClick}
          iconColor="text-orange-500"
          invertChange
        />
      </div>

      {/* Alerts */}
      {mockAlerts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mockAlerts.slice(0, 4).map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue vs Spend Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Ad Spend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockMonthlyMetrics}>
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
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    name="Ad Spend"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance (ROAS)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="platform"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => getPlatformName(value).split(' ')[0]}
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
                    formatter={(value) => [`${Number(value).toFixed(2)}x`, 'ROAS']}
                    labelFormatter={(label) => getPlatformName(label)}
                  />
                  <Bar dataKey="roas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                    {platformData.map((entry) => (
                      <Cell key={entry.platform} fill={getPlatformColor(entry.platform)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ad Spend by Platform */}
        <Card>
          <CardHeader>
            <CardTitle>Ad Spend by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData as any}
                    dataKey="totalSpend"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${getPlatformName(entry.platform).split(' ')[0]}`}
                  >
                    {platformData.map((entry) => (
                      <Cell key={entry.platform} fill={getPlatformColor(entry.platform)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) => getPlatformName(label as any)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {platformData.map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: getPlatformColor(platform.platform) }}
                    />
                    <span className="text-sm font-medium">
                      {getPlatformName(platform.platform).split(' ')[0]}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{platform.totalConversions}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercentage(platform.conversionRate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Impressions</div>
                <div className="text-2xl font-bold">
                  {(summary.totalImpressions / 1000000).toFixed(1)}M
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Clicks</div>
                <div className="text-2xl font-bold">
                  {(summary.totalClicks / 1000).toFixed(1)}K
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Overall CTR</div>
                <div className="text-2xl font-bold">{formatPercentage(summary.overallCTR)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Active Campaigns</div>
                <div className="text-2xl font-bold">{summary.activeCampaigns}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
