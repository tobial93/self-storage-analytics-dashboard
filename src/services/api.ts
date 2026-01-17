const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred')
    }

    return data
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<ApiResponse<{ user: User; token: string; refreshToken: string }>>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    )
  }

  async getMe() {
    return this.request<ApiResponse<{ user: User }>>('/auth/me')
  }

  // Metrics endpoints
  async getDashboard() {
    return this.request<ApiResponse<DashboardData>>('/metrics/dashboard')
  }

  async getMetrics(params?: { startMonth?: string; endMonth?: string; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.startMonth) query.append('startMonth', params.startMonth)
    if (params?.endMonth) query.append('endMonth', params.endMonth)
    if (params?.limit) query.append('limit', params.limit.toString())

    return this.request<ApiResponse<{ metrics: Metric[] }>>(`/metrics?${query}`)
  }

  async getRevenueAnalytics(months?: number) {
    const query = months ? `?months=${months}` : ''
    return this.request<ApiResponse<RevenueAnalytics>>(`/metrics/revenue${query}`)
  }

  async getOccupancyAnalytics(months?: number) {
    const query = months ? `?months=${months}` : ''
    return this.request<ApiResponse<OccupancyAnalytics>>(`/metrics/occupancy${query}`)
  }

  // Units endpoints
  async getUnits(params?: {
    page?: number
    limit?: number
    size?: string
    occupied?: boolean
    search?: string
  }) {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.size) query.append('size', params.size)
    if (params?.occupied !== undefined) query.append('occupied', params.occupied.toString())
    if (params?.search) query.append('search', params.search)

    return this.request<PaginatedResponse<Unit>>(`/units?${query}`)
  }

  async getUnitStats() {
    return this.request<ApiResponse<UnitStats>>('/units/stats')
  }

  async getUnitById(id: string) {
    return this.request<ApiResponse<{ unit: Unit }>>(`/units/${id}`)
  }

  // Customers endpoints
  async getCustomers(params?: {
    page?: number
    limit?: number
    type?: string
    active?: boolean
    search?: string
  }) {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.type) query.append('type', params.type)
    if (params?.active !== undefined) query.append('active', params.active.toString())
    if (params?.search) query.append('search', params.search)

    return this.request<PaginatedResponse<Customer>>(`/customers?${query}`)
  }

  async getCustomerStats() {
    return this.request<ApiResponse<CustomerStats>>('/customers/stats')
  }

  async getCustomerById(id: string) {
    return this.request<ApiResponse<{ customer: Customer }>>(`/customers/${id}`)
  }
}

// Types
export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'manager' | 'staff'
  isActive: boolean
  lastLogin: string | null
}

export interface Unit {
  id: string
  size: string
  pricePerMonth: number
  isOccupied: boolean
  customerId: string | null
  rentedSince: string | null
  floor: number
  notes: string | null
  customer?: {
    id: string
    name: string
    type: string
  }
}

export interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  type: 'private' | 'business'
  companyName: string | null
  address: string | null
  startDate: string
  endDate: string | null
  notes: string | null
  units?: Unit[]
}

export interface Metric {
  id: number
  month: string
  totalRevenue: number
  occupancyRate: number
  totalUnits: number
  occupiedUnits: number
  newCustomers: number
  churnedCustomers: number
  averageRentalDuration: number | null
  revenueBySize: Record<string, number>
  occupancyBySize: Record<string, { total: number; occupied: number; rate: string }>
}

export interface DashboardData {
  overview: {
    totalUnits: number
    occupiedUnits: number
    availableUnits: number
    occupancyRate: string
    totalCustomers: number
    activeCustomers: number
    currentRevenue: number
    potentialRevenue: number
    revenueUtilization: string
  }
  trends: {
    revenueChange: number
    occupancyChange: number
  }
  historicalMetrics: Metric[]
}

export interface UnitStats {
  totalUnits: number
  occupiedUnits: number
  availableUnits: number
  occupancyRate: number
  bySize: Array<{
    size: string
    total: number
    occupied: number
    available: number
    occupancyRate: string
  }>
  avgPriceBySize: Record<string, string>
  totalPotentialRevenue: number
  currentMonthlyRevenue: number
  revenueUtilization: string
}

export interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  byType: Record<string, number>
  newThisMonth: number
  churnedThisMonth: number
  churnRate: string
}

export interface RevenueAnalytics {
  currentRevenue: number
  potentialRevenue: number
  lostRevenue: number
  revenueBySize: Array<{
    size: string
    revenue: number
    units: number
  }>
  monthlyTrend: Metric[]
}

export interface OccupancyAnalytics {
  currentOccupancy: Array<{
    size: string
    total: number
    occupied: number
    available: number
    rate: string
  }>
  monthlyTrend: Metric[]
}

export const api = new ApiService()
