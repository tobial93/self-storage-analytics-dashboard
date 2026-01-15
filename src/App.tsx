import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ExecutiveOverview } from '@/pages/ExecutiveOverview'
import { UnitPerformance } from '@/pages/UnitPerformance'
import { CustomerAnalytics } from '@/pages/CustomerAnalytics'
import { Forecast } from '@/pages/Forecast'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<ExecutiveOverview />} />
          <Route path="units" element={<UnitPerformance />} />
          <Route path="customers" element={<CustomerAnalytics />} />
          <Route path="forecast" element={<Forecast />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
