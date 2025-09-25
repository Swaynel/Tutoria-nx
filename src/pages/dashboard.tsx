// src/pages/dashboard.tsx
'use client';

import { JSX, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthContext } from '../contexts/AuthContext';
import { useDataContext } from '../contexts/DataContext';
import { useModalContext } from '../contexts/ModalContext';
import { AT_CONFIG } from '../lib/africastalking';
import Button from '../components/ui/Button';
import { Payment, AttendanceRecord, Message, Student } from '../types';
import { SuperAdminDashboard } from '../components/dashboards';

// Skeleton loader component
const DashboardSkeleton = () => (
  <div className="p-6 animate-pulse">
    {/* Header Skeleton */}
    <div className="mb-6">
      <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      <div className="mt-4 bg-slate-200 h-20 rounded-xl"></div>
    </div>

    {/* Quick Actions Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 bg-slate-200 rounded-xl h-24"></div>
      ))}
    </div>

    {/* Metrics Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-slate-200 p-6 rounded-xl h-32"></div>
      ))}
    </div>

    {/* Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-slate-200 p-6 rounded-xl h-80"></div>
      ))}
    </div>
  </div>
);

// Error component
const DashboardError = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="p-6">
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
      <div className="text-rose-500 text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-rose-800 mb-2">Unable to load dashboard</h3>
      <p className="text-rose-600 mb-4">{message}</p>
      <Button onClick={onRetry} variant="primary">
        Try Again
      </Button>
    </div>
  </div>
);

export default function Dashboard(): JSX.Element | null {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const { 
    students, 
    attendance, 
    payments, 
    messages, 
    loading: dataLoading, 
    error: dataError,
    refreshAllData: fetchAllSchoolData
  } = useDataContext();
  const { openModal } = useModalContext();

  const [retryCount, setRetryCount] = useState(0);

  // Error state management
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
useEffect(() => {
  if (dataError) {
    setHasError(true);

    let message: string;

    if (typeof dataError === 'string') {
      message = dataError;
    } else if ((dataError as Error).message) {
      message = (dataError as Error).message;
    } else {
      message = 'Failed to load dashboard data';
    }

    setErrorMessage(message);
  } else if (!dataLoading) {
    setHasError(false);
    setErrorMessage('');
  }
}, [dataError, dataLoading]);

  // Memoized derived data
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todaysAttendance = useMemo(() => {
    if (!attendance || !Array.isArray(attendance)) return [];
    return attendance.filter((a: AttendanceRecord) => a.date === today);
  }, [attendance, today]);

  const presentCount = useMemo(() => {
    return todaysAttendance.filter((a: AttendanceRecord) => a.status === 'present').length;
  }, [todaysAttendance]);

  const attendanceRate = useMemo(() => {
    return todaysAttendance.length > 0 ? (presentCount / todaysAttendance.length) * 100 : 0;
  }, [todaysAttendance.length, presentCount]);

  const totalPayments = useMemo(() => {
    if (!payments || !Array.isArray(payments)) return 0;
    return payments.reduce((sum: number, payment: Payment) => sum + (payment.amount || 0), 0);
  }, [payments]);

  const unreadMessages = useMemo(() => {
    if (!messages || !Array.isArray(messages)) return 0;
    return messages.filter((m: Message) => !m.read_at).length;
  }, [messages]);

  const firstStudentId = useMemo(() => {
    return students && students.length > 0 ? students[0].id : undefined;
  }, [students]);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !user) {
      void router.push('/login');
    }
  }, [user, authLoading, router]);

  // Auto-retry mechanism
  useEffect(() => {
    if (hasError && retryCount < 3) {
      const timer = setTimeout(() => {
        fetchAllSchoolData();
        setRetryCount(prev => prev + 1);
      }, 3000 * retryCount);

      return () => clearTimeout(timer);
    }
  }, [hasError, retryCount]);

  const handleRetry = () => {
    setHasError(false);
    setRetryCount(0);
    fetchAllSchoolData();
  };

  // Show error state
  if (hasError && retryCount >= 3) {
    return <DashboardError message={errorMessage} onRetry={handleRetry} />;
  }

  // Show loading state
  if (authLoading || dataLoading) {
    return <DashboardSkeleton />;
  }

  // Authentication check
  if (!user) {
    return null;
  }

  // Modal handlers
  const openComposeMessageModal = (recipientId?: string): void => {
    openModal('compose-message', { recipientId });
  };

  const openRecordPaymentModal = (studentId?: string, amount: number = 0): void => {
    openModal('record-payment', { studentId, amount });
  };

  const role = (user as { role?: string })?.role || 'school_admin';
  const isAdmin = role === 'superadmin' || role === 'school_admin';
  const isTeacher = role === 'teacher';

  if (role === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-KE', { 
        style: 'currency', 
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch {
      return `KES ${amount.toLocaleString()}`;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Pending';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600">
          Welcome back, {user.full_name || user.email || 'User'}!
        </p>

        {/* USSD Promotion Banner */}
        <div className="mt-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-4 rounded-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold">USSD Service Now Active! 📱</h3>
              <p className="text-sm opacity-90 mt-1">
                Parents can dial <strong className="text-lg font-mono">{AT_CONFIG.USSD_SERVICE_CODE}</strong> to check attendance and fees
              </p>
            </div>
            {isAdmin && (
              <Button 
                onClick={() => openModal('bulk-sms', { target: 'parents' })} 
                variant="secondary" 
                size="sm"
                className="shrink-0 bg-white/20 hover:bg-white/30 text-white"
              >
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
          className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-teal-400 transition-colors text-left group hover:shadow-md"
          aria-label="Send message"
        >
          <div className="text-2xl mb-2 group-hover:scale-110 transition-transform text-teal-600">💬</div>
          <h3 className="font-semibold text-slate-800">Send Message</h3>
          <p className="text-sm text-slate-600">SMS or in-app</p>
        </button>

        {isAdmin && (
          <button
            onClick={() => openModal('bulk-sms', {})}
            className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-amber-400 transition-colors text-left group hover:shadow-md"
            aria-label="Send bulk SMS"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform text-amber-600">📢</div>
            <h3 className="font-semibold text-slate-800">Bulk SMS</h3>
            <p className="text-sm text-slate-600">School-wide alerts</p>
          </button>
        )}

        {(isAdmin || isTeacher) && (
          <button
            onClick={() => openModal('mark-attendance', {})}
            className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-emerald-400 transition-colors text-left group hover:shadow-md"
            aria-label="Mark attendance"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform text-emerald-600">📝</div>
            <h3 className="font-semibold text-slate-800">Attendance</h3>
            <p className="text-sm text-slate-600">Auto-SMS alerts</p>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => openRecordPaymentModal()}
            className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-violet-400 transition-colors text-left group hover:shadow-md"
            aria-label="Record payment"
          >
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform text-violet-600">💰</div>
            <h3 className="font-semibold text-slate-800">Payments</h3>
            <p className="text-sm text-slate-600">SMS confirmations</p>
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-teal-500">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Total Students</h3>
          <p className="text-3xl font-bold text-teal-600">
            {students?.length || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Today&apos;s Attendance</h3>
          <p className="text-3xl font-bold text-emerald-600">{presentCount}</p>
          <p className="text-sm text-slate-600 mt-1">
            {todaysAttendance.length > 0 ? `${attendanceRate.toFixed(0)}% attendance rate` : 'No attendance recorded'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-violet-500">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Total Payments</h3>
          <p className="text-3xl font-bold text-violet-600">
            {formatCurrency(totalPayments)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Unread Messages</h3>
          <p className="text-3xl font-bold text-blue-600">{unreadMessages}</p>
        </div>
      </div>

      {/* Recent Messages & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent Messages</h3>
            <Button
              onClick={() => openComposeMessageModal(firstStudentId)}
              size="sm"
              disabled={!firstStudentId}
              aria-label="Compose new message"
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              New Message
            </Button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {messages && messages.length > 0 ? (
              messages.slice(0, 5).map((message: Message) => (
                <div key={message.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-medium text-slate-800 truncate">{message.subject || 'No Subject'}</p>
                  <p className="text-sm text-slate-600 truncate">{message.content || 'No content'}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(message.sent_at)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-2">💬</div>
                <p>No recent messages</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent Payments</h3>
            <Button
              onClick={() => openRecordPaymentModal(firstStudentId, 0)}
              size="sm"
              disabled={!firstStudentId}
              aria-label="Record new payment"
              className="bg-violet-500 hover:bg-violet-600 text-white"
            >
              Record Payment
            </Button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {payments && payments.length > 0 ? (
              payments.slice(0, 5).map((payment: Payment) => (
                <div key={payment.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium text-slate-800">
                      {formatCurrency(payment.amount || 0)}
                    </p>
                    <span 
                      className={`text-xs px-2 py-1 rounded-full ${
                        payment.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {payment.status || 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 truncate">
                    {payment.description || 'No description'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(payment.paid_at)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-2">💰</div>
                <p>No recent payments</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
