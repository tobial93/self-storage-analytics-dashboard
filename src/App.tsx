import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ExecutiveOverview } from '@/pages/ExecutiveOverview'
import { UnitPerformance } from '@/pages/UnitPerformance'
import { CustomerAnalytics } from '@/pages/CustomerAnalytics'
import { Forecast } from '@/pages/Forecast'
import { Integrations } from '@/pages/Integrations'
import { Settings } from '@/pages/Settings'
import { SignIn } from '@/pages/auth/SignIn'
import { SignUp } from '@/pages/auth/SignUp'
import { CreateOrganization } from '@/pages/auth/CreateOrganization'
import { OAuthCallback } from '@/pages/auth/OAuthCallback'

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env.local file.')
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
    },
  },
})

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/sign-in/*" element={<SignIn />} />
              <Route path="/sign-up/*" element={<SignUp />} />

              {/* Protected routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <OrganizationProvider>
                      <Routes>
                        <Route path="/create-organization/*" element={<CreateOrganization />} />
                        <Route path="/integrations/callback" element={<OAuthCallback />} />
                        <Route path="/" element={<DashboardLayout />}>
                          <Route index element={<ExecutiveOverview />} />
                          <Route path="units" element={<UnitPerformance />} />
                          <Route path="customers" element={<CustomerAnalytics />} />
                          <Route path="forecast" element={<Forecast />} />
                          <Route path="integrations" element={<Integrations />} />
                          <Route path="settings" element={<Settings />} />
                        </Route>
                      </Routes>
                    </OrganizationProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ClerkProvider>
  )
}

export default App
