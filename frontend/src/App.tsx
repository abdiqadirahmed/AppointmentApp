import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PublicBooking from './pages/PublicBooking'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminList from './pages/AdminList'
import AdminCalendar from './pages/AdminCalendar'
import AdminSettings from './pages/AdminSettings'
import Analytics from './pages/Analytics'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token')
  return token ? <>{children}</> : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicBooking />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin protected */}
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>}>
          <Route index element={<Analytics />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="appointments" element={<AdminList />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
