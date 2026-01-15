import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonthlyReportPDF } from './MonthlyReportPDF'
import {
  getDashboardSummary,
  getUnitSizeMetrics,
  getCustomerSegments,
  monthlyMetrics,
} from '@/data/mockData'

export function ExportButton() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleExport = async () => {
    setIsGenerating(true)

    try {
      const summary = getDashboardSummary()
      const unitMetrics = getUnitSizeMetrics()
      const customerSegments = getCustomerSegments()

      const currentDate = new Date()
      const reportMonth = currentDate.toLocaleDateString('de-DE', {
        month: 'long',
        year: 'numeric',
      })

      const blob = await pdf(
        <MonthlyReportPDF
          summary={summary}
          unitMetrics={unitMetrics}
          monthlyData={monthlyMetrics}
          customerSegments={customerSegments}
          reportMonth={reportMonth}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `StorageHub_Bericht_${currentDate.toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Erstelle PDF...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Export PDF
        </>
      )}
    </Button>
  )
}
