import { useEffect, useState } from 'react'
import {
  Clock, Save, Ban, Trash2, Plus, Settings,
  ToggleLeft, ToggleRight, AlertTriangle, CheckCircle
} from 'lucide-react'
import {
  fetchAvailability, updateAvailability,
  fetchBlockedDates, blockDate, unblockDate
} from '../api/client'
import type { Availability, BlockedDate } from '../types'
import toast from 'react-hot-toast'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function AdminSettings() {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [blocked, setBlocked] = useState<BlockedDate[]>([])
  const [loadingAvail, setLoadingAvail] = useState(true)
  const [savingDay, setSavingDay] = useState<number | null>(null)
  const [newBlock, setNewBlock] = useState({ date: '', reason: '' })
  const [addingBlock, setAddingBlock] = useState(false)

  const loadAll = async () => {
    setLoadingAvail(true)
    try {
      const [a, b] = await Promise.all([fetchAvailability(), fetchBlockedDates()])
      // Ensure all 7 days exist (fill missing with defaults)
      const avMap: Record<number, Availability> = {}
      a.data.forEach((av: Availability) => { avMap[av.day_of_week] = av })
      const full: Availability[] = Array.from({ length: 7 }, (_, i) => avMap[i] ?? {
        id: -1, day_of_week: i, day_name: DAY_NAMES[i],
        is_active: false, start_time: '08:00', end_time: '17:00',
        slot_duration: 30, buffer_time: 10, max_per_day: 10,
        lunch_start: null, lunch_end: null,
      })
      setAvailability(full)
      setBlocked(b.data)
    } catch { toast.error('Failed to load settings') }
    finally { setLoadingAvail(false) }
  }

  useEffect(() => { loadAll() }, [])

  const updateField = (day: number, field: keyof Availability, value: string | boolean | number) => {
    setAvailability(prev => prev.map(a =>
      a.day_of_week === day ? { ...a, [field]: value } : a
    ))
  }

  const saveDay = async (av: Availability) => {
    setSavingDay(av.day_of_week)
    try {
      await updateAvailability(av.day_of_week, {
        is_active: av.is_active,
        start_time: av.start_time,
        end_time: av.end_time,
        slot_duration: av.slot_duration,
        buffer_time: av.buffer_time,
        max_per_day: av.max_per_day,
        lunch_start: av.lunch_start || null,
        lunch_end: av.lunch_end || null,
      })
      toast.success(`${DAY_NAMES[av.day_of_week]} schedule saved`)
    } catch { toast.error('Failed to save') }
    finally { setSavingDay(null) }
  }

  const handleAddBlock = async () => {
    if (!newBlock.date) { toast.error('Select a date to block'); return }
    setAddingBlock(true)
    try {
      await blockDate(newBlock.date, newBlock.reason)
      toast.success('Date blocked')
      setNewBlock({ date: '', reason: '' })
      const { data } = await fetchBlockedDates()
      setBlocked(data)
    } catch (err: any) {
      toast.error(err.response?.data?.date?.[0] || 'Failed to block date')
    } finally { setAddingBlock(false) }
  }

  const handleUnblock = async (id: number, date: string) => {
    if (!confirm(`Unblock ${date}?`)) return
    try {
      await unblockDate(id)
      toast.success('Date unblocked')
      setBlocked(prev => prev.filter(b => b.id !== id))
    } catch { toast.error('Failed to unblock') }
  }

  if (loadingAvail) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-brand-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-700" /> Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configure weekly schedule, slots, and blocked dates</p>
      </div>

      {/* ── Weekly Schedule ─────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-display font-semibold text-brand-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-700" /> Weekly Availability
        </h2>
        <div className="space-y-4">
          {availability.map(av => (
            <div key={av.day_of_week}
              className={`bg-white rounded-2xl border shadow-card transition-all overflow-hidden
                ${av.is_active ? 'border-brand-200' : 'border-gray-100 opacity-80'}`}>
              {/* Day header row */}
              <div className={`flex items-center justify-between px-6 py-4 border-b
                ${av.is_active ? 'border-brand-100 bg-brand-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-brand-900 w-28">{DAY_NAMES[av.day_of_week]}</span>
                  {av.is_active
                    ? <span className="badge bg-emerald-100 text-emerald-700">Active</span>
                    : <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
                </div>
                <button
                  onClick={() => updateField(av.day_of_week, 'is_active', !av.is_active)}
                  className="flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  {av.is_active
                    ? <ToggleRight className="w-7 h-7 text-emerald-500" />
                    : <ToggleLeft className="w-7 h-7 text-gray-300" />}
                </button>
              </div>

              {/* Day config grid */}
              {av.is_active && (
                <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-end animate-fade-in">
                  <div>
                    <label className="label text-xs">Start Time</label>
                    <input type="time" className="input-field text-sm"
                      value={av.start_time}
                      onChange={e => updateField(av.day_of_week, 'start_time', e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-xs">End Time</label>
                    <input type="time" className="input-field text-sm"
                      value={av.end_time}
                      onChange={e => updateField(av.day_of_week, 'end_time', e.target.value)} />
                  </div>
                  <div>
                    <label className="label text-xs">Slot (mins)</label>
                    <input type="number" min={15} max={120} step={5} className="input-field text-sm"
                      value={av.slot_duration}
                      onChange={e => updateField(av.day_of_week, 'slot_duration', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="label text-xs">Buffer (mins)</label>
                    <input type="number" min={0} max={60} step={5} className="input-field text-sm"
                      value={av.buffer_time}
                      onChange={e => updateField(av.day_of_week, 'buffer_time', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="label text-xs">Max / Day</label>
                    <input type="number" min={1} max={50} className="input-field text-sm"
                      value={av.max_per_day}
                      onChange={e => updateField(av.day_of_week, 'max_per_day', Number(e.target.value))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => saveDay(av)}
                      disabled={savingDay === av.day_of_week}
                      className="btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5"
                    >
                      {savingDay === av.day_of_week
                        ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Save className="w-3.5 h-3.5" /> Save</>}
                    </button>
                  </div>

                  {/* Lunch break (full row) */}
                  <div className="col-span-2 sm:col-span-3 lg:col-span-6 border-t border-gray-100 pt-4 flex flex-wrap gap-4 items-end">
                    <p className="text-xs font-semibold text-gray-500 w-full -mb-2">Lunch Break (optional)</p>
                    <div>
                      <label className="label text-xs">Break Start</label>
                      <input type="time" className="input-field text-sm"
                        value={av.lunch_start || ''}
                        onChange={e => updateField(av.day_of_week, 'lunch_start', e.target.value || null as unknown as string)} />
                    </div>
                    <div>
                      <label className="label text-xs">Break End</label>
                      <input type="time" className="input-field text-sm"
                        value={av.lunch_end || ''}
                        onChange={e => updateField(av.day_of_week, 'lunch_end', e.target.value || null as unknown as string)} />
                    </div>
                    {(av.lunch_start || av.lunch_end) && (
                      <button className="btn-ghost text-xs text-red-400 hover:text-red-600"
                        onClick={() => { updateField(av.day_of_week, 'lunch_start', ''); updateField(av.day_of_week, 'lunch_end', '') }}>
                        Clear break
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Blocked Dates ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-display font-semibold text-brand-900 mb-4 flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-500" /> Blocked Dates
        </h2>

        {/* Add block form */}
        <div className="card mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Block a Date</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="label text-xs">Date *</label>
              <input type="date" className="input-field text-sm"
                value={newBlock.date}
                onChange={e => setNewBlock(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="label text-xs">Reason (optional)</label>
              <input type="text" placeholder="e.g. Travel, National holiday…"
                className="input-field text-sm"
                value={newBlock.reason}
                onChange={e => setNewBlock(p => ({ ...p, reason: e.target.value }))} />
            </div>
            <button onClick={handleAddBlock} disabled={addingBlock}
              className="btn-danger flex items-center gap-2">
              {addingBlock
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Plus className="w-4 h-4" /> Block Date</>}
            </button>
          </div>
        </div>

        {/* Blocked list */}
        {blocked.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
            <p className="text-sm font-medium">No dates blocked — full schedule is open</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {blocked.map(b => (
                  <tr key={b.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-red-700 flex items-center gap-2">
                      <Ban className="w-3.5 h-3.5" /> {b.date}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">
                      {b.reason || <span className="italic text-gray-300">No reason</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button onClick={() => handleUnblock(b.id, b.date)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Changes to working hours and blocked dates take effect immediately.
          Existing approved appointments are not affected — notify citizens manually if their slot changes.
        </p>
      </div>
    </div>
  )
}
