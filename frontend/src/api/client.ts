import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh token on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh/', { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/admin/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(err)
  }
)

// ── Public endpoints ──────────────────────────────────────────
export const fetchSlots = (date: string) =>
  api.get(`/slots/?date=${date}`)

export const submitAppointment = (data: object) =>
  api.post('/appointments/', data)

export const getCaptcha = () =>
  api.get('/captcha/')

export const verifyCaptcha = (token: string, answer: string) =>
  api.post('/captcha/verify/', { token, answer })

// ── Auth ──────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  api.post('/auth/login/', { username, password })

export const logout = (refresh: string) =>
  api.post('/auth/logout/', { refresh })

// ── Admin — Appointments ──────────────────────────────────────
export const listAppointments = (params?: object) =>
  api.get('/admin/appointments/', { params })

export const adminCreateAppointment = (data: object) =>
  api.post('/admin/appointments/create/', data)

export const getAppointment = (id: number) =>
  api.get(`/admin/appointments/${id}/`)

export const updateAppointment = (id: number, data: object) =>
  api.patch(`/admin/appointments/${id}/`, data)

export const deleteAppointment = (id: number) =>
  api.delete(`/admin/appointments/${id}/`)

// ── Admin — Calendar ──────────────────────────────────────────
export const fetchCalendarData = (year: number, month: number) =>
  api.get('/admin/calendar/', { params: { year, month } })

// ── Admin — Availability ──────────────────────────────────────
export const fetchAvailability = () =>
  api.get('/admin/availability/')

export const updateAvailability = (day: number, data: object) =>
  api.patch(`/admin/availability/${day}/`, data)

// ── Admin — Blocked Dates ─────────────────────────────────────
export const fetchBlockedDates = () =>
  api.get('/admin/blocked-dates/')

export const blockDate = (date: string, reason: string) =>
  api.post('/admin/blocked-dates/', { date, reason })

export const unblockDate = (id: number) =>
  api.delete(`/admin/blocked-dates/${id}/`)

// ── Analytics ─────────────────────────────────────────────────
export const fetchAnalytics = () =>
  api.get('/admin/analytics/')

export default api
