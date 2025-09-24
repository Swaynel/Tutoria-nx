// src/pages/dashboard.tsx
'use client';

import { JSX, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../contexts/AuthContext';
import { useDataContext } from '../contexts/DataContext';
import { useModalContext } from '../contexts/ModalContext';
import { AT_CONFIG } from '../lib/africastalking';
import Button from '../components/ui/Button';
import { Payment, AttendanceRecord, Message } from '../types';
import { SuperAdminDashboard } from '../components/dashboards'

export default function Dashboard(): JSX.Element | null {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext(); // user is AppUser | null

  const {
    students,
    attendance,
    payments,
    messages,
    loading: dataLoading,
  } = useDataContext();

  const { openModal } = useModalContext();

  // Memoized derived data (call hooks unconditionally to satisfy Rules of Hooks)
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const todaysAttendance = useMemo(
    () => attendance.filter((a: AttendanceRecord) => a.date === today),
    [attendance, today]
  )

  const presentCount = useMemo(
    () => todaysAttendance.filter((a: AttendanceRecord) => a.status === 'present').length,
    [todaysAttendance]
  )

  const attendanceRate = useMemo(
    () => (todaysAttendance.length > 0 ? (presentCount / todaysAttendance.length) * 100 : 0),
    [todaysAttendance.length, presentCount]
  )

  const totalPayments = useMemo(
    () => payments.reduce((sum: number, payment: Payment) => sum + (payment.amount || 0), 0),
    [payments]
  )

  const unreadMessages = useMemo(() => messages.filter((m: Message) => !m.read_at).length, [messages])

  useEffect(() => {
    if (!authLoading && !user) {
      void router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || dataLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!user) return null;

  const openComposeMessageModal = (recipientId?: string): void => {
    openModal('compose-message', { recipientId })
  }

  const openRecordPaymentModal = (studentId?: string, amount: number = 0): void => {
    openModal('record-payment', { studentId, amount })
  }

  // Role helpers
  const role = (user as { role?: string })?.role || 'school_admin'
  const isAdmin = role === 'superadmin' || role === 'school_admin'
  const isTeacher = role === 'teacher'

  // If user is superadmin render special console
  if (role === 'superadmin') {
    return <SuperAdminDashboard />
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.full_name || user.email}!</p>

        {/* USSD Promotion Banner */}
        <div className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">USSD Service Now Active! 📱</h3>
              <p className="text-sm opacity-90">
                Parents can dial <strong className="text-lg">{AT_CONFIG.USSD_SERVICE_CODE}</strong> to check attendance and fees
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => openModal('bulk-sms', { target: 'parents' })} variant="secondary" size="sm">
                Notify Parents
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => openComposeMessageModal()}
          className="p-4 bg-white rounded-lg shadow border-2 border-transparent hover:border-indigo-500 transition-colors"
        >
          <div className="text-2xl mb-2">💬</div>
          <h3 className="font-semibold">Send Message</h3>
          <p className="text-sm text-gray-600">SMS or in-app</p>
        </button>

        {isAdmin && (
          <button
            onClick={() => openModal('bulk-sms', {})}
            className="p-4 bg-white rounded-lg shadow border-2 border-transparent hover:border-indigo-500 transition-colors"
            aria-label="Send bulk SMS"
          >
            <div className="text-2xl mb-2">📢</div>
            <h3 className="font-semibold">Bulk SMS</h3>
            <p className="text-sm text-gray-600">School-wide alerts</p>
          </button>
        )}

        {(isAdmin || isTeacher) && (
          <button
            onClick={() => openModal('mark-attendance', {})}
            className="p-4 bg-white rounded-lg shadow border-2 border-transparent hover:border-indigo-500 transition-colors"
          >
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold">Attendance</h3>
            <p className="text-sm text-gray-600">Auto-SMS alerts</p>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => openRecordPaymentModal()}
            className="p-4 bg-white rounded-lg shadow border-2 border-transparent hover:border-indigo-500 transition-colors"
          >
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-semibold">Payments</h3>
            <p className="text-sm text-gray-600">SMS confirmations</p>
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Students</h3>
          <p className="text-3xl font-bold text-indigo-600">{students.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Today&apos;s Attendance</h3>
          <p className="text-3xl font-bold text-emerald-600">{presentCount}</p>
          <p className="text-sm text-gray-600">{attendanceRate.toFixed(0)}% attendance rate</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Payments</h3>
          <p className="text-3xl font-bold text-amber-600">{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(totalPayments)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unread Messages</h3>
          <p className="text-3xl font-bold text-blue-600">{unreadMessages}</p>
        </div>
      </div>

      {/* Recent Messages & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
            <Button
              onClick={() => {
                if (students.length > 0) openComposeMessageModal(students[0].id);
                else openComposeMessageModal();
              }}
              size="sm"
              aria-label="Compose new message"
            >
              New Message
            </Button>
          </div>

          <div className="space-y-3">
            {messages.length > 0 ? (
              messages.slice(0, 5).map((message: Message) => (
                <div key={message.id} className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">{message.subject}</p>
                  <p className="text-sm text-gray-600 truncate">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(message.sent_at).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No recent messages.</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
            <Button
              onClick={() => {
                if (students.length > 0) openRecordPaymentModal(students[0].id, 0);
                else openRecordPaymentModal();
              }}
              size="sm"
              aria-label="Record new payment"
            >
              Record Payment
            </Button>
          </div>

          <div className="space-y-3">
            {payments.length > 0 ? (
              payments.slice(0, 5).map((payment: Payment) => (
                <div key={payment.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">${(payment.amount || 0).toFixed(2)}</p>
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">Paid</span>
                  </div>
                  <p className="text-sm text-gray-600">{payment.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Pending'}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No recent payments.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
