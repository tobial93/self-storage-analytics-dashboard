import { Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Feature } from '@/lib/featureGating'
import { getMinTierLabel } from '@/lib/featureGating'

interface UpgradePromptProps {
  feature: Feature
  /** Optional custom message override */
  message?: string
}

export function UpgradePrompt({ feature, message }: UpgradePromptProps) {
  const tierLabel = getMinTierLabel(feature)

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Lock className="h-6 w-6 text-muted-foreground mb-3" />
      <p className="text-sm font-medium">
        {message || `This feature requires the ${tierLabel} plan or higher.`}
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Upgrade your subscription to unlock this feature.
      </p>
      <Link
        to="/settings"
        className="mt-4 inline-flex items-center px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        View plans
      </Link>
    </div>
  )
}
