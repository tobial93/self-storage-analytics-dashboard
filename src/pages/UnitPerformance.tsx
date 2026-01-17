import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/ui/skeleton'
import { useUnitStats, useDashboard } from '@/hooks/useApi'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

function UnitPerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonChart height={300} />
      <SkeletonTable rows={5} />
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

export function UnitPerformance() {
  const { data: unitStats, isLoading: statsLoading, error: statsError } = useUnitStats()
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboard()

  const isLoading = statsLoading || dashboardLoading
  const error = statsError || dashboardError

  if (isLoading) {
    return <UnitPerformanceSkeleton />
  }

  if (error || !unitStats || !dashboardData) {
    return <ErrorDisplay message={error || 'Failed to load data'} />
  }

  // Transform unit stats for display
  const unitSizeData = unitStats.bySize.map((item) => {
    const avgPrice = parseFloat(unitStats.avgPriceBySize[item.size] || '0')
    const sizeInSqm = parseInt(item.size.replace('m²', ''), 10)
    const revenuePerSqm = avgPrice / sizeInSqm
    const totalRevenue = item.occupied * avgPrice

    return {
      size: item.size,
      totalUnits: item.total,
      occupiedUnits: item.occupied,
      availableUnits: item.available,
      occupancyRate: parseFloat(item.occupancyRate),
      avgPrice,
      revenuePerSqm,
      totalRevenue,
    }
  })

  // Calculate most/least profitable
  const sortedByRevenue = [...unitSizeData].sort((a, b) => b.revenuePerSqm - a.revenuePerSqm)
  const mostProfitable = sortedByRevenue[0]
  const leastProfitable = sortedByRevenue[sortedByRevenue.length - 1]

  // Calculate turnover rate from historical metrics
  const lastMonth = dashboardData.historicalMetrics[dashboardData.historicalMetrics.length - 1]
  const turnoverRate = lastMonth && lastMonth.occupiedUnits > 0
    ? ((lastMonth.newCustomers + lastMonth.churnedCustomers) / lastMonth.occupiedUnits) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Profitabelste Größe</p>
                <p className="text-2xl font-bold">{mostProfitable?.size || '-'}</p>
                <p className="text-sm text-green-600">
                  {mostProfitable ? formatCurrency(mostProfitable.revenuePerSqm) : '-'}/m²
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Am wenigsten profitabel</p>
                <p className="text-2xl font-bold">{leastProfitable?.size || '-'}</p>
                <p className="text-sm text-red-600">
                  {leastProfitable ? formatCurrency(leastProfitable.revenuePerSqm) : '-'}/m²
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Minus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Einheiten-Fluktuation</p>
                <p className="text-2xl font-bold">{turnoverRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">pro Monat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy by Size Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Belegungsrate nach Größe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={unitSizeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="size"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  domain={[0, 100]}
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
                <Bar dataKey="occupancyRate" radius={[4, 4, 0, 0]}>
                  {unitSizeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Umsatz pro Quadratmeter</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Größe</TableHead>
                <TableHead className="text-right">Einheiten</TableHead>
                <TableHead className="text-right">Belegt</TableHead>
                <TableHead className="text-right">Belegung</TableHead>
                <TableHead className="text-right">Ø Preis</TableHead>
                <TableHead className="text-right">€/m²</TableHead>
                <TableHead className="text-right">Gesamt</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unitSizeData.map((item, index) => {
                const avgRevenuePerSqm = unitSizeData.reduce((sum, i) => sum + i.revenuePerSqm, 0) / unitSizeData.length
                const isAboveAvg = item.revenuePerSqm > avgRevenuePerSqm

                return (
                  <TableRow key={item.size}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{ borderColor: COLORS[index % COLORS.length] }}
                      >
                        {item.size}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.totalUnits}</TableCell>
                    <TableCell className="text-right">{item.occupiedUnits}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          item.occupancyRate >= 85
                            ? 'text-green-600'
                            : item.occupancyRate >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }
                      >
                        {formatPercent(item.occupancyRate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.avgPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.revenuePerSqm)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.totalRevenue)}
                    </TableCell>
                    <TableCell>
                      {isAboveAvg ? (
                        <div className="flex items-center text-green-600">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="text-xs">Über Ø</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <ArrowDownRight className="h-4 w-4" />
                          <span className="text-xs">Unter Ø</span>
                        </div>
                      )}
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
