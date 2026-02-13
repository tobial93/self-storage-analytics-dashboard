import { Settings as SettingsIcon, Building2, CreditCard, Users } from 'lucide-react'
import { useCurrentOrganization } from '@/contexts/OrganizationContext'

export function Settings() {
  const { organizationName, userRole } = useCurrentOrganization()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Manage your organization and account settings
        </p>
      </div>

      {/* Organization Info */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Organization</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Organization Name</label>
            <p className="text-sm text-muted-foreground mt-1">
              {organizationName || 'No organization selected'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Your Role</label>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              {userRole || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* White-Label Settings */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">White-Label Branding</h3>
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">
            Coming in Phase 7
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Customize the dashboard with your agency's branding
        </p>
        <div className="space-y-4 opacity-50">
          <div>
            <label className="text-sm font-medium">Company Logo</label>
            <div className="mt-2 h-10 border-2 border-dashed rounded-md flex items-center justify-center text-sm text-muted-foreground">
              Upload logo (coming soon)
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Primary Color</label>
            <div className="mt-2 flex gap-2">
              <input type="color" disabled className="h-10 w-20 rounded cursor-not-allowed" />
              <span className="text-sm text-muted-foreground">Coming soon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Management */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Team Members</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Manage team members through the Clerk dashboard. Click your profile picture in the
          header, then select "Manage organization" to invite members.
        </p>
      </div>

      {/* Subscription */}
      <div className="border rounded-lg p-6 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Subscription & Billing</h3>
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded">
            Coming in Phase 7
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your subscription plan and billing information
        </p>
        <div className="space-y-3 opacity-50">
          <div>
            <label className="text-sm font-medium">Current Plan</label>
            <p className="text-sm text-muted-foreground mt-1">Free Plan</p>
          </div>
          <button
            disabled
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md opacity-50 cursor-not-allowed"
          >
            Upgrade Plan (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}
