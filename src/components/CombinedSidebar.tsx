// src/components/CombinedSidebar.tsx
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import { useDataContext } from '../contexts/DataContext';
import { useModalContext } from '../contexts/ModalContext';
import { UserRole, Message as AppMessage, Notification } from '../types';

// Mock Link component - replace with your actual router Link
const Link = ({
  href,
  children,
  className,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} className={className} {...props}>
    {children}
  </a>
);

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  roles: UserRole[];
  badge?: number;
}

interface QuickAction {
  name: string;
  action: () => void;
  roles: UserRole[];
  icon: string;
  description: string;
}

// Local interface for sidebar notifications (different from database Notification)
interface SidebarNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: ['superadmin', 'school_admin', 'teacher', 'parent', 'student'] },
  { name: 'Students', href: '/students', icon: '👨‍🎓', roles: ['superadmin', 'school_admin', 'teacher'], badge: 0 },
  { name: 'Teachers', href: '/teachers', icon: '👩‍🏫', roles: ['superadmin', 'school_admin'], badge: 0 },
  { name: 'Parents', href: '/parents', icon: '👨‍👩‍👧', roles: ['superadmin', 'school_admin', 'teacher'], badge: 0 },
  { name: 'Payments', href: '/payments', icon: '💰', roles: ['superadmin', 'school_admin', 'teacher'] },
  { name: 'Attendance', href: '/attendance', icon: '📝', roles: ['superadmin', 'school_admin', 'teacher'] },
  { name: 'Messages', href: '/messages', icon: '💬', roles: ['superadmin', 'school_admin', 'teacher', 'parent'], badge: 0 },
  { name: 'Analytics', href: '/analytics', icon: '📈', roles: ['superadmin', 'school_admin'] },
  { name: 'Settings', href: '/settings', icon: '⚙️', roles: ['superadmin', 'school_admin'] },
];

export default function CombinedSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'navigation' | 'actions' | 'messages' | 'notifications'>('navigation');
  const [sidebarNotifications, setSidebarNotifications] = useState<SidebarNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const { user, signOut: authSignOut } = useAuthContext();
  const { userProfile, messages: allMessages, loading: dataLoading, notifications: dataNotifications } = useDataContext();
  const { openModal } = useModalContext();

  // Filter navigation items based on user role
  const filteredItems = useMemo(() => {
    if (!userProfile?.role) return [];
    return navigationItems.filter((item) => item.roles.includes(userProfile.role));
  }, [userProfile?.role]);

  // Quick actions configuration
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

  const filteredActions = useMemo(() => {
    if (!userProfile?.role) return [];
    return quickActions.filter((action) => action.roles.includes(userProfile.role));
  }, [userProfile?.role, quickActions]);

  // Sync notifications from DataContext
  useEffect(() => {
    if (dataNotifications) {
      const formatted = dataNotifications.map(notif => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        timestamp: notif.created_at,
        read: notif.is_read,
      }));
      setSidebarNotifications(formatted);
      setUnreadNotificationsCount(formatted.filter(n => !n.read).length);
    }
    setLoadingNotifications(false);
  }, [dataNotifications]);

  // Calculate unread messages count
  useEffect(() => {
    if (!allMessages) return;
    const unreadCount = allMessages.filter((msg: AppMessage) => !msg.read_at).length;
    setUnreadMessagesCount(unreadCount);
  }, [allMessages]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const getRoleBadge = (role: UserRole): string => {
    const badges = {
      superadmin: 'Super Admin',
      school_admin: 'School Admin',
      teacher: 'Teacher',
      parent: 'Parent',
      student: 'Student',
    };
    return badges[role] || role;
  };

  const getRoleColor = (role: UserRole): string => {
    const colors = {
      superadmin: 'bg-red-500 text-white',
      school_admin: 'bg-blue-500 text-white',
      teacher: 'bg-emerald-500 text-white',
      parent: 'bg-purple-500 text-white',
      student: 'bg-yellow-400 text-black',
    };
    return colors[role] || 'bg-gray-400 text-white';
  };

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

  const topUnreadMessages = useMemo(() => {
    if (!allMessages) return [];
    return allMessages
      .filter((msg: AppMessage) => !msg.read_at)
      .slice(0, 5)
      .map(msg => ({
        id: msg.id,
        subject: msg.subject || 'No subject',
        sent_at: msg.sent_at,
        read_at: msg.read_at,
        sender: msg.sender?.full_name || 'Unknown',
        priority: (msg.priority as 'high' | 'medium' | 'low') || 'normal',
      }));
  }, [allMessages]);

  const unreadNotifications = useMemo(() => {
    return sidebarNotifications.filter((n) => !n.read).slice(0, 5);
  }, [sidebarNotifications]);

  const handleSignOut = async () => {
    try {
      await authSignOut();
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Still redirect to login even if sign out fails
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  // Show loading state while auth/data is loading
  if (!userProfile || dataLoading) {
    return (
      <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl border-r border-white/10`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg bg-emerald-600">T</div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-white">Tuitora</h1>
                {userProfile.school?.name && (
                  <p className="text-xs text-gray-300 truncate max-w-48">{userProfile.school.name}</p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      {!isCollapsed && (
        <div className="border-b border-white/10 bg-white/5">
          <div className="grid grid-cols-2 gap-0">
            {[
              { key: 'navigation' as const, label: 'Menu', icon: '📋' },
              { key: 'actions' as const, label: 'Actions', icon: '⚡', count: filteredActions.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-center px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'text-white border-b-2 border-emerald-500 bg-white/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count && tab.count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                    activeTab === tab.key ? 'text-black bg-white' : 'bg-white/20 text-white'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-0">
            {[
              { key: 'messages' as const, label: 'Messages', icon: '💬', count: unreadMessagesCount },
              { key: 'notifications' as const, label: 'Alerts', icon: '🔔', count: unreadNotificationsCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-center px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'text-white border-b-2 border-emerald-500 bg-white/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count && tab.count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                    activeTab === tab.key ? 'text-black bg-white' : 'bg-white/20 text-white'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {(activeTab === 'navigation' || isCollapsed) && (
          <nav className="p-4">
            <ul className="space-y-2">
              {filteredItems.map((item) => {
                const isActive = window.location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex items-center p-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                        isActive ? 'text-white border border-white/20 bg-emerald-500' : 'hover:bg-white/5 hover:translate-x-1 text-gray-200'
                      }`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-gray-900"></div>}
                      <span className={`text-xl transition-transform duration-200 ${isCollapsed ? 'mx-auto' : 'mr-4'} ${!isActive ? 'group-hover:scale-110' : ''}`}>{item.icon}</span>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 font-medium">{item.name}</span>
                          {item.badge !== undefined && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-white text-black' : 'text-white bg-emerald-500'}`}>
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {activeTab === 'actions' && !isCollapsed && (
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
                        <div className="text-xs opacity-90 mt-1">{action.description}</div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🚫</div>
                  <p className="text-sm text-gray-300">No actions available for your role</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && !isCollapsed && (
          <div className="p-4">
            <div className="space-y-3">
              {topUnreadMessages.length > 0 ? (
                topUnreadMessages.map((message) => (
                  <div
                    key={message.id}
                    className="p-3 rounded-xl bg-white/10 border border-white/20 transition-all duration-200 hover:bg-white/15 cursor-pointer"
                    onClick={() => window.location.href = '/messages'}
                    aria-label={`Message: ${message.subject}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm text-white line-clamp-2 pr-2">{message.subject}</h3>
                      {message.priority && (
                        <span className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${
                          message.priority === 'high' ? 'bg-red-500 text-white' :
                          message.priority === 'medium' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                        }`}>
                          {message.priority}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span>{message.sender || 'Unknown'}</span>
                      <span>{formatTimeAgo(message.sent_at)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📬</div>
                  <p className="text-sm text-gray-300">No new messages</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && !isCollapsed && (
          <div className="p-4">
            <div className="space-y-3">
              {unreadNotifications.length > 0 ? (
                unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 rounded-xl bg-white/10 border border-white/20 transition-all duration-200 hover:bg-white/15 cursor-pointer"
                    onClick={async () => {
                      if (notification.read) return;
                      // Mark as read when clicked
                      await supabase
                        .from('notifications')
                        .update({ is_read: true, updated_at: new Date().toISOString() })
                        .eq('id', notification.id);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        notification.type === 'success' ? 'bg-emerald-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' :
                        notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 text-white">{notification.title}</h3>
                        <p className="text-xs text-gray-300 mb-2">{notification.message}</p>
                        <span className="text-xs text-gray-400">{formatTimeAgo(notification.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-sm text-gray-300">No new notifications</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Info Footer */}
      <div className="p-4 border-t border-white/10 backdrop-blur-sm bg-white/5">
        {isCollapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-900 font-medium text-sm shadow-lg bg-gray-100">
              {userProfile.full_name?.charAt(0) || userProfile.email?.charAt(0) || '?'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-900 font-medium shadow-lg flex-shrink-0 bg-gray-100">
                {userProfile.full_name?.charAt(0) || userProfile.email?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userProfile.full_name || userProfile.email || 'Unknown User'}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userProfile.role)}`}>
                    {getRoleBadge(userProfile.role)}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
              <div className="text-center">
                <div className="text-sm font-semibold text-emerald-400">
                  {unreadMessagesCount}
                </div>
                <div className="text-xs text-gray-300">Unread</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-blue-400">
                  {allMessages ? allMessages.length : 0}
                </div>
                <div className="text-xs text-gray-300">Messages</div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-400 pt-2 border-t border-white/10">
              {new Date().toLocaleDateString()}
            </div>
            <div className="pt-3">
              <button
                onClick={handleSignOut}
                className="w-full text-sm py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}