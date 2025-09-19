import { useState, useMemo } from 'react'

// Mock components for demo
const Link = ({ href, children, className, ...props }: { 
  href: string; 
  children: React.ReactNode; 
  className?: string; 
  [key: string]: any 
}) => (
  <a href={href} className={className} {...props}>{children}</a>
)

// Mock router and auth context
const useRouter = () => ({ pathname: '/dashboard' })
const useAuthContext = () => ({ 
  user: { 
    full_name: 'John Doe', 
    email: 'john@school.edu', 
    role: 'school_admin' as const,
    school_name: 'Greenwood Academy'
  } 
})

// Types
type UserRole = 'superadmin' | 'school_admin' | 'teacher' | 'parent' | 'student'

interface NavigationItem {
  name: string
  href: string
  icon: string
  roles: UserRole[]
  badge?: number
}

interface User {
  full_name?: string
  email?: string
  role: UserRole
  school_name?: string
}

const navigationItems: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: '📊', 
    roles: ['superadmin', 'school_admin', 'teacher', 'parent', 'student'] 
  },
  { 
    name: 'Students', 
    href: '/students', 
    icon: '👨‍🎓', 
    roles: ['superadmin', 'school_admin', 'teacher'],
    badge: 342
  },
  { 
    name: 'Teachers', 
    href: '/teachers', 
    icon: '👩‍🏫', 
    roles: ['superadmin', 'school_admin'],
    badge: 28
  },
  { 
    name: 'Parents', 
    href: '/parents', 
    icon: '👨‍👩‍👧', 
    roles: ['superadmin', 'school_admin', 'teacher'],
    badge: 298
  },
  { 
    name: 'Payments', 
    href: '/payments', 
    icon: '💰', 
    roles: ['superadmin', 'school_admin', 'teacher'] 
  },
  { 
    name: 'Attendance', 
    href: '/attendance', 
    icon: '📝', 
    roles: ['superadmin', 'school_admin', 'teacher'] 
  },
  { 
    name: 'Messages', 
    href: '/messages', 
    icon: '💬', 
    roles: ['superadmin', 'school_admin', 'teacher', 'parent'],
    badge: 12
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: '📈', 
    roles: ['superadmin', 'school_admin'] 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: '⚙️', 
    roles: ['superadmin', 'school_admin'] 
  },
]

export default function LeftSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()
  const { user } = useAuthContext()

  // Memoize filtered navigation items
  const filteredItems = useMemo(() => 
    navigationItems.filter(item => 
      user && item.roles.includes(user.role)
    ), [user]
  )

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

  const getRoleColor = (role: UserRole): string => {
    const colors = {
      superadmin: 'text-red-400',
      school_admin: 'text-blue-400', 
      teacher: 'text-emerald-400',
      parent: 'text-purple-400',
      student: 'text-yellow-400'
    }
    return colors[role] || 'text-gray-400'
  }

  const getRoleBadge = (role: UserRole): string => {
    const badges = {
      superadmin: 'Super Admin',
      school_admin: 'School Admin',
      teacher: 'Teacher',
      parent: 'Parent', 
      student: 'Student'
    }
    return badges[role] || role
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-72'} bg-gradient-to-b from-indigo-900 to-indigo-800 text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl border-r border-indigo-700/50`}>
      {/* Header */}
      <div className="p-4 border-b border-indigo-700/50 bg-indigo-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
              T
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                  Tuitora
                </h1>
                {user?.school_name && (
                  <p className="text-xs text-indigo-300 truncate max-w-48">
                    {user.school_name}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-indigo-700/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const isActive = router.pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center p-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                    isActive 
                      ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 text-emerald-300' 
                      : 'hover:bg-white/5 hover:translate-x-1'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-r-full"></div>
                  )}
                  
                  <span className={`text-xl transition-transform duration-200 ${isCollapsed ? 'mx-auto' : 'mr-4'} ${!isActive ? 'group-hover:scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 font-medium">{item.name}</span>
                      {item.badge && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isActive 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-indigo-700 text-indigo-200'
                        }`}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-indigo-700/50 bg-indigo-800/30 backdrop-blur-sm">
        {isCollapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-lg">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-medium shadow-lg flex-shrink-0">
                {user?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.full_name || user?.email || 'Unknown User'}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user?.role || 'student')} bg-white/10`}>
                    {getRoleBadge(user?.role || 'student')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats for non-collapsed view */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-indigo-700/30">
              <div className="text-center">
                <div className="text-sm font-semibold text-emerald-400">124</div>
                <div className="text-xs text-indigo-300">Active</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-blue-400">8</div>
                <div className="text-xs text-indigo-300">Pending</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}