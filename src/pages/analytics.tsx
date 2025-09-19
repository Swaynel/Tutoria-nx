import { useState, useEffect } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { useDataContext } from '../contexts/DataContext'
import { formatCurrency } from '../lib/utils'

export default function Analytics() {
  const { user } = useAuthContext()
  const { students = [], attendance = [], payments = [] } = useDataContext()
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    totalRevenue: 0,
    averagePayment: 0
  })

  useEffect(() => {
    if (!user) return

    // Calculate today's attendance
    const today = new Date().toISOString().split('T')[0]
    const todayAttendance = attendance.filter(a => a?.date === today)
    const presentCount = todayAttendance.filter(a => a?.status === 'present').length
    const attendanceRate = todayAttendance.length > 0 ? (presentCount / todayAttendance.length) * 100 : 0

    // Calculate payments
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment?.amount || 0), 0)
    const averagePayment = payments.length > 0 ? totalRevenue / payments.length : 0

    setStats({
      totalStudents: students.length,
      attendanceRate,
      totalRevenue,
      averagePayment
    })
  }, [students, attendance, payments, user])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">School performance insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalStudents}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Today&apos;s Attendance</h3>
          <p className="text-3xl font-bold text-emerald-600">{stats.attendanceRate.toFixed(1)}%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-amber-600">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg. Payment</h3>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.averagePayment)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Attendance chart will appear here</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Revenue chart will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
