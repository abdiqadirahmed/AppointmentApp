// Shared TypeScript types across the frontend

export interface Appointment {
  id: number
  name: string
  phone: string
  email: string
  purpose: string
  organization: string
  date: string           // YYYY-MM-DD
  time_slot: string      // HH:MM:SS
  priority: 'normal' | 'vip'
  status: 'pending' | 'approved' | 'cancelled' | 'rescheduled' | 'completed'
  status_display: string
  priority_display: string
  admin_notes: string
  rescheduled_date: string | null
  rescheduled_time: string | null
  confirmation_sent: boolean
  reminder_24h_sent: boolean
  reminder_1h_sent: boolean
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  time: string    // HH:MM
  label: string   // 09:00 AM
  available: boolean
}

export interface SlotsResponse {
  slots: TimeSlot[]
  blocked: boolean
  reason?: string
  day_name?: string
  working_hours?: string
  max_per_day?: number
  booked_count?: number
  total_slots?: number
}

export interface Availability {
  id: number
  day_of_week: number
  day_name: string
  is_active: boolean
  start_time: string
  end_time: string
  slot_duration: number
  buffer_time: number
  max_per_day: number
  lunch_start: string | null
  lunch_end: string | null
}

export interface BlockedDate {
  id: number
  date: string
  reason: string
  created_at: string
}

export interface Analytics {
  total: number
  pending: number
  approved: number
  cancelled: number
  completed: number
  today: number
  this_month: number
  vip_count: number
  approval_rate: number
  trend: { date: string; count: number; label: string }[]
  busiest_days: { date: string; count: number }[]
}

export interface CalendarData {
  appointments: Pick<Appointment, 'id' | 'date' | 'status' | 'priority' | 'name' | 'time_slot'>[]
  blocked_dates: BlockedDate[]
  active_days: number[]
}

export interface AuthState {
  token: string | null
  user: { id: number; username: string; name: string } | null
}
