import { useAuth } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'
import { Landing } from '@/pages/Landing'
import type { ReactNode } from 'react'

interface LandingGateProps {
  children: ReactNode
}

/**
 * Shows the landing page to unauthenticated users visiting `/`.
 * For all other routes, redirects unauthenticated users to `/sign-in`.
 * Authenticated users pass through to children.
 */
export function LandingGate({ children }: LandingGateProps) {
  const { isSignedIn, isLoaded } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isSignedIn) {
    // Show landing page at root path
    if (location.pathname === '/') {
      return <Landing />
    }
    // Redirect all other paths to sign-in
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  return <>{children}</>
}
