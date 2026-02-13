import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PerformanceAlert } from '@/data/types'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { getPlatformName } from '@/data/mockData'

interface AlertCardProps {
  alert: PerformanceAlert
}

export function AlertCard({ alert }: AlertCardProps) {
  const getSeverityIcon = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <AlertCircle className="h-4 w-4" />
      case 'low':
        return <Info className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20'
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
      case 'low':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
    }
  }

  const getSeverityTextColor = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 dark:text-red-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'low':
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  const getTypeLabel = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'budget_exceeded':
        return 'Budget Alert'
      case 'low_roas':
        return 'Low ROAS'
      case 'high_cpa':
        return 'High CPA'
      case 'low_ctr':
        return 'Low CTR'
      case 'anomaly':
        return 'Anomaly Detected'
    }
  }

  return (
    <Card className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className={`flex items-center gap-2 ${getSeverityTextColor(alert.severity)}`}>
              {getSeverityIcon(alert.severity)}
              <span className="text-sm font-semibold">{getTypeLabel(alert.type)}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {getPlatformName(alert.platform)}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium">{alert.campaignName}</p>
            <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
