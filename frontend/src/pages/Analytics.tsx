import { useEffect, useState } from 'react'
import {
  BarChart3, Users, CheckCircle, XCircle, Clock,
  Calendar, Star, TrendingUp, RefreshCw
} from 'lucide-react'
import { fetchAnalytics } from '../api/client'
import type { Analytics as AnalyticsType } from '../types'
import toast from 'react-hot-toast'

interface StatCardProps {
  label: string; value: number | string; icon: React.ElementType
  color: string; bg: string; sub?: string
}

function StatCard({ label, value, icon: Icon, color, bg, sub }: StatCardProps) {
  return (
    <div className="card flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-brand-900">{value}</p>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsType | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data: d } = await fetchAnalytics()
      setData(d)
    } catch {
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
    </div>
  )

  if (!data) return null

  const maxTrend = Math.max(...data.trend.map(t => t.count), 1)

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-brand-900">Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Appointment statistics and trends</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm hover:shadow transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Appointments" value={data.total}
          icon={Users} color="text-brand-700" bg="bg-brand-50" />
        <StatCard label="Pending Review" value={data.pending}
          icon={Clock} color="text-amber-600" bg="bg-amber-50" sub="Awaiting approval" />
        <StatCard label="Approved" value={data.approved}
          icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Cancelled" value={data.cancelled}
          icon={XCircle} color="text-red-500" bg="bg-red-50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Today" value={data.today}
          icon={Calendar} color="text-blue-600" bg="bg-blue-50" sub="Appointments today" />
        <StatCard label="This Month" value={data.this_month}
          icon={BarChart3} color="text-violet-600" bg="bg-violet-50" />
        <StatCard label="VIP Bookings" value={data.vip_count}
          icon={Star} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard label="Approval Rate" value={`${data.approval_rate}%`}
          icon={TrendingUp} color="text-teal-600" bg="bg-teal-50" sub="Of all bookings" />
      </div>

      {/* 7-day trend chart */}
      <div className="card mb-6">
        <h2 className="text-base font-display font-bold text-brand-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-700" />
          Last 7 Days
        </h2>
        <div className="flex items-end gap-3 h-40">
          {data.trend.map(t => {
            const pct = maxTrend > 0 ? (t.count / maxTrend) * 100 : 0
            return (
              <div key={t.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-brand-700">
                  {t.count > 0 ? t.count : ''}
                </span>
                <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '120px' }}>
                  <div
                    className="w-full bg-brand-700 rounded-t-lg transition-all duration-700"
                    style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">{t.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status breakdown */}
      <div className="card">
        <h2 className="text-base font-display font-bold text-brand-900 mb-5">Status Breakdown</h2>
        <div className="space-y-3">
          {[
            { label: 'Approved',   count: data.approved,  color: 'bg-emerald-500' },
            { label: 'Pending',    count: data.pending,   color: 'bg-amber-400' },
            { label: 'Completed',  count: data.completed, color: 'bg-blue-500' },
            { label: 'Cancelled',  count: data.cancelled, color: 'bg-red-400' },
          ].map(({ label, count, color }) => {
            const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0
            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">{label}</span>
                  <span className="text-gray-900 font-semibold">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-700`}
                       style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
