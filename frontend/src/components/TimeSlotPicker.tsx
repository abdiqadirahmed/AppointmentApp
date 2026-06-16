import { useState, useCallback } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth,
         startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
         isSameDay, isToday, isBefore, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import type { TimeSlot, SlotsResponse } from '../types'

interface Props {
  onSelect: (date: string, slot: string) => void
  selected: { date: string; slot: string } | null
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export default function TimeSlotPicker({ onSelect, selected }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slotsData, setSlotsData] = useState<SlotsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const today = startOfDay(new Date())

  const loadSlots = useCallback(async (date: Date) => {
    setLoading(true)
    setSlotsData(null)
    setSelectedSlot(null)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const res = await fetch(`/api/slots/?date=${dateStr}`)
      const data: SlotsResponse = await res.json()
      setSlotsData(data)
    } catch {
      setSlotsData({ slots: [], blocked: true, reason: 'Could not load slots. Please try again.' })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDayClick = (day: Date) => {
    if (isBefore(day, today)) return
    setSelectedDate(day)
    loadSlots(day)
  }

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.available || !selectedDate) return
    setSelectedSlot(slot.time)
    onSelect(format(selectedDate, 'yyyy-MM-dd'), slot.time)
  }

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  return (
    <div className="space-y-6">
      {/* ── Calendar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-brand-700">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="p-2 rounded-lg text-brand-200 hover:text-white hover:bg-white/10 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-white font-display font-semibold text-base">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="p-2 rounded-lg text-brand-200 hover:text-white hover:bg-white/10 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_LABELS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {days.map(day => {
            const inMonth = isSameMonth(day, currentMonth)
            const isPast = isBefore(day, today)
            const isSel = selectedDate && isSameDay(day, selectedDate)
            const isT = isToday(day)
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                disabled={isPast || !inMonth}
                className={`relative py-3 text-sm font-medium transition-all duration-150 border-b border-r border-gray-50
                  ${!inMonth ? 'text-gray-200 cursor-default' : ''}
                  ${isPast && inMonth ? 'text-gray-300 cursor-not-allowed' : ''}
                  ${!isPast && inMonth ? 'hover:bg-brand-50 cursor-pointer' : ''}
                  ${isSel ? 'bg-brand-700 text-white hover:bg-brand-700' : ''}
                  ${isT && !isSel ? 'font-bold text-brand-700' : ''}
                `}
              >
                {format(day, 'd')}
                {isT && !isSel && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-700" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Time Slots ── */}
      {selectedDate && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-brand-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-700" />
              {format(selectedDate, 'EEEE, MMMM d')}
            </h3>
            {slotsData?.working_hours && (
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
                {slotsData.working_hours}
              </span>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-10 text-brand-700">
              <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
            </div>
          )}

          {!loading && slotsData?.blocked && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Not Available</p>
                <p className="text-xs mt-0.5">{slotsData.reason}</p>
              </div>
            </div>
          )}

          {!loading && !slotsData?.blocked && slotsData?.slots?.length === 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">No available slots for this date.</p>
            </div>
          )}

          {!loading && slotsData?.slots && slotsData.slots.length > 0 && (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                {slotsData.slots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => handleSlotClick(slot)}
                    disabled={!slot.available}
                    className={
                      selectedSlot === slot.time ? 'slot-selected' :
                      slot.available ? 'slot-available' : 'slot-taken'
                    }
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border-2 border-brand-300 bg-white inline-block" />Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-brand-700 inline-block" />Selected
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200 inline-block" />Taken
                </span>
              </div>
            </>
          )}

          {selectedSlot && (
            <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-emerald-700 animate-fade-in">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <p className="text-sm font-semibold">
                Selected: {format(selectedDate, 'MMM d, yyyy')} at{' '}
                {slotsData?.slots.find(s => s.time === selectedSlot)?.label}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
