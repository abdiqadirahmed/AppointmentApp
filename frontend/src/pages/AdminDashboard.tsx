import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-64 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
