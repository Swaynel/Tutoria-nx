import { useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { useDataContext, Student } from '../../contexts/DataContext'
import { supabase } from '../../lib/supabase'

interface MarkAttendanceModalProps {
  onClose: () => void
}

export default function MarkAttendanceModal({ onClose }: MarkAttendanceModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'late'>>({})
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuthContext()
  const { students = [], refreshData } = useDataContext()

  // Debug: Log students to verify data
  console.log('Students:', students)

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSubmit = async () => {
    if (!user) return

    const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      school_id: user.school_id,
      student_id: studentId,
      date: selectedDate,
      status,
      marked_by: user.id
    }))

    if (records.length === 0) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('attendance')
        .insert(records)

      if (error) throw error

      // Send notifications for absent students
      const absentStudents = records.filter(r => r.status === 'absent')
      if (absentStudents.length > 0) {
        await fetch('/api/send-attendance-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            students: absentStudents,
            date: selectedDate
          })
        })
      }

      await refreshData?.()
      onClose()
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Failed to save attendance. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Mark Attendance</h2>
      
      <div className="mb-4">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date
        </label>
        <input
          type="date"
          id="date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>
      
      <div className="mb-4 max-h-96 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Students</h3>
        <div className="space-y-2">
          {students.map((student: Student) => (
            <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">
                {student.name}{student.grade ? ` (${student.grade})` : ''}
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={`px-2 py-1 text-xs rounded ${
                    attendanceRecords[student.id] === 'present'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                  onClick={() => handleStatusChange(student.id, 'present')}
                >
                  Present
                </button>
                <button
                  type="button"
                  className={`px-2 py-1 text-xs rounded ${
                    attendanceRecords[student.id] === 'absent'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                  onClick={() => handleStatusChange(student.id, 'absent')}
                >
                  Absent
                </button>
                <button
                  type="button"
                  className={`px-2 py-1 text-xs rounded ${
                    attendanceRecords[student.id] === 'late'
                      ? 'bg-amber-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                  onClick={() => handleStatusChange(student.id, 'late')}
                >
                  Late
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isSaving || Object.keys(attendanceRecords).length === 0}
        >
          {isSaving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  )
}