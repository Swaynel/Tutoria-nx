'use client'

import React, { useMemo, useState } from 'react';

// Define types for better type safety
type UserRole = 'superadmin' | 'school_admin' | 'teacher' | 'parent';

interface Message {
  id: string;
  subject: string;
  sent_at: string;
  read_at: string | null;
  sender?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

// Define modal types and props
type ModalType = 'compose-message' | 'mark-attendance' | 'record-payment' | 'add-user' | null;

interface ComposeMessageProps {
  initialTo?: string;
  initialMessage?: string;
}

interface MarkAttendanceProps {
  classId?: string;
}

interface RecordPaymentProps {
  studentId?: string;
}

interface AddUserProps {
  defaultRole?: UserRole;
}

type BaseModalProps<T extends ModalType> = T extends 'compose-message'
  ? ComposeMessageProps
  : T extends 'mark-attendance'
  ? MarkAttendanceProps
  : T extends 'record-payment'
  ? RecordPaymentProps
  : T extends 'add-user'
  ? AddUserProps
  : never;

// Mock contexts for demo
const useModalContext = () => ({
  openModal: <T extends Exclude<ModalType, null>>(type: T, props: BaseModalProps<T>) => {
    console.log(`Opening modal: ${type}`, props);
  },
});

const useAuthContext = () => ({
  user: {
    role: 'school_admin' as const,
    full_name: 'John Doe',
  },
});

const useDataContext = () => ({
  messages: [
    {
      id: '1',
      subject: 'Parent-Teacher Conference Schedule',
      sent_at: '2024-01-15T10:30:00Z',
      read_at: null,
      sender: 'Sarah Johnson',
      priority: 'high',
    },
    {
      id: '2',
      subject: 'Student Fee Payment Due',
      sent_at: '2024-01-14T14:20:00Z',
      read_at: null,
      sender: 'Finance Department',
      priority: 'medium',
    },
    {
      id: '3',
      subject: 'Holiday Schedule Update',
      sent_at: '2024-01-13T09:15:00Z',
      read_at: null,
      sender: 'Admin Office',
      priority: 'low',
    },
  ] as Message[],
  notifications: [
    {
      id: '1',
      title: 'New Student Registration',
      message: '3 new students registered today',
      type: 'success',
      timestamp: '2024-01-15T11:00:00Z',
      read: false,
    },
    {
      id: '2',
      title: 'System Maintenance',
      message: 'Scheduled maintenance tonight 11 PM - 2 AM',
      type: 'warning',
      timestamp: '2024-01-15T08:30:00Z',
      read: false,
    },
    {
      id: '3',
      title: 'Payment Overdue',
      message: '5 students have overdue payments',
      type: 'error',
      timestamp: '2024-01-14T16:45:00Z',
      read: true,
    },
  ] as Notification[],
});

interface QuickAction {
  name: string;
  action: () => void;
  roles: UserRole[];
  icon: string;
  description: string;
}

const RightSidebar = () => {
  const [activeTab, setActiveTab] = useState<'actions' | 'messages' | 'notifications'>('actions');
  const { openModal } = useModalContext();
  const { user } = useAuthContext();
  const { messages, notifications } = useDataContext();

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        name: 'New Message',
        action: () => openModal('compose-message', {}),
        roles: ['superadmin', 'school_admin', 'teacher', 'parent'],
        icon: '✉️',
        description: 'Send message to parents or teachers',
      },
      {
        name: 'Mark Attendance',
        action: () => openModal('mark-attendance', {}),
        roles: ['superadmin', 'school_admin', 'teacher'],
        icon: '✅',
        description: 'Record student attendance for today',
      },
      {
        name: 'Record Payment',
        action: () => openModal('record-payment', {}),
        roles: ['superadmin', 'school_admin', 'teacher'],
        icon: '💳',
        description: 'Log fee payments and transactions',
      },
      {
        name: 'Add User',
        action: () => openModal('add-user', {}),
        roles: ['superadmin', 'school_admin'],
        icon: '👤',
        description: 'Add new student, teacher, or parent',
      },
    ],
    [openModal]
  );

  const filteredActions = useMemo(
    () => quickActions.filter((action) => user?.role && action.roles.includes(user.role)),
    [user?.role, quickActions]
  );

  const topUnreadMessages = useMemo(
    () => messages.filter((m) => !m.read_at).slice(0, 5),
    [messages]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read).slice(0, 5),
    [notifications]
  );

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  const getPriorityColor = (priority?: Message['priority']): string => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getNotificationColor = (type: Notification['type']): string => {
    switch (type) {
      case 'success':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  type TabKey = 'actions' | 'messages' | 'notifications';

  return (
    <aside className="w-80 border-l border-white/10 flex flex-col shadow-lg bg-gray-100" aria-label="Right Sidebar">
      {/* Header with Tabs */}
      <div className="border-b border-white/10 bg-indigo-900">
        <div className="flex">
          {[
            { key: 'actions', label: 'Actions', count: filteredActions.length },
            { key: 'messages', label: 'Messages', count: topUnreadMessages.length },
            { key: 'notifications', label: 'Alerts', count: unreadNotifications.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-all duration-200 relative ${
                activeTab === tab.key
                  ? 'text-white border-b-2 border-emerald-500'
                  : 'text-gray-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="flex items-center justify-center space-x-1">
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                      activeTab === tab.key ? 'text-black bg-white' : 'bg-white/20 text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'actions' && (
          <div className="p-4">
            <div className="space-y-3">
              {filteredActions.length > 0 ? (
                filteredActions.map((action) => (
                  <button
                    key={action.name}
                    onClick={action.action}
                    className="w-full text-left p-4 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 bg-emerald-500 hover:bg-emerald-600"
                    aria-label={`Perform ${action.name} action`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">{action.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{action.name}</div>
                        <div className="text-xs opacity-90 mt-1 line-clamp-2">{action.description}</div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 text-gray-900">🚫</div>
                  <p className="text-sm text-gray-900">No actions available for your role</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="p-4">
            <div className="space-y-3">
              {topUnreadMessages.length > 0 ? (
                topUnreadMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer ${getPriorityColor(
                      message.priority
                    )}`}
                    aria-label={`Message: ${message.subject}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2 pr-2">{message.subject}</h3>
                      {message.priority && (
                        <span className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full border">
                          {message.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs opacity-75">
                      <span>{message.sender || 'Unknown'}</span>
                      <span>{formatTimeAgo(message.sent_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 text-gray-900">📬</div>
                  <p className="text-sm text-gray-900">No new messages</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="p-4">
            <div className="space-y-3">
              {unreadNotifications.length > 0 ? (
                unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-current mt-2 opacity-60"></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">{notification.title}</h3>
                        <p className="text-xs opacity-75 mb-2 line-clamp-2">{notification.message}</p>
                        <span className="text-xs opacity-60">{formatTimeAgo(notification.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2 text-gray-900">🔔</div>
                  <p className="text-sm text-gray-900">No new notifications</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-4 bg-indigo-900">
        <div className="flex items-center justify-between text-xs text-white">
          <span>Welcome, {user?.full_name?.split(' ')[0] || 'User'}</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </aside>
  );
};

export default React.memo(RightSidebar);
