import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'
import type { DashboardSummary, MonthlyMetrics, CampaignPerformance, PlatformMetrics } from '@/data/types'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #3b82f6',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: '1 0 45%',
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  kpiLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
})

interface MonthlyReportPDFProps {
  summary: DashboardSummary
  campaignMetrics: CampaignPerformance[]
  monthlyData: MonthlyMetrics[]
  platformMetrics: PlatformMetrics[]
  reportMonth: string
}

export function MonthlyReportPDF({
  summary,
  campaignMetrics,
  platformMetrics,
  reportMonth,
}: MonthlyReportPDFProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Marketing Performance Report</Text>
          <Text style={styles.subtitle}>{reportMonth}</Text>
        </View>

        {/* Executive Summary KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Ad Spend</Text>
              <Text style={styles.kpiValue}>{formatCurrency(summary.totalSpend)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Revenue</Text>
              <Text style={styles.kpiValue}>{formatCurrency(summary.totalRevenue)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Return on Ad Spend</Text>
              <Text style={styles.kpiValue}>{summary.overallROAS.toFixed(2)}x</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total Conversions</Text>
              <Text style={styles.kpiValue}>{summary.totalConversions}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Cost per Acquisition</Text>
              <Text style={styles.kpiValue}>{formatCurrency(summary.overallCPA)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Click-Through Rate</Text>
              <Text style={styles.kpiValue}>{summary.overallCTR.toFixed(2)}%</Text>
            </View>
          </View>
        </View>

        {/* Platform Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Performance</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Platform</Text>
              <Text style={styles.tableCell}>Spend</Text>
              <Text style={styles.tableCell}>Revenue</Text>
              <Text style={styles.tableCell}>ROAS</Text>
              <Text style={styles.tableCell}>Conversions</Text>
            </View>
            {platformMetrics.map((platform) => (
              <View key={platform.platform} style={styles.tableRow}>
                <Text style={styles.tableCell}>{platform.platform}</Text>
                <Text style={styles.tableCell}>{formatCurrency(platform.totalSpend)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(platform.totalRevenue)}</Text>
                <Text style={styles.tableCell}>{platform.roas.toFixed(2)}x</Text>
                <Text style={styles.tableCell}>{platform.totalConversions}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Campaigns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performing Campaigns</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 2 }]}>Campaign</Text>
              <Text style={styles.tableCell}>Spend</Text>
              <Text style={styles.tableCell}>Revenue</Text>
              <Text style={styles.tableCell}>ROAS</Text>
            </View>
            {campaignMetrics.slice(0, 5).map((campaign) => (
              <View key={campaign.campaignId} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{campaign.campaignName}</Text>
                <Text style={styles.tableCell}>{formatCurrency(campaign.spend)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(campaign.revenue)}</Text>
                <Text style={styles.tableCell}>{campaign.roas.toFixed(2)}x</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString('en-US')} | AdInsights Dashboard
        </Text>
      </Page>
    </Document>
  )
}
