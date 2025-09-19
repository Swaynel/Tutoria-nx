// pages/students.tsx
import { ReactElement } from 'react'
import { useDataContext } from '../contexts/DataContext'
import { formatDate } from '../lib/utils'

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  grade?: string
  dateOfBirth?: string
  parentName?: string
  parentPhone?: string
  address?: string
  enrollmentDate?: string
  status?: 'active' | 'inactive' | 'graduated'
  createdAt?: string
  updatedAt?: string
}

export default function Students(): ReactElement {
  const { students, loading } = useDataContext()

  if (loading) {
    return <div className="p-6">Loading students...</div>
  }

  const studentsArray: Student[] = Array.isArray(students) ? students : []

  const totalStudents = studentsArray.length
  const activeStudents = studentsArray.filter(student => student.status === 'active' || !student.status).length
  const inactiveStudents = studentsArray.filter(student => student.status === 'inactive').length
  const graduatedStudents = studentsArray.filter(student => student.status === 'graduated').length

  const gradeGroups = studentsArray.reduce((acc, student) => {
    const grade = student.grade || 'Unassigned'
    acc[grade] = (acc[grade] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-600">Manage student information and records</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active</h3>
          <p className="text-3xl font-bold text-green-600">{activeStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Inactive</h3>
          <p className="text-3xl font-bold text-red-600">{inactiveStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Graduated</h3>
          <p className="text-3xl font-bold text-purple-600">{graduatedStudents}</p>
        </div>
      </div>

      {/* Grade Distribution */}
      {Object.keys(gradeGroups).length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Students by Grade</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(gradeGroups).map(([grade, count]) => (
              <div key={grade} className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{count}</div>
                <div className="text-sm text-gray-500">{grade}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">All Students</h3>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
              Add Student
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentsArray.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  studentsArray.map((student: Student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100">
                            <span className="text-sm font-medium text-indigo-700">
                              {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">ID: {student.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{student.phone || 'Not provided'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{student.grade || 'Not assigned'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {student.enrollmentDate ? formatDate(student.enrollmentDate) : 'Not provided'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {student.createdAt ? formatDate(student.createdAt) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            student.status === 'active' || !student.status
                              ? 'bg-green-100 text-green-800'
                              : student.status === 'inactive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {student.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-2">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => console.log('View student:', student.id)}
                        >
                          View
                        </button>
                        <button
                          className="text-amber-600 hover:text-amber-900"
                          onClick={() => console.log('Edit student:', student.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => console.log('Delete student:', student.id)}
                        >
                          Delete
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
