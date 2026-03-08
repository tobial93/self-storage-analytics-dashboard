import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  invertChange?: boolean
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  invertChange = false,
}: KPICardProps) {
  const isPositive = invertChange ? (change && change < 0) : (change && change > 0)
  const isNegative = invertChange ? (change && change > 0) : (change && change < 0)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                <span
                  className={cn(
                    'text-sm',
                    isPositive && 'text-green-600',
                    isNegative && 'text-red-600',
                    !isPositive && !isNegative && 'text-muted-foreground'
                  )}
                >
                  {change > 0 && '+'}
                  {change.toFixed(1)}%
                </span>
                {changeLabel && (
                  <span className="text-sm text-muted-foreground">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          <Icon className={cn('h-5 w-5 mt-0.5', iconColor)} />
        </div>
      </CardContent>
    </Card>
  )
}
