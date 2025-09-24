// src/components/modals/MarkAttendanceModal.tsx
import { useState } from 'react'
import { useDataContext } from '../../contexts/DataContext'
import { supabase } from '../../lib/supabase'
import type { Student } from '../../types'

interface MarkAttendanceModalProps {
  onClose: () => void
}

export default function MarkAttendanceModal({ onClose }: MarkAttendanceModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'present' | 'absent' | 'late'>>({})
  const [isSaving, setIsSaving] = useState(false)
  const { students = [], refreshAllData, userProfile } = useDataContext()

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSubmit = async () => {
    if (!userProfile?.id || !userProfile.school_id) {
        alert('Could not identify user or school. Please try again.')
        return
    }

    const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      school_id: userProfile.school_id,
      student_id: studentId,
      date: selectedDate,
      status,
      marked_by: userProfile.id
    }))

    if (records.length === 0) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('attendance')
        .insert(records as unknown as Record<string, unknown>)

      if (error) throw error

      // This part for sending notifications can be kept if your API route is set up
      const absentStudents = students.filter(student => attendanceRecords[student.id] === 'absent')
      if (absentStudents.length > 0) {
        console.log('Sending notifications for absent students:', absentStudents)
        // Example:
        // await fetch('/api/send-attendance-alert', { ... })
      }

      await refreshAllData()
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
          {students.length > 0 ? (
            students.map((student: Student) => (
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
            ))
          ) : (
            <p className="text-sm text-gray-500">No students found.</p>
          )}
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