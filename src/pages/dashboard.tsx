'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../contexts/AuthContext';
import { useDataContext, Payment, Message, Attendance, Student } from '../contexts/DataContext';
import { useModalContext } from '../contexts/ModalContext';
import Button from '../components/ui/Button';

interface AuthContext {
  user: { full_name?: string; email: string; role: string } | null;
  loading: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext() as AuthContext;
  const {
    students = [] as Student[],
    attendance = [] as Attendance[],
    payments = [] as Payment[],
    messages = [] as Message[],
    loading: dataLoading,
  } = useDataContext();
  const { openModal } = useModalContext();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || dataLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance: number = attendance.filter((a) => a.date === today && a.status === 'present').length;
  const totalPayments: number = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const unreadMessages: number = messages.filter((m) => !m.read_at).length;

  // Type-safe modal helpers
  const openComposeMessageModal = (recipientId: string): void => {
    openModal<'compose-message'>('compose-message', { recipientId });
  };

  const openRecordPaymentModal = (studentId: string, amount: number = 0): void => {
    openModal<'record-payment'>('record-payment', { studentId, amount });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.full_name || user.email}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Students</h3>
          <p className="text-3xl font-bold text-indigo-600">{students.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Today&apos;s Attendance</h3>
          <p className="text-3xl font-bold text-emerald-600">{todayAttendance}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Payments</h3>
          <p className="text-3xl font-bold text-amber-600">${totalPayments.toFixed(2)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unread Messages</h3>
          <p className="text-3xl font-bold text-blue-600">{unreadMessages}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
            <Button
              onClick={() => {
                if (students && students.length > 0) {
                  openComposeMessageModal(students[0].id);
                } else {
                  alert('No students available to message.');
                }
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
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(message.sent_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No recent messages.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
            <Button
              onClick={() => {
                if (students && students.length > 0) {
                  openRecordPaymentModal(students[0].id, 0);
                } else {
                  alert('No students available to record payment.');
                }
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
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                      Paid
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{payment.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Pending'}
                  </p>
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