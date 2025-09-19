// pages/attendance.tsx
import { ReactElement } from 'react'
import { useDataContext } from '../contexts/DataContext'
import { formatDate } from '../lib/utils'

// Define the complete Attendance interface
interface Attendance {
  id: string
  studentId: string // Using camelCase - change to student_id if using snake_case
  date: string // ISO date string
  status: 'present' | 'absent' | 'late'
  createdAt?: string
  updatedAt?: string
}

// If your data uses snake_case, use this interface instead:
/*
interface Attendance {
  id: string
  student_id: string
  date: string
  status: 'present' | 'absent' | 'late'
  created_at?: string
  updated_at?: string
}
*/

export default function Attendance(): ReactElement {
  const { attendance, loading } = useDataContext()

  if (loading) {
    return <div className="p-6">Loading attendance records...</div>
  }

  // Handle potentially undefined attendance with type safety
  const attendanceRecords: Attendance[] = Array.isArray(attendance) ? attendance : []

  // Calculate some basic stats
  const totalRecords = attendanceRecords.length
  const presentCount = attendanceRecords.filter(record => record.status === 'present').length
  const absentCount = attendanceRecords.filter(record => record.status === 'absent').length
  const lateCount = attendanceRecords.filter(record => record.status === 'late').length

  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">View and manage attendance records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Records</h3>
          <p className="text-3xl font-bold text-gray-600">{totalRecords}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Present</h3>
          <p className="text-3xl font-bold text-green-600">{presentCount}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Absent</h3>
          <p className="text-3xl font-bold text-red-600">{absentCount}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Late</h3>
          <p className="text-3xl font-bold text-yellow-600">{lateCount}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Rate</h3>
          <p className="text-3xl font-bold text-blue-600">{attendanceRate}%</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record: Attendance) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate ? formatDate(record.date) : new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.studentId}
                        {/* If using snake_case: {record.student_id} */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => {
                            // Handle edit functionality
                            console.log('Edit attendance:', record.id)
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
