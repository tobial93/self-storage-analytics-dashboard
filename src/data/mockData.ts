import type {
  Unit,
  Customer,
  MonthlyMetrics,
  UnitSize,
  UnitSizeMetrics,
  CustomerSegment,
  PricingAlert,
  ForecastData,
  DashboardSummary,
} from './types'

// Unit size configurations
const unitSizeConfig: Record<UnitSize, { count: number; basePrice: number; sqm: number }> = {
  '5m²': { count: 40, basePrice: 49, sqm: 5 },
  '10m²': { count: 35, basePrice: 89, sqm: 10 },
  '15m²': { count: 25, basePrice: 129, sqm: 15 },
  '20m²': { count: 15, basePrice: 169, sqm: 20 },
  '30m²': { count: 10, basePrice: 239, sqm: 30 },
}

// Generate units
function generateUnits(): Unit[] {
  const units: Unit[] = []
  let unitId = 1

  for (const [size, config] of Object.entries(unitSizeConfig) as [UnitSize, typeof unitSizeConfig[UnitSize]][]) {
    for (let i = 0; i < config.count; i++) {
      const priceVariation = (Math.random() - 0.5) * 20
      const isOccupied = Math.random() < getOccupancyRateForSize(size)

      units.push({
        id: `U${String(unitId).padStart(3, '0')}`,
        size,
        pricePerMonth: Math.round(config.basePrice + priceVariation),
        isOccupied,
        customerId: isOccupied ? `C${String(Math.floor(Math.random() * 80) + 1).padStart(3, '0')}` : undefined,
        rentedSince: isOccupied ? getRandomPastDate() : undefined,
      })
      unitId++
    }
  }

  return units
}

function getOccupancyRateForSize(size: UnitSize): number {
  const rates: Record<UnitSize, number> = {
    '5m²': 0.92,
    '10m²': 0.88,
    '15m²': 0.82,
    '20m²': 0.75,
    '30m²': 0.65,
  }
  return rates[size]
}

function getRandomPastDate(): string {
  const months = Math.floor(Math.random() * 24) + 1
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date.toISOString().split('T')[0]
}

// Generate customers
function generateCustomers(): Customer[] {
  const customers: Customer[] = []

  for (let i = 1; i <= 85; i++) {
    const isActive = Math.random() < 0.88
    const isBusiness = Math.random() < 0.35
    const startDate = getRandomPastDate()

    customers.push({
      id: `C${String(i).padStart(3, '0')}`,
      name: isBusiness ? `Firma ${i}` : `Kunde ${i}`,
      type: isBusiness ? 'business' : 'private',
      startDate,
      endDate: isActive ? undefined : getRandomEndDate(startDate),
      unitIds: [`U${String(Math.floor(Math.random() * 125) + 1).padStart(3, '0')}`],
    })
  }

  return customers
}

function getRandomEndDate(startDate: string): string {
  const start = new Date(startDate)
  const months = Math.floor(Math.random() * 12) + 1
  start.setMonth(start.getMonth() + months)
  return start.toISOString().split('T')[0]
}

// Generate monthly metrics (last 12 months)
function generateMonthlyMetrics(): MonthlyMetrics[] {
  const metrics: MonthlyMetrics[] = []
  const currentDate = new Date()

  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate)
    date.setMonth(date.getMonth() - i)
    const monthName = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })

    // Seasonal variation
    const month = date.getMonth()
    const seasonalFactor = 1 + Math.sin((month - 2) * Math.PI / 6) * 0.1

    const baseOccupancy = 82 + Math.random() * 8
    const occupancy = baseOccupancy * seasonalFactor
    const baseRevenue = 45000 + Math.random() * 8000

    metrics.push({
      month: monthName,
      revenue: Math.round(baseRevenue * seasonalFactor),
      occupancyRate: Math.min(95, Math.round(occupancy * 10) / 10),
      newCustomers: Math.floor(5 + Math.random() * 10),
      churnedCustomers: Math.floor(2 + Math.random() * 6),
      occupiedUnits: Math.floor(125 * (occupancy / 100)),
      totalUnits: 125,
    })
  }

  return metrics
}

// Export generated data
export const units: Unit[] = generateUnits()
export const customers: Customer[] = generateCustomers()
export const monthlyMetrics: MonthlyMetrics[] = generateMonthlyMetrics()

// Computed metrics
export function getUnitSizeMetrics(): UnitSizeMetrics[] {
  const sizes: UnitSize[] = ['5m²', '10m²', '15m²', '20m²', '30m²']

  return sizes.map((size) => {
    const sizeUnits = units.filter((u) => u.size === size)
    const occupiedUnits = sizeUnits.filter((u) => u.isOccupied)
    const config = unitSizeConfig[size]
    const totalRevenue = occupiedUnits.reduce((sum, u) => sum + u.pricePerMonth, 0)

    return {
      size,
      totalUnits: sizeUnits.length,
      occupiedUnits: occupiedUnits.length,
      availableUnits: sizeUnits.length - occupiedUnits.length,
      occupancyRate: Math.round((occupiedUnits.length / sizeUnits.length) * 1000) / 10,
      revenuePerSqm: Math.round((totalRevenue / (occupiedUnits.length * config.sqm)) * 100) / 100,
      totalRevenue,
      avgPrice: Math.round(totalRevenue / Math.max(occupiedUnits.length, 1)),
    }
  })
}

export function getCustomerSegments(): CustomerSegment[] {
  const activeCustomers = customers.filter((c) => !c.endDate)
  const privateCustomers = activeCustomers.filter((c) => c.type === 'private')
  const businessCustomers = activeCustomers.filter((c) => c.type === 'business')

  const totalCustomers = activeCustomers.length

  return [
    {
      type: 'private',
      count: privateCustomers.length,
      percentage: Math.round((privateCustomers.length / totalCustomers) * 1000) / 10,
      totalRevenue: privateCustomers.length * 95, // avg monthly
    },
    {
      type: 'business',
      count: businessCustomers.length,
      percentage: Math.round((businessCustomers.length / totalCustomers) * 1000) / 10,
      totalRevenue: businessCustomers.length * 145, // avg monthly (business rents larger)
    },
  ]
}

export function getPricingAlerts(): PricingAlert[] {
  const alerts: PricingAlert[] = []

  // Find underpriced occupied units
  units.forEach((unit) => {
    const config = unitSizeConfig[unit.size]
    const marketAvg = config.basePrice

    if (unit.isOccupied && unit.pricePerMonth < marketAvg * 0.85) {
      alerts.push({
        unitId: unit.id,
        size: unit.size,
        currentPrice: unit.pricePerMonth,
        suggestedPrice: Math.round(marketAvg * 0.95),
        reason: 'Preis unter Marktniveau',
        priority: unit.pricePerMonth < marketAvg * 0.75 ? 'high' : 'medium',
      })
    }

    // Find vacant units that might be overpriced
    if (!unit.isOccupied && unit.pricePerMonth > marketAvg * 1.1) {
      alerts.push({
        unitId: unit.id,
        size: unit.size,
        currentPrice: unit.pricePerMonth,
        suggestedPrice: Math.round(marketAvg * 0.95),
        reason: 'Lange Leerstand - Preisanpassung empfohlen',
        priority: 'medium',
      })
    }
  })

  return alerts.slice(0, 8) // Limit to top 8 alerts
}

export function getForecastData(): ForecastData[] {
  const historical = monthlyMetrics.map((m) => ({
    month: m.month,
    actual: m.revenue,
  }))

  // Simple linear regression for forecast
  const lastRevenue = monthlyMetrics[monthlyMetrics.length - 1].revenue
  const avgGrowth = 1.02 // 2% monthly growth assumption

  const forecast: ForecastData[] = []
  const currentDate = new Date()

  for (let i = 1; i <= 3; i++) {
    const date = new Date(currentDate)
    date.setMonth(date.getMonth() + i)
    const monthName = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })

    const forecastValue = Math.round(lastRevenue * Math.pow(avgGrowth, i))

    forecast.push({
      month: monthName,
      forecast: forecastValue,
      lowerBound: Math.round(forecastValue * 0.92),
      upperBound: Math.round(forecastValue * 1.08),
    })
  }

  return [...historical, ...forecast]
}

export function getDashboardSummary(): DashboardSummary {
  const currentMonth = monthlyMetrics[monthlyMetrics.length - 1]
  const lastMonth = monthlyMetrics[monthlyMetrics.length - 2]
  const lastYear = monthlyMetrics[0]

  const activeCustomers = customers.filter((c) => !c.endDate)
  const churnedLastMonth = monthlyMetrics[monthlyMetrics.length - 1].churnedCustomers

  // Calculate avg rental duration
  const occupiedUnits = units.filter((u) => u.isOccupied && u.rentedSince)
  const avgDurationMonths = occupiedUnits.reduce((sum, u) => {
    const start = new Date(u.rentedSince!)
    const now = new Date()
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    return sum + months
  }, 0) / Math.max(occupiedUnits.length, 1)

  return {
    totalOccupancyRate: currentMonth.occupancyRate,
    monthlyRevenue: currentMonth.revenue,
    revenueChangePercent: Math.round(((currentMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 1000) / 10,
    revenueChangeVsLastYear: Math.round(((currentMonth.revenue - lastYear.revenue) / lastYear.revenue) * 1000) / 10,
    avgRentalDuration: Math.round(avgDurationMonths * 10) / 10,
    totalUnits: 125,
    occupiedUnits: currentMonth.occupiedUnits,
    availableUnits: 125 - currentMonth.occupiedUnits,
    totalCustomers: activeCustomers.length,
    churnRate: Math.round((churnedLastMonth / activeCustomers.length) * 1000) / 10,
    avgCustomerLifetimeValue: Math.round(avgDurationMonths * 105), // avg price * avg duration
  }
}
