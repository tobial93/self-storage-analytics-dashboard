import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { KPICard } from '@/components/cards/KPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/ui/skeleton'
import { useLoading } from '@/hooks/useLoading'
import {
  mockConversionFunnel,
  mockAttributionData,
  mockDashboardSummary,
  formatPercentage,
  formatNumber,
} from '@/data/mockData'
import { Target, TrendingUp, DollarSign } from 'lucide-react'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function CustomerAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonChart height={400} />
        <SkeletonChart height={400} />
      </div>
      <SkeletonTable rows={6} />
    </div>
  )
}

export function CustomerAnalytics() {
  const isLoading = useLoading(1000)
  const funnelData = mockConversionFunnel
  const attributionData = mockAttributionData
  const summary = mockDashboardSummary

  if (isLoading) {
    return <CustomerAnalyticsSkeleton />
  }

  // Calculate conversion metrics
  const totalImpressions = funnelData[0].users
  const totalConversions = funnelData[funnelData.length - 1].users
  const overallConversionRate = (totalConversions / totalImpressions) * 100

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Conversions"
          value={summary.totalConversions.toLocaleString()}
          change={summary.conversionsChange}
          changeLabel="vs. last month"
          icon={Target}
          iconColor="text-blue-500"
        />
        <KPICard
          title="Conversion Rate"
          value={formatPercentage(overallConversionRate)}
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <KPICard
          title="Cost per Conversion"
          value={`$${summary.overallCPA.toFixed(2)}`}
          change={-summary.cpaChange}
          changeLabel="vs. last month"
          icon={DollarSign}
          iconColor="text-purple-500"
          invertChange
        />
        <KPICard
          title="Revenue per Conversion"
          value={`$${(summary.totalRevenue / summary.totalConversions).toFixed(2)}`}
          icon={TrendingUp}
          iconColor="text-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((stage, index) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold">{formatNumber(stage.users)}</span>
                      {index > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({formatPercentage(stage.conversionRate)})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-8">
                    <div
                      className="h-8 rounded-full flex items-center justify-end px-3 text-white text-xs font-medium transition-all"
                      style={{
                        width: `${stage.conversionRate}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    >
                      {stage.dropoffRate > 0 && (
                        <span className="opacity-80">-{formatPercentage(stage.dropoffRate)} drop</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Multi-Touch Attribution */}
        <Card>
          <CardHeader>
            <CardTitle>Attribution Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="channel"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="firstTouch" name="First Touch" fill="#3b82f6" />
                  <Bar dataKey="lastTouch" name="Last Touch" fill="#22c55e" />
                  <Bar dataKey="linear" name="Linear" fill="#f59e0b" />
                  <Bar dataKey="timeDecay" name="Time Decay" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attribution Table */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Attribution Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">First Touch</TableHead>
                <TableHead className="text-right">Last Touch</TableHead>
                <TableHead className="text-right">Linear</TableHead>
                <TableHead className="text-right">Time Decay</TableHead>
                <TableHead className="text-right">Total (Linear)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributionData.map((channel) => {
                const totalLinear = attributionData.reduce((sum, c) => sum + c.linear, 0)
                const sharePercent = (channel.linear / totalLinear) * 100

                return (
                  <TableRow key={channel.channel}>
                    <TableCell className="font-medium">{channel.channel}</TableCell>
                    <TableCell className="text-right">{channel.firstTouch}</TableCell>
                    <TableCell className="text-right">{channel.lastTouch}</TableCell>
                    <TableCell className="text-right font-semibold">{channel.linear}</TableCell>
                    <TableCell className="text-right">{channel.timeDecay}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${sharePercent}%` }}
                          />
                        </div>
                        <span className="text-sm">{formatPercentage(sharePercent, 0)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
