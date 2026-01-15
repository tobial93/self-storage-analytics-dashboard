import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { DashboardSummary, UnitSizeMetrics, MonthlyMetrics, CustomerSegment } from '@/data/types'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #3b82f6',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#1e293b',
  },
  reportDate: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    paddingBottom: 5,
    borderBottom: '1px solid #e2e8f0',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    marginBottom: 10,
  },
  kpiLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  kpiChange: {
    fontSize: 9,
    marginTop: 2,
  },
  positive: {
    color: '#16a34a',
  },
  negative: {
    color: '#dc2626',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #e2e8f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: '#334155',
  },
  col1: { width: '20%' },
  col2: { width: '16%' },
  col3: { width: '16%' },
  col4: { width: '16%' },
  col5: { width: '16%' },
  col6: { width: '16%' },
  summaryBox: {
    backgroundColor: '#eff6ff',
    padding: 15,
    borderRadius: 6,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 10,
    color: '#1e293b',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1px solid #e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
})

interface MonthlyReportPDFProps {
  summary: DashboardSummary
  unitMetrics: UnitSizeMetrics[]
  monthlyData: MonthlyMetrics[]
  customerSegments: CustomerSegment[]
  reportMonth: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function MonthlyReportPDF({
  summary,
  unitMetrics,
  monthlyData,
  customerSegments,
  reportMonth,
}: MonthlyReportPDFProps) {
  const generatedDate = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const last3Months = monthlyData.slice(-3)
  const totalRevenue3Months = last3Months.reduce((sum, m) => sum + m.revenue, 0)
  const avgOccupancy3Months = last3Months.reduce((sum, m) => sum + m.occupancyRate, 0) / 3

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>StorageHub</Text>
          <Text style={styles.subtitle}>Self-Storage Analytics</Text>
          <Text style={styles.reportTitle}>Monatlicher Geschäftsbericht</Text>
          <Text style={styles.reportDate}>
            Berichtszeitraum: {reportMonth} | Erstellt am: {generatedDate}
          </Text>
        </View>

        {/* KPI Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kennzahlen Übersicht</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Belegungsrate</Text>
              <Text style={styles.kpiValue}>{formatPercent(summary.totalOccupancyRate)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Monatlicher Umsatz</Text>
              <Text style={styles.kpiValue}>{formatCurrency(summary.monthlyRevenue)}</Text>
              <Text style={[styles.kpiChange, summary.revenueChangePercent >= 0 ? styles.positive : styles.negative]}>
                {summary.revenueChangePercent >= 0 ? '+' : ''}{summary.revenueChangePercent.toFixed(1)}% vs. Vormonat
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Aktive Kunden</Text>
              <Text style={styles.kpiValue}>{summary.totalCustomers}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Verfügbare Einheiten</Text>
              <Text style={styles.kpiValue}>{summary.availableUnits} / {summary.totalUnits}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Ø Mietdauer</Text>
              <Text style={styles.kpiValue}>{summary.avgRentalDuration} Monate</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Churn Rate</Text>
              <Text style={styles.kpiValue}>{formatPercent(summary.churnRate)}</Text>
            </View>
          </View>
        </View>

        {/* Unit Performance Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Einheiten Performance nach Größe</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.col1]}>Größe</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>Gesamt</Text>
              <Text style={[styles.tableHeaderCell, styles.col3]}>Belegt</Text>
              <Text style={[styles.tableHeaderCell, styles.col4]}>Belegung</Text>
              <Text style={[styles.tableHeaderCell, styles.col5]}>Ø Preis</Text>
              <Text style={[styles.tableHeaderCell, styles.col6]}>Umsatz</Text>
            </View>
            {unitMetrics.map((unit, index) => (
              <View key={unit.size} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, styles.col1]}>{unit.size}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{unit.totalUnits}</Text>
                <Text style={[styles.tableCell, styles.col3]}>{unit.occupiedUnits}</Text>
                <Text style={[styles.tableCell, styles.col4]}>{formatPercent(unit.occupancyRate)}</Text>
                <Text style={[styles.tableCell, styles.col5]}>{formatCurrency(unit.avgPrice)}</Text>
                <Text style={[styles.tableCell, styles.col6]}>{formatCurrency(unit.totalRevenue)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Two Column Section */}
        <View style={styles.twoColumn}>
          {/* Revenue Trend */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Umsatz (letzte 3 Monate)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Monat</Text>
                <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Umsatz</Text>
                <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Belegung</Text>
              </View>
              {last3Months.map((month, index) => (
                <View key={month.month} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { width: '40%' }]}>{month.month}</Text>
                  <Text style={[styles.tableCell, { width: '30%' }]}>{formatCurrency(month.revenue)}</Text>
                  <Text style={[styles.tableCell, { width: '30%' }]}>{formatPercent(month.occupancyRate)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Customer Segments */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Kundensegmente</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Segment</Text>
                <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Anzahl</Text>
                <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Anteil</Text>
              </View>
              {customerSegments.map((segment, index) => (
                <View key={segment.type} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCell, { width: '40%' }]}>
                    {segment.type === 'private' ? 'Privatkunden' : 'Geschäftskunden'}
                  </Text>
                  <Text style={[styles.tableCell, { width: '30%' }]}>{segment.count}</Text>
                  <Text style={[styles.tableCell, { width: '30%' }]}>{formatPercent(segment.percentage)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Zusammenfassung</Text>
            <Text style={styles.summaryText}>
              Im Berichtszeitraum wurde ein Gesamtumsatz von {formatCurrency(totalRevenue3Months)} erzielt
              (letzte 3 Monate). Die durchschnittliche Belegungsrate lag bei {formatPercent(avgOccupancy3Months)}.
              {summary.revenueChangePercent >= 0
                ? ` Der Umsatz ist im Vergleich zum Vormonat um ${summary.revenueChangePercent.toFixed(1)}% gestiegen.`
                : ` Der Umsatz ist im Vergleich zum Vormonat um ${Math.abs(summary.revenueChangePercent).toFixed(1)}% gesunken.`
              }
              {' '}Der Customer Lifetime Value beträgt durchschnittlich {formatCurrency(summary.avgCustomerLifetimeValue)}.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>StorageHub Analytics | Vertraulich</Text>
          <Text style={styles.footerText}>Seite 1 von 1</Text>
        </View>
      </Page>
    </Document>
  )
}
