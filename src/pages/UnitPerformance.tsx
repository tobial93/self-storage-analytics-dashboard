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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/ui/skeleton'
import { useCampaigns, useMetricsByDateRange } from '@/hooks/useApiData'
import { TrendingUp, TrendingDown, Target } from 'lucide-react'
import { useMemo } from 'react'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

const COLORS = ['#00d4aa', '#ff6b9d', '#f5a623', '#00a3cc', '#a78bfa']

function UnitPerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      <SkeletonChart height={300} />
      <SkeletonTable rows={6} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Target className="h-8 w-8 text-muted-foreground mb-3" />
      <p className="text-sm font-medium">No campaign data yet</p>
      <p className="text-sm text-muted-foreground mt-1">Connect an ad platform and sync to see campaign performance.</p>
    </div>
  )
}

export function UnitPerformance() {
  const endDate = useMemo(() => new Date(), [])
  const startDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d }, [])

  const { data: campaigns, isLoading: campLoading } = useCampaigns()
  const { data: metrics, isLoading: metricsLoading } = useMetricsByDateRange(startDate, endDate)

  const campaignStats = useMemo(() => {
    if (!campaigns || !metrics) return []
    const stats: Record<string, { spend: number; revenue: number; clicks: number; impressions: number; conversions: number }> = {}
    for (const m of metrics) {
      const cid = m.campaign_id
      if (!cid) continue
      if (!stats[cid]) stats[cid] = { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 }
      stats[cid].spend += Number(m.spend || 0)
      stats[cid].revenue += Number(m.revenue || 0)
      stats[cid].clicks += Number(m.clicks || 0)
      stats[cid].impressions += Number(m.impressions || 0)
      stats[cid].conversions += Number(m.conversions || 0)
    }
    return campaigns.map((c, i) => {
      const s = stats[c.id] || { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 }
      const roas = s.spend > 0 ? s.revenue / s.spend : 0
      const ctr = s.impressions > 0 ? (s.clicks / s.impressions) * 100 : 0
      const cpa = s.conversions > 0 ? s.spend / s.conversions : 0
      const performance = roas >= 5 ? 'excellent' : roas >= 3 ? 'good' : 'needs attention'
      return { ...c, ...s, roas, ctr, cpa, performance, color: COLORS[i % COLORS.length] }
    }).sort((a, b) => b.roas - a.roas)
  }, [campaigns, metrics])

  if (campLoading || metricsLoading) return <UnitPerformanceSkeleton />
  if (campaignStats.length === 0) return <EmptyState />

  const bestPerformer = campaignStats[0]
  const worstPerformer = campaignStats[campaignStats.length - 1]
  const activeCampaigns = campaignStats.filter(c => c.status === 'active')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Campaign</p>
                <p className="text-base font-semibold mt-1 truncate max-w-[180px]">{bestPerformer?.name || '—'}</p>
                <p className="text-sm text-green-600 mt-0.5">ROAS: {bestPerformer?.roas.toFixed(2)}x</p>
              </div>
              <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-base font-semibold mt-1 truncate max-w-[180px]">{worstPerformer?.name || '—'}</p>
                <p className="text-sm text-red-600 mt-0.5">ROAS: {worstPerformer?.roas.toFixed(2)}x</p>
              </div>
              <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-semibold mt-1">{activeCampaigns.length}</p>
                <p className="text-sm text-muted-foreground">of {campaignStats.length} total</p>
              </div>
              <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Campaign ROAS Comparison</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}x`} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={160} className="text-xs" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }}
                  formatter={(v) => [`${Number(v).toFixed(2)}x`, 'ROAS']}
                />
                <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
                  {campaignStats.map((c) => <Cell key={c.id} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
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
              {campaignStats.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium max-w-[180px] truncate">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.status === 'active' ? 'border-green-500 text-green-600' : 'border-yellow-500 text-yellow-600'}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(c.spend)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(c.revenue)}</TableCell>
                  <TableCell className="text-right">
                    <span className={c.roas >= 5 ? 'text-green-600 font-medium' : c.roas >= 3 ? 'text-yellow-600' : 'text-red-600'}>
                      {c.roas.toFixed(2)}x
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{c.conversions}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.cpa)}</TableCell>
                  <TableCell className="text-right">{c.ctr.toFixed(2)}%</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={c.performance === 'excellent' ? 'border-green-500 text-green-600' : c.performance === 'good' ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'}>
                      {c.performance}
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
