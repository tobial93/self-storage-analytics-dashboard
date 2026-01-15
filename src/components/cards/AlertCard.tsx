import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PricingAlert } from '@/data/types'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

interface AlertCardProps {
  alerts: PricingAlert[]
}

export function AlertCard({ alerts }: AlertCardProps) {
  const getPriorityVariant = (priority: PricingAlert['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'warning'
      case 'low':
        return 'secondary'
    }
  }

  const getPriorityLabel = (priority: PricingAlert['priority']) => {
    switch (priority) {
      case 'high':
        return 'Hoch'
      case 'medium':
        return 'Mittel'
      case 'low':
        return 'Niedrig'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Pricing Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Preisanpassungen empfohlen
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const isIncrease = alert.suggestedPrice > alert.currentPrice
              return (
                <div
                  key={alert.unitId}
                  className="flex items-start justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Unit {alert.unitId}</span>
                      <Badge variant="outline">{alert.size}</Badge>
                      <Badge variant={getPriorityVariant(alert.priority)}>
                        {getPriorityLabel(alert.priority)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(alert.currentPrice)}
                      </p>
                      <p className="font-medium">
                        {formatCurrency(alert.suggestedPrice)}
                      </p>
                    </div>
                    {isIncrease ? (
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
