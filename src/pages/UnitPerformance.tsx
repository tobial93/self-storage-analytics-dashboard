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
import { useLoading } from '@/hooks/useLoading'
import {
  mockCampaignPerformance,
  mockCampaigns,
  formatCurrency,
  formatPercentage,
  getPlatformColor,
  getPlatformName,
} from '@/data/mockData'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'

function UnitPerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonChart height={300} />
      <SkeletonTable rows={6} />
    </div>
  )
}

export function UnitPerformance() {
  const isLoading = useLoading(1000)
  const campaignData = mockCampaignPerformance
  const activeCampaigns = mockCampaigns.filter(c => c.status === 'active')

  if (isLoading) {
    return <UnitPerformanceSkeleton />
  }

  // Find best and worst performers
  const sortedByROAS = [...campaignData].sort((a, b) => b.roas - a.roas)
  const bestPerformer = sortedByROAS[0]
  const worstPerformer = sortedByROAS[sortedByROAS.length - 1]

  // Calculate average budget utilization
  const avgBudgetUtilization = campaignData.reduce((sum, c) => sum + c.budgetUtilization, 0) / campaignData.length

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
                <p className="text-sm text-muted-foreground">Top Campaign</p>
                <p className="text-lg font-bold truncate max-w-[150px]">{bestPerformer.campaignName}</p>
                <p className="text-sm text-green-600">
                  ROAS: {bestPerformer.roas.toFixed(2)}x
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
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-lg font-bold truncate max-w-[150px]">{worstPerformer.campaignName}</p>
                <p className="text-sm text-red-600">
                  ROAS: {worstPerformer.roas.toFixed(2)}x
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Budget Used</p>
                <p className="text-2xl font-bold">{avgBudgetUtilization.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">across {activeCampaigns.length} campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROAS by Campaign Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance (ROAS)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  type="number"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}x`}
                />
                <YAxis
                  type="category"
                  dataKey="campaignName"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [`${Number(value).toFixed(2)}x`, 'ROAS']}
                />
                <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
                  {campaignData.map((entry) => (
                    <Cell key={entry.campaignId} fill={getPlatformColor(entry.platform)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Campaign Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">CPA</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignData.map((campaign) => (
                <TableRow key={campaign.campaignId}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {campaign.campaignName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      style={{ borderColor: getPlatformColor(campaign.platform) }}
                    >
                      {getPlatformName(campaign.platform)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(campaign.spend)}
                  </TableCell>
                  <TableCell className="text-right text-green-600 font-medium">
                    {formatCurrency(campaign.revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        campaign.roas >= 5
                          ? 'text-green-600 font-semibold'
                          : campaign.roas >= 3
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }
                    >
                      {campaign.roas.toFixed(2)}x
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.conversions}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(campaign.cpa)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercentage(campaign.ctr)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        campaign.performance === 'excellent'
                          ? 'default'
                          : campaign.performance === 'good'
                          ? 'secondary'
                          : 'outline'
                      }
                      className={
                        campaign.performance === 'excellent'
                          ? 'bg-green-500'
                          : campaign.performance === 'good'
                          ? 'bg-blue-500'
                          : ''
                      }
                    >
                      {campaign.performance}
                    </Badge>
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
