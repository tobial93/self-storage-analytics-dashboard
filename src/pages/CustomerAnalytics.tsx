import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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
import { Badge } from '@/components/ui/badge'
import { SkeletonCard, SkeletonChart, SkeletonPieChart, SkeletonTable } from '@/components/ui/skeleton'
import { useLoading } from '@/hooks/useLoading'
import {
  getDashboardSummary,
  getCustomerSegments,
  monthlyMetrics,
  customers,
  units,
} from '@/data/mockData'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { Users, UserMinus, Euro, Building2 } from 'lucide-react'

const COLORS = ['#3b82f6', '#22c55e']

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
        <SkeletonChart height={300} />
        <SkeletonPieChart />
      </div>
      <SkeletonTable rows={10} />
    </div>
  )
}

export function CustomerAnalytics() {
  const isLoading = useLoading(1000)
  const summary = getDashboardSummary()
  const segments = getCustomerSegments()

  if (isLoading) {
    return <CustomerAnalyticsSkeleton />
  }

  // Get top customers by units rented
  const activeCustomers = customers.filter((c) => !c.endDate)
  const customerRevenue = activeCustomers.map((customer) => {
    const customerUnits = units.filter((u) => u.customerId === customer.id)
    const monthlyRevenue = customerUnits.reduce((sum, u) => sum + u.pricePerMonth, 0)
    return {
      ...customer,
      unitsCount: customerUnits.length,
      monthlyRevenue,
    }
  }).sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 10)

  // Prepare data for new customers chart
  const customerTrendData = monthlyMetrics.map((m) => ({
    month: m.month,
    newCustomers: m.newCustomers,
    churnedCustomers: m.churnedCustomers,
    netGrowth: m.newCustomers - m.churnedCustomers,
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Aktive Kunden"
          value={summary.totalCustomers.toString()}
          icon={Users}
          iconColor="text-blue-500"
        />
        <KPICard
          title="Churn Rate"
          value={formatPercent(summary.churnRate)}
          icon={UserMinus}
          iconColor="text-red-500"
        />
        <KPICard
          title="Ø Customer Lifetime Value"
          value={formatCurrency(summary.avgCustomerLifetimeValue)}
          icon={Euro}
          iconColor="text-green-500"
        />
        <KPICard
          title="Geschäftskunden"
          value={`${segments.find((s) => s.type === 'business')?.count || 0}`}
          icon={Building2}
          iconColor="text-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Customers Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Kundenentwicklung (12 Monate)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
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
                  <Line
                    type="monotone"
                    dataKey="newCustomers"
                    name="Neue Kunden"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="churnedCustomers"
                    name="Abgegangen"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segmentation */}
        <Card>
          <CardHeader>
            <CardTitle>Kundensegmentierung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segments.map(s => ({ ...s, name: s.type === 'private' ? 'Privat' : 'Geschäft' }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {segments.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value} Kunden`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center gap-8">
              {segments.map((segment, index) => (
                <div key={segment.type} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm">
                    {segment.type === 'private' ? 'Privat' : 'Geschäft'}:{' '}
                    {segment.count} ({segment.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Kunden nach Umsatz</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kunde</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead className="text-right">Einheiten</TableHead>
                <TableHead className="text-right">Monatl. Umsatz</TableHead>
                <TableHead>Seit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerRevenue.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={customer.type === 'business' ? 'default' : 'secondary'}
                    >
                      {customer.type === 'business' ? 'Geschäft' : 'Privat'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{customer.unitsCount}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.monthlyRevenue)}
                  </TableCell>
                  <TableCell>
                    {new Date(customer.startDate).toLocaleDateString('de-DE', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
