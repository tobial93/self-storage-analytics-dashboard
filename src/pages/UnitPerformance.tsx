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
import { DateRangePicker, useDateRange } from '@/components/DateRangePicker'
import { exportCsv } from '@/components/CsvExport'
import { useCampaigns, useMetricsByDateRange } from '@/hooks/useApiData'
import { TrendingUp, TrendingDown, Target, Search, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCurrentOrganization } from '@/contexts/OrganizationContext'

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

export function UnitPerformance() {
  const { canAccessFeature } = useCurrentOrganization()
  const { range, setRange, startDate, endDate } = useDateRange()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'roas' | 'spend' | 'revenue' | 'conversions' | 'cpa'>('roas')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

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
    })
  }, [campaigns, metrics])

  const platforms = useMemo(() => {
    const set = new Set(campaignStats.map(c => c.platform))
    return Array.from(set)
  }, [campaignStats])

  const filtered = useMemo(() => {
    let result = campaignStats
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(c => c.name.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter)
    }
    if (platformFilter !== 'all') {
      result = result.filter(c => c.platform === platformFilter)
    }
    result.sort((a, b) => {
      const av = a[sortField] as number
      const bv = b[sortField] as number
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return result
  }, [campaignStats, searchQuery, statusFilter, platformFilter, sortField, sortDir])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortIndicator = (field: typeof sortField) =>
    sortField === field ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''

  const handleCsvExport = () => {
    exportCsv({
      data: filtered.map(c => ({
        name: c.name,
        platform: c.platform,
        status: c.status,
        spend: c.spend.toFixed(2),
        revenue: c.revenue.toFixed(2),
        roas: c.roas.toFixed(2),
        conversions: c.conversions,
        cpa: c.cpa.toFixed(2),
        ctr: c.ctr.toFixed(2),
      })),
      filename: `campaigns_${range.label}`,
      columns: [
        { key: 'name', label: 'Campaign' },
        { key: 'platform', label: 'Platform' },
        { key: 'status', label: 'Status' },
        { key: 'spend', label: 'Spend' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'roas', label: 'ROAS' },
        { key: 'conversions', label: 'Conversions' },
        { key: 'cpa', label: 'CPA' },
        { key: 'ctr', label: 'CTR %' },
      ],
    })
  }

  const isLoading = campLoading || metricsLoading

  const bestPerformer = campaignStats.length > 0 ? [...campaignStats].sort((a, b) => b.roas - a.roas)[0] : null
  const worstPerformer = campaignStats.length > 0 ? [...campaignStats].sort((a, b) => a.roas - b.roas)[0] : null
  const activeCampaigns = campaignStats.filter(c => c.status === 'active')

  return (
    <div className="space-y-6">
      <DateRangePicker value={range} onChange={setRange} />

      {isLoading ? (
        <UnitPerformanceSkeleton />
      ) : campaignStats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No campaign data yet</p>
          <p className="text-sm text-muted-foreground mt-1">Connect an ad platform and sync to see campaign performance.</p>
        </div>
      ) : (
        <>
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
                  <BarChart data={filtered.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}x`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={160} className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }} formatter={(v) => [`${Number(v).toFixed(2)}x`, 'ROAS']} />
                    <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
                      {filtered.slice(0, 10).map((c) => <Cell key={c.id} fill={c.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Campaign Details</CardTitle>
                {canAccessFeature('csv_export') && (
                  <button onClick={handleCsvExport} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Download className="h-4 w-4" /> Export CSV
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm border rounded-md bg-background w-56"
                  />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="text-sm border rounded-md px-2 py-1.5 bg-background">
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
                {platforms.length > 1 && (
                  <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="text-sm border rounded-md px-2 py-1.5 bg-background">
                    <option value="all">All platforms</option>
                    {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}
                <span className="text-xs text-muted-foreground">{filtered.length} campaigns</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('spend')}>Spend{sortIndicator('spend')}</TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('revenue')}>Revenue{sortIndicator('revenue')}</TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('roas')}>ROAS{sortIndicator('roas')}</TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('conversions')}>Conversions{sortIndicator('conversions')}</TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('cpa')}>CPA{sortIndicator('cpa')}</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
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
        </>
      )}
    </div>
  )
}
