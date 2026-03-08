import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useCurrentOrganization } from '@/contexts/OrganizationContext'

const pageTitles: Record<string, string> = {
  '/': 'Executive Overview',
  '/units': 'Unit Performance',
  '/customers': 'Customer Analytics',
  '/forecast': 'Forecast & Recommendations',
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] || 'Dashboard'
  const { onboardingCompleted, isLoading } = useCurrentOrganization()

  useEffect(() => {
    // Only redirect when fully loaded and onboarding is definitively false (not null)
    if (!isLoading && onboardingCompleted === false) {
      navigate('/onboarding', { replace: true })
    }
  }, [isLoading, onboardingCompleted, navigate])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
