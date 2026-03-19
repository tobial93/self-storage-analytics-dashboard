import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LandingGate } from '@/pages/LandingGate'

// Lazy-loaded route components
const ExecutiveOverview = lazy(() => import('@/pages/ExecutiveOverview').then(m => ({ default: m.ExecutiveOverview })))
const UnitPerformance = lazy(() => import('@/pages/UnitPerformance').then(m => ({ default: m.UnitPerformance })))
const CustomerAnalytics = lazy(() => import('@/pages/CustomerAnalytics').then(m => ({ default: m.CustomerAnalytics })))
const Forecast = lazy(() => import('@/pages/Forecast').then(m => ({ default: m.Forecast })))
const Integrations = lazy(() => import('@/pages/Integrations').then(m => ({ default: m.Integrations })))
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })))
const SignIn = lazy(() => import('@/pages/auth/SignIn').then(m => ({ default: m.SignIn })))
const SignUp = lazy(() => import('@/pages/auth/SignUp').then(m => ({ default: m.SignUp })))
const CreateOrganization = lazy(() => import('@/pages/auth/CreateOrganization').then(m => ({ default: m.CreateOrganization })))
const OAuthCallback = lazy(() => import('@/pages/auth/OAuthCallback').then(m => ({ default: m.OAuthCallback })))
const Onboarding = lazy(() => import('@/pages/Onboarding').then(m => ({ default: m.Onboarding })))
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })))
const TermsOfService = lazy(() => import('@/pages/TermsOfService').then(m => ({ default: m.TermsOfService })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

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
          <ErrorBoundary>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/sign-in/*" element={<SignIn />} />
                  <Route path="/sign-up/*" element={<SignUp />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />

                  {/* All other routes go through LandingGate */}
                  <Route
                    path="/*"
                    element={
                      <LandingGate>
                        <OrganizationProvider>
                          <Routes>
                            <Route path="/create-organization/*" element={<CreateOrganization />} />
                            <Route path="/integrations/callback" element={<OAuthCallback />} />
                            <Route path="/onboarding" element={<Onboarding />} />
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
                      </LandingGate>
                    }
                  />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ErrorBoundary>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ClerkProvider>
  )
}

export default App
