import { useState, useMemo } from 'react'

export interface DateRange {
  startDate: Date
  endDate: Date
  label: string
}

type RollingPreset = { label: string; type: 'rolling'; days: number }
type CalendarPreset = { label: string; type: 'calendar'; unit: 'week' | 'month' }
type Preset = RollingPreset | CalendarPreset

const PRESETS: Preset[] = [
  { label: 'Last 30 Days', type: 'rolling', days: 30 },
  { label: 'This Month', type: 'calendar', unit: 'month' },
  { label: 'This Week', type: 'calendar', unit: 'week' },
]

function makeRollingRange(days: number): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  return { start, end }
}

function makeCalendarRange(unit: 'week' | 'month'): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  if (unit === 'week') {
    // Monday as week start
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)
  } else {
    start.setDate(1)
  }
  return { start, end }
}

function toInputValue(d: Date): string {
  return d.toISOString().split('T')[0]
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false)

  const handlePreset = (preset: Preset) => {
    const { start, end } =
      preset.type === 'rolling'
        ? makeRollingRange(preset.days)
        : makeCalendarRange(preset.unit)
    setShowCustom(false)
    onChange({ startDate: start, endDate: end, label: preset.label })
  }

  const handleCustomStart = (val: string) => {
    const d = new Date(val + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      onChange({ startDate: d, endDate: value.endDate, label: 'Custom' })
    }
  }

  const handleCustomEnd = (val: string) => {
    const d = new Date(val + 'T00:00:00')
    if (!isNaN(d.getTime())) {
      onChange({ startDate: value.startDate, endDate: d, label: 'Custom' })
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center border rounded-md overflow-hidden text-sm">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(preset)}
            className={`px-3 py-1.5 transition-colors ${
              value.label === preset.label
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1.5 transition-colors ${
            value.label === 'Custom'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          Custom
        </button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-1.5 text-sm">
          <input
            type="date"
            value={toInputValue(value.startDate)}
            onChange={(e) => handleCustomStart(e.target.value)}
            className="border rounded-md px-2 py-1 bg-background text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={toInputValue(value.endDate)}
            onChange={(e) => handleCustomEnd(e.target.value)}
            className="border rounded-md px-2 py-1 bg-background text-sm"
          />
        </div>
      )}
    </div>
  )
}

/** Default date range: Last 30 Days (rolling). */
export function useDateRange() {
  const [range, setRange] = useState<DateRange>(() => {
    const { start, end } = makeRollingRange(30)
    return { startDate: start, endDate: end, label: 'Last 30 Days' }
  })

  // Stable references so React Query keys don't thrash
  const startDate = useMemo(() => range.startDate, [range.startDate.getTime()])
  const endDate = useMemo(() => range.endDate, [range.endDate.getTime()])

  return { range, setRange, startDate, endDate }
}
