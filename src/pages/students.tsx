import { ReactElement, useState, useEffect, useRef } from 'react'
import { useDataContext } from '../contexts/DataContext'
import { formatDate } from '../lib/utils'
import { Student } from '../types'

export default function Students(): ReactElement {
  const { students, addStudent, school_id, loading } = useDataContext()
  const [localStudents, setLocalStudents] = useState<Student[]>(students || [])

  // Sync local copy with context whenever students change
  useEffect(() => {
    setLocalStudents(students)
  }, [students])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newStudentName, setNewStudentName] = useState('')
  const [newStudentGrade, setNewStudentGrade] = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setNewStudentName('')
    setNewStudentGrade('')
  }

  useEffect(() => {
    if (isModalOpen && firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [isModalOpen])

  // Close modal on Esc key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudentName || !newStudentGrade) return

    const newStudent: Student = {
      id: crypto.randomUUID(),
      name: newStudentName,
      grade: newStudentGrade,
      status: 'active',
      date_of_birth: undefined,
      created_at: new Date().toISOString(),
      school_id: school_id!,
    }

    try {
      // Add student to backend
      await addStudent({
        name: newStudentName,
        grade: newStudentGrade,
        status: 'active',
        date_of_birth: undefined,
      })

      // Optimistic UI update
      setLocalStudents((prev: Student[]) => [...prev, newStudent])
      closeModal()
    } catch (err) {
      console.error('Failed to add student:', err)
      alert('Error adding student. Check console.')
    }
  }

  if (loading) return <div className="p-6">Loading students...</div>

  const totalStudents = localStudents.length
  const activeStudents = localStudents.filter(s => s.status === 'active' || !s.status).length
  const inactiveStudents = localStudents.filter(s => s.status === 'inactive').length
  const graduatedStudents = localStudents.filter(s => s.status === 'graduated').length

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Students</h1>

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

      {/* Students Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">All Students</h3>
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              onClick={openModal}
            >
              Add Student
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date of Birth</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {localStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  localStudents.map(student => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{student.grade}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {student.date_of_birth ? formatDate(student.date_of_birth) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : student.status === 'inactive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {student.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(student.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
            <h2 className="text-lg font-bold mb-4">Add Student</h2>
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closeModal}
              aria-label="Close modal"
            >
              ✕
            </button>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <input
                ref={firstInputRef}
                className="w-full p-2 border rounded"
                placeholder="Student Name"
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                required
              />
              <input
                className="w-full p-2 border rounded"
                placeholder="Grade"
                value={newStudentGrade}
                onChange={e => setNewStudentGrade(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
