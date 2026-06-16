import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, CheckCircle, XCircle, RefreshCw, Plus,
         CalendarDays, Clock, User, Mail, Phone, ChevronDown, Trash2, FileText, Building2, Star } from 'lucide-react'
import { listAppointments, updateAppointment, deleteAppointment, adminCreateAppointment, fetchSlots } from '../api/client'
import type { Appointment } from '../types'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['', 'pending', 'approved', 'cancelled', 'rescheduled', 'completed']

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}

interface ActionModalProps {
  appt: Appointment
  onClose: () => void
  onDone: () => void
}

function ActionModal({ appt, onClose, onDone }: ActionModalProps) {
  const [action, setAction] = useState<string>('')
  const [notes, setNotes] = useState(appt.admin_notes || '')
  const [reschedDate, setReschedDate] = useState('')
  const [reschedTime, setReschedTime] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!action) { toast.error('Select an action'); return }
    const payload: Record<string, string> = { status: action, admin_notes: notes }
    if (action === 'rescheduled') {
      if (!reschedDate || !reschedTime) { toast.error('Provide new date and time'); return }
      payload.rescheduled_date = reschedDate
      payload.rescheduled_time = reschedTime
    }
    setLoading(true)
    try {
      await updateAppointment(appt.id, payload)
      toast.success('Appointment updated')
      onDone()
    } catch { toast.error('Failed to update') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display font-bold text-brand-900">Manage Appointment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="bg-brand-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex items-center gap-2 font-semibold text-brand-900">
              <User className="w-4 h-4" /> {appt.name}
              {appt.priority === 'vip' && <span className="badge-vip">VIP</span>}
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <CalendarDays className="w-3.5 h-3.5" /> {appt.date} at {String(appt.time_slot).slice(0,5)}
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Mail className="w-3.5 h-3.5" /> {appt.email}
            </div>
            <p className="text-gray-600 pt-1 italic">{appt.purpose}</p>
          </div>

          {/* Action selector */}
          <div>
            <label className="label">Update Status</label>
            <div className="grid grid-cols-3 gap-2">
              {['approved','cancelled','rescheduled','completed','pending'].map(s => (
                <button key={s} onClick={() => setAction(s)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all
                    ${action === s ? 'bg-brand-700 text-white border-brand-700' : 'border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Reschedule fields */}
          {action === 'rescheduled' && (
            <div className="grid grid-cols-2 gap-3 animate-fade-in">
              <div>
                <label className="label">New Date</label>
                <input type="date" className="input-field" value={reschedDate}
                  onChange={e => setReschedDate(e.target.value)} />
              </div>
              <div>
                <label className="label">New Time</label>
                <input type="time" className="input-field" value={reschedTime}
                  onChange={e => setReschedTime(e.target.value)} />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Admin Notes (optional)</label>
            <textarea className="input-field resize-none" rows={2} value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes, not shared with citizen…" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminList() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [showBookModal, setShowBookModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (dateFilter)   params.date   = dateFilter
      if (search)       params.search  = search
      const { data } = await listAppointments(params)
      setAppointments(data.results)
    } catch {
      toast.error('Failed to load appointments')
    } finally { setLoading(false) }
  }, [statusFilter, dateFilter, search])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this appointment permanently?')) return
    try {
      await deleteAppointment(id)
      toast.success('Deleted')
      load()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-900">Appointments</h1>
          <p className="text-gray-500 text-sm mt-1">{appointments.length} record{appointments.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="flex items-center gap-2 text-sm text-brand-700 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm hover:shadow transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setShowBookModal(true)} className="flex items-center gap-2 text-sm text-white bg-brand-700 rounded-xl px-4 py-2 shadow-sm hover:shadow transition-all">
            <Plus className="w-4 h-4" /> Book Appointment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search name, email, purpose…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10 text-sm" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="input-field pl-10 pr-8 text-sm appearance-none min-w-[150px]">
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="date" value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="input-field pl-10 text-sm" />
        </div>
        {(statusFilter || dateFilter || search) && (
          <button onClick={() => { setStatusFilter(''); setDateFilter(''); setSearch('') }}
            className="text-sm text-red-500 hover:text-red-700 font-medium px-3">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No appointments found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Citizen</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date & Time</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Purpose</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map(a => (
                  <tr key={a.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{a.name}</p>
                      <div className="flex items-center gap-2 text-gray-400 text-xs mt-0.5">
                        <Mail className="w-3 h-3" />{a.email}
                      </div>
                      {a.phone && <div className="flex items-center gap-2 text-gray-400 text-xs mt-0.5">
                        <Phone className="w-3 h-3" />{a.phone}
                      </div>}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-brand-700 font-semibold">
                        <CalendarDays className="w-3.5 h-3.5" />{a.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5">
                        <Clock className="w-3 h-3" />{String(a.time_slot).slice(0,5)}
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-[200px]">
                      <p className="text-gray-600 truncate text-xs leading-relaxed">{a.purpose}</p>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={a.status} /></td>
                    <td className="px-4 py-4">
                      {a.priority === 'vip'
                        ? <span className="badge-vip">⭐ VIP</span>
                        : <span className="text-gray-400 text-xs">Normal</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelected(a)}
                          className="btn-primary text-xs px-3 py-1.5">
                          Manage
                        </button>
                        <button onClick={() => handleDelete(a.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <ActionModal appt={selected} onClose={() => setSelected(null)} onDone={() => { setSelected(null); load() }} />
      )}

      {showBookModal && (
        <BookAppointmentModal
          onClose={() => setShowBookModal(false)}
          onDone={() => { setShowBookModal(false); load() }}
        />
      )}
    </div>
  )
}

function BookAppointmentModal({ onClose, onDone }: { onClose: () => void, onDone: () => void }) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', purpose: '', organization: '',
    priority: 'normal', date: '', time_slot: '', status: 'approved'
  })
  const [slots, setSlots] = useState<{time: string, label: string, available: boolean}[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loading, setLoading] = useState(false)

  const PURPOSES = [
    'Constituency Matter', 'Business / Investment', 'Policy Discussion',
    'Petition / Complaint', 'Media / Press', 'Official Government Matter',
    'Community Project', 'Other',
  ]

  useEffect(() => {
    if (form.date) {
      setLoadingSlots(true)
      fetchSlots(form.date).then(res => {
        setSlots(res.data.slots || [])
      }).finally(() => setLoadingSlots(false))
    }
  }, [form.date])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.time_slot) { toast.error('Select date and time'); return }
    setLoading(true)
    try {
      await adminCreateAppointment(form)
      toast.success('Appointment booked successfully')
      onDone()
    } catch (err: any) {
      const errors = err.response?.data
      if (errors && typeof errors === 'object') {
        const msgs = Object.values(errors).flat().join(' ')
        toast.error(msgs)
      } else {
        toast.error('Failed to book appointment')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-xl font-display font-bold text-brand-900">Manual Booking</h3>
            <p className="text-xs text-gray-500 mt-0.5">Create a new appointment for a citizen</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XCircle className="w-5 h-5 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label text-xs uppercase tracking-wider font-bold text-gray-400">Citizen Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input required className="input-field pl-10" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full Name" />
              </div>
            </div>
            <div>
              <label className="label text-xs uppercase tracking-wider font-bold text-gray-400">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input required className="input-field pl-10" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="Phone" />
              </div>
            </div>
          </div>

          <div>
            <label className="label text-xs uppercase tracking-wider font-bold text-gray-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input required type="email" className="input-field pl-10" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Email" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label text-xs uppercase tracking-wider font-bold text-gray-400">Appointment Date</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input required type="date" className="input-field pl-10" value={form.date} onChange={e => set('date', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label text-xs uppercase tracking-wider font-bold text-gray-400">Time Slot</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select required className="input-field pl-10 appearance-none" value={form.time_slot} onChange={e => set('time_slot', e.target.value)}>
                  <option value="">{loadingSlots ? 'Loading slots...' : 'Select time...'}</option>
                  {slots.map(s => (
                    <option key={s.time} value={s.time} disabled={!s.available}>
                      {s.label} {!s.available ? '(Taken)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label text-xs uppercase tracking-wider font-bold text-gray-400">Purpose</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select required className="input-field pl-10 appearance-none" value={form.purpose} onChange={e => set('purpose', e.target.value)}>
                  <option value="">Select purpose...</option>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label text-xs uppercase tracking-wider font-bold text-gray-400">Initial Status</label>
              <select className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.priority === 'vip'} onChange={e => set('priority', e.target.checked ? 'vip' : 'normal')} className="w-4 h-4 accent-amber-600" />
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-amber-800 text-sm">VIP / Priority Slot</span>
                </div>
              </div>
            </label>
          </div>
        </form>

        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary px-6">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary px-8 flex items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Book Appointment</>}
          </button>
        </div>
      </div>
    </div>
  )
}
