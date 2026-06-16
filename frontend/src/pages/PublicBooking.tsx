import { useState } from 'react'
import { User, Phone, Mail, FileText, Building2, Star, CheckCircle, ArrowRight, ArrowLeft, Calendar } from 'lucide-react'
import TimeSlotPicker from '../components/TimeSlotPicker'
import Captcha from '../components/Captcha'
import { submitAppointment } from '../api/client'
import toast from 'react-hot-toast'

const STEPS = ['Select Date & Time', 'Your Details', 'Confirm & Submit']

const PURPOSES = [
  'Constituency Matter', 'Business / Investment', 'Policy Discussion',
  'Petition / Complaint', 'Media / Press', 'Official Government Matter',
  'Community Project', 'Other',
]

interface FormData {
  name: string; phone: string; email: string
  purpose: string; organization: string; priority: 'normal' | 'vip'
  date: string; time_slot: string
}

const EMPTY: FormData = {
  name: '', phone: '', email: '', purpose: '', organization: '',
  priority: 'normal', date: '', time_slot: '',
}

export default function PublicBooking() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [bookingId, setBookingId] = useState<number | null>(null)

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSlotSelect = (date: string, slot: string) => {
    set('date', date); set('time_slot', slot)
  }

  const handleSubmit = async () => {
    if (!captchaVerified) { toast.error('Please complete the security check'); return }
    setSubmitting(true)
    try {
      const { data } = await submitAppointment(form)
      setBookingId(data.id)
      setSubmitted(true)
      toast.success('Appointment submitted successfully!')
    } catch (err: any) {
      const errors = err.response?.data
      if (errors && typeof errors === 'object') {
        const msgs = Object.values(errors).flat().join(' ')
        toast.error(msgs)
      } else {
        toast.error('Submission failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const fmtTime = (t: string) => {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hr = parseInt(h); const ampm = hr >= 12 ? 'PM' : 'AM'
    return `${hr % 12 || 12}:${m} ${ampm}`
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-slide-up">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-display font-bold text-brand-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Your appointment request has been received. You'll get a confirmation email shortly.
          Our office will review and approve your request.
        </p>
        {bookingId && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-brand-600 font-medium">Reference Number</p>
            <p className="text-brand-900 font-display font-bold text-xl">#{String(bookingId).padStart(6, '0')}</p>
          </div>
        )}
        <div className="text-left bg-gray-50 rounded-xl p-4 text-sm space-y-2 mb-6">
          <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold">{form.date}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-semibold">{fmtTime(form.time_slot)}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-semibold">{form.name}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="badge-pending">Pending Review</span></div>
        </div>
        <button onClick={() => { setSubmitted(false); setForm(EMPTY); setStep(0); setCaptchaVerified(false) }}
          className="btn-primary w-full">
          Book Another Appointment
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="relative bg-brand-700 overflow-hidden">
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gray-50"
             style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <Calendar className="w-3.5 h-3.5 text-brand-200" />
            <span className="text-brand-100 text-xs font-medium">Official Scheduling Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-bold text-white mb-4 leading-tight">
            Schedule Your Appointment
          </h1>
          <p className="text-brand-200 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Book a meeting with our office. Select a convenient date and time, provide your details,
            and we'll confirm your appointment promptly.
          </p>
          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-10 flex-wrap">
            {[['7 Days', 'Weekly availability'], ['Same-day', 'Confirmation email'], ['Secure', 'Encrypted & private']].map(([title, sub]) => (
              <div key={title} className="text-center">
                <p className="text-white font-display font-bold text-lg">{title}</p>
                <p className="text-brand-200 text-xs mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stepper ─────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 -mt-6 mb-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 px-6 py-4">
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium hidden sm:block whitespace-nowrap
                    ${i === step ? 'text-brand-700' : 'text-gray-400'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 transition-all ${i < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-16">

        {/* Step 0 — Date & Time */}
        {step === 0 && (
          <div className="animate-fade-in space-y-6">
            <div className="card">
              <h2 className="text-lg font-display font-bold text-brand-900 mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-700" />
                Select a Date & Time Slot
              </h2>
              <TimeSlotPicker onSelect={handleSlotSelect} selected={form.date ? { date: form.date, slot: form.time_slot } : null} />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => { if (!form.date || !form.time_slot) { toast.error('Please select a date and time slot'); return } setStep(1) }}
                className="btn-primary flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="card space-y-5">
              <h2 className="text-lg font-display font-bold text-brand-900 flex items-center gap-2">
                <User className="w-5 h-5 text-brand-700" />
                Your Details
              </h2>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="field-name" placeholder="John Doe" value={form.name}
                      onChange={e => set('name', e.target.value)}
                      className="input-field pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="label">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="field-phone" placeholder="+254 700 000 000" value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      className="input-field pl-10" required />
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id="field-email" type="email" placeholder="john@example.com" value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className="input-field pl-10" required />
                </div>
              </div>

              <div>
                <label className="label">Organization / Affiliation</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input id="field-org" placeholder="Company / NGO / Individual" value={form.organization}
                    onChange={e => set('organization', e.target.value)}
                    className="input-field pl-10" />
                </div>
              </div>

              <div>
                <label className="label">Purpose of Meeting *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <select id="field-purpose-select" value={form.purpose}
                    onChange={e => set('purpose', e.target.value)}
                    className="input-field pl-10 appearance-none">
                    <option value="">Select a category…</option>
                    {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <textarea id="field-purpose" placeholder="Briefly describe your agenda or reason for the meeting…"
                  value={form.purpose !== '' && !PURPOSES.includes(form.purpose) ? form.purpose : ''}
                  onChange={e => set('purpose', e.target.value)}
                  rows={3}
                  className="input-field mt-2 resize-none" />
              </div>

              {/* VIP toggle */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.priority === 'vip'}
                    onChange={e => set('priority', e.target.checked ? 'vip' : 'normal')}
                    className="w-4 h-4 accent-amber-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-amber-800 text-sm">Request VIP / Priority Slot</span>
                    </div>
                    <p className="text-xs text-amber-600 mt-0.5">For dignitaries, officials, or time-sensitive matters</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(0)} className="btn-secondary flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => {
                  if (!form.name || !form.phone || !form.email || !form.purpose)
                    { toast.error('Please fill in all required fields'); return }
                  setStep(2)
                }}
                className="btn-primary flex items-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Review & Submit */}
        {step === 2 && (
          <div className="animate-fade-in space-y-5">
            <div className="card">
              <h2 className="text-lg font-display font-bold text-brand-900 mb-5">Review Your Appointment</h2>
              <div className="space-y-3">
                {[
                  ['Date', form.date],
                  ['Time', fmtTime(form.time_slot)],
                  ['Name', form.name],
                  ['Phone', form.phone],
                  ['Email', form.email],
                  ['Organization', form.organization || '—'],
                  ['Purpose', form.purpose],
                  ['Priority', form.priority === 'vip' ? '⭐ VIP / Priority' : 'Normal'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500 font-medium w-28 shrink-0">{k}</span>
                    <span className="text-sm text-gray-900 font-semibold text-right">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <Captcha onVerified={() => setCaptchaVerified(true)} />
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                id="submit-booking"
                onClick={handleSubmit}
                disabled={submitting || !captchaVerified}
                className="btn-primary flex items-center gap-2 min-w-[160px] justify-center"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Submit Request</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-brand-900 text-brand-200 py-8 text-center">
        <p className="text-sm">Official Appointment Scheduling Portal &mdash; All data is handled securely and confidentially.</p>
        <a href="/admin/login" className="text-brand-400 hover:text-white text-xs mt-2 inline-block transition-colors">
          Staff Login
        </a>
      </footer>
    </div>
  )
}
