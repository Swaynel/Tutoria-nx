'use client';

import { ReactElement, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { formatDate } from '../lib/utils';

// Define the valid status types from your schema
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// Extended interface with student name and school_id (both required)
interface AttendanceWithStudent {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus; 
  marked_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  student_name: string; // required
  school_id: string;    // required
}

// Helper to validate and cast status
const isValidStatus = (status: string): status is AttendanceStatus => {
  return ['present', 'absent', 'late', 'excused'].includes(status);
};

export default function Attendance(): ReactElement {
  const { attendance, students, loading } = useDataContext();

  // Create a lookup map for student names
  const studentMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(students)) {
      students.forEach(student => {
        map[student.id] = student.name || 'Unknown Student';
      });
    }
    return map;
  }, [students]);

  // Enhance attendance records with student names, validated status, and school_id
  const attendanceWithNames = useMemo(() => {
    if (!Array.isArray(attendance)) return [];

    return attendance
      .map(record => {
        const status = isValidStatus(record.status) ? record.status : 'present';
        const school_id = record.school_id || 'unknown_school';

        return {
          ...record,
          status,
          student_name: studentMap[record.student_id] || 'Unknown Student',
          school_id,
        };
      })
      .filter((record): record is AttendanceWithStudent =>
        typeof record.id === 'string' &&
        typeof record.student_id === 'string' &&
        typeof record.date === 'string' &&
        typeof record.school_id === 'string' &&
        typeof record.student_name === 'string'
      );
  }, [attendance, studentMap]);

  if (loading) {
    return <div className="p-6">Loading attendance records...</div>;
  }

  const totalRecords = attendanceWithNames.length;
  const presentCount = attendanceWithNames.filter(r => r.status === 'present').length;
  const absentCount = attendanceWithNames.filter(r => r.status === 'absent').length;
  const lateCount = attendanceWithNames.filter(r => r.status === 'late').length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  // Safe date formatting
  const safeFormatDate = (dateString: string): string => {
    try {
      return formatDate ? formatDate(dateString) : new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600">View and manage attendance records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Records</h3>
          <p className="text-3xl font-bold text-gray-600">{totalRecords}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Present</h3>
          <p className="text-3xl font-bold text-green-600">{presentCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Absent</h3>
          <p className="text-3xl font-bold text-red-600">{absentCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Late</h3>
          <p className="text-3xl font-bold text-yellow-600">{lateCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance Rate</h3>
          <p className="text-3xl font-bold text-blue-600">{attendanceRate}%</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
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
                {attendanceWithNames.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendanceWithNames.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {safeFormatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : record.status === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800' // for 'excused'
                          }`}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => console.log('Edit attendance:', record.id)}
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
  );
}
