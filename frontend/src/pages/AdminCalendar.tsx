import { useEffect, useState, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
         eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays, Circle } from 'lucide-react'
import { fetchCalendarData } from '../api/client'
import type { CalendarData, Appointment } from '../types'
import toast from 'react-hot-toast'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_DOT: Record<string, string> = {
  pending:    'bg-amber-400',
  approved:   'bg-emerald-500',
  cancelled:  'bg-red-400',
  rescheduled:'bg-purple-400',
  completed:  'bg-blue-400',
}

export default function AdminCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calData, setCalData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await fetchCalendarData(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1
      )
      setCalData(data)
    } catch {
      toast.error('Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => { load() }, [load])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)
  const calStart   = startOfWeek(monthStart)
  const calEnd     = endOfWeek(monthEnd)
  const days       = eachDayOfInterval({ start: calStart, end: calEnd })

  const apptsByDate = (calData?.appointments || []).reduce<Record<string, Appointment[]>>((acc, a) => {
    const key = a.date
    if (!acc[key]) acc[key] = []
    acc[key].push(a as unknown as Appointment)
    return acc
  }, {})

  const blockedSet = new Set((calData?.blocked_dates || []).map(b => b.date))
  const activeDays = new Set(calData?.active_days || [])

  const selectedAppts = selectedDay ? (apptsByDate[selectedDay] || []) : []

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-900">Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">Monthly appointment view</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="p-2 rounded-xl border border-gray-200 hover:bg-brand-50 hover:border-brand-300 transition-all">
            <ChevronLeft className="w-5 h-5 text-brand-700" />
          </button>
          <h2 className="text-base font-display font-semibold text-brand-900 min-w-[160px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="p-2 rounded-xl border border-gray-200 hover:bg-brand-50 hover:border-brand-300 transition-all">
            <ChevronRight className="w-5 h-5 text-brand-700" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          {/* Day labels */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-brand-700">
            {DAY_LABELS.map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-brand-100">{d}</div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const inMonth = isSameMonth(day, currentMonth)
                const isBlocked = blockedSet.has(dateStr)
                const dayAppts = apptsByDate[dateStr] || []
                const isSelected = selectedDay === dateStr
                const dayOfWeek = day.getDay()
                const isWorkingDay = activeDays.has(dayOfWeek === 0 ? 6 : dayOfWeek - 1)
                const isT = isToday(day)

                return (
                  <button
                    key={dateStr}
                    onClick={() => inMonth && setSelectedDay(isSelected ? null : dateStr)}
                    className={`min-h-[80px] p-2 border-b border-r border-gray-100 text-left transition-all
                      ${!inMonth ? 'bg-gray-50/50 cursor-default' : 'hover:bg-brand-50 cursor-pointer'}
                      ${isSelected ? 'bg-brand-50 ring-2 ring-inset ring-brand-400' : ''}
                      ${isBlocked && inMonth ? 'bg-red-50' : ''}
                    `}
                  >
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-semibold mb-1
                      ${isT ? 'bg-brand-700 text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'}
                    `}>
                      {format(day, 'd')}
                    </span>

                    {isBlocked && inMonth && (
                      <div className="text-xs text-red-500 font-medium leading-none">Blocked</div>
                    )}

                    {/* Appointment dots */}
                    <div className="flex flex-wrap gap-0.5 mt-1">
                      {dayAppts.slice(0, 4).map(a => (
                        <span key={a.id}
                          className={`w-2 h-2 rounded-full ${STATUS_DOT[a.status] || 'bg-gray-400'}`}
                          title={`${a.name} — ${a.status}`}
                        />
                      ))}
                      {dayAppts.length > 4 && (
                        <span className="text-xs text-gray-400 font-medium">+{dayAppts.length - 4}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
            <div className="space-y-2">
              {Object.entries(STATUS_DOT).map(([s, cls]) => (
                <div key={s} className="flex items-center gap-2 text-sm text-gray-600 capitalize">
                  <span className={`w-3 h-3 rounded-full ${cls}`} /> {s}
                </div>
              ))}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-3 h-3 rounded-full bg-red-200 border border-red-400" /> Blocked
              </div>
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDay ? (
            <div className="card animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-brand-700" />
                <h3 className="text-sm font-semibold text-brand-900">
                  {format(new Date(selectedDay + 'T00:00:00'), 'EEEE, MMMM d')}
                </h3>
              </div>
              {selectedAppts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No appointments</p>
              ) : (
                <div className="space-y-3">
                  {selectedAppts.map(a => (
                    <div key={a.id} className="border border-gray-100 rounded-xl p-3 hover:border-brand-200 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-brand-700">
                          {String(a.time_slot).slice(0,5)}
                        </span>
                        <span className={`badge badge-${a.status}`}>{a.status}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{a.name}</p>
                      {a.priority === 'vip' && (
                        <span className="text-xs text-yellow-600 font-medium">⭐ VIP</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-8">
              <Circle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Click a day to see its appointments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
