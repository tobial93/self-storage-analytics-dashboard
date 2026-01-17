import { useState, useEffect, useCallback } from 'react'
import { api, DashboardData, UnitStats, CustomerStats, RevenueAnalytics, OccupancyAnalytics, Metric, Customer, Unit } from '@/services/api'

interface UseApiState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

function useApiCall<T>(
  fetchFn: () => Promise<{ data: T }>,
  deps: unknown[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchFn()
      setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, deps)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}

// Dashboard hook
export function useDashboard(): UseApiState<DashboardData> {
  return useApiCall(() => api.getDashboard(), [])
}

// Metrics hooks
export function useMetrics(params?: { startMonth?: string; endMonth?: string; limit?: number }): UseApiState<{ metrics: Metric[] }> {
  return useApiCall(
    () => api.getMetrics(params),
    [params?.startMonth, params?.endMonth, params?.limit]
  )
}

export function useRevenueAnalytics(months?: number): UseApiState<RevenueAnalytics> {
  return useApiCall(() => api.getRevenueAnalytics(months), [months])
}

export function useOccupancyAnalytics(months?: number): UseApiState<OccupancyAnalytics> {
  return useApiCall(() => api.getOccupancyAnalytics(months), [months])
}

// Units hooks
export function useUnits(params?: {
  page?: number
  limit?: number
  size?: string
  occupied?: boolean
  search?: string
}) {
  const [data, setData] = useState<Unit[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getUnits(params)
      setData(response.data)
      setPagination(response.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [params?.page, params?.limit, params?.size, params?.occupied, params?.search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, pagination, isLoading, error, refetch: fetchData }
}

export function useUnitStats(): UseApiState<UnitStats> {
  return useApiCall(() => api.getUnitStats(), [])
}

// Customers hooks
export function useCustomers(params?: {
  page?: number
  limit?: number
  type?: string
  active?: boolean
  search?: string
}) {
  const [data, setData] = useState<Customer[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.getCustomers(params)
      setData(response.data)
      setPagination(response.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [params?.page, params?.limit, params?.type, params?.active, params?.search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, pagination, isLoading, error, refetch: fetchData }
}

export function useCustomerStats(): UseApiState<CustomerStats> {
  return useApiCall(() => api.getCustomerStats(), [])
}
