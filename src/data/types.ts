export type UnitSize = '5m²' | '10m²' | '15m²' | '20m²' | '30m²'

export interface Unit {
  id: string
  size: UnitSize
  pricePerMonth: number
  isOccupied: boolean
  customerId?: string
  rentedSince?: string
}

export interface Customer {
  id: string
  name: string
  type: 'private' | 'business'
  startDate: string
  endDate?: string
  unitIds: string[]
}

export interface MonthlyMetrics {
  month: string
  revenue: number
  occupancyRate: number
  newCustomers: number
  churnedCustomers: number
  occupiedUnits: number
  totalUnits: number
}

export interface UnitSizeMetrics {
  size: UnitSize
  totalUnits: number
  occupiedUnits: number
  availableUnits: number
  occupancyRate: number
  revenuePerSqm: number
  totalRevenue: number
  avgPrice: number
}

export interface CustomerSegment {
  type: 'private' | 'business'
  count: number
  percentage: number
  totalRevenue: number
}

export interface PricingAlert {
  unitId: string
  size: UnitSize
  currentPrice: number
  suggestedPrice: number
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface ForecastData {
  month: string
  actual?: number
  forecast?: number
  lowerBound?: number
  upperBound?: number
}

export interface DashboardSummary {
  totalOccupancyRate: number
  monthlyRevenue: number
  revenueChangePercent: number
  revenueChangeVsLastYear: number
  avgRentalDuration: number
  totalUnits: number
  occupiedUnits: number
  availableUnits: number
  totalCustomers: number
  churnRate: number
  avgCustomerLifetimeValue: number
}
