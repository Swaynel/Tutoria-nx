export type UserRole = 'superadmin' | 'school_admin' | 'teacher' | 'parent' | 'student'

export interface AppUser {
  id: string
  email: string
  role: UserRole
  school_id?: string
  current_school_id?: string
  full_name?: string
  phone?: string
  created_at: string
  updated_at?: string
}

export interface School {
  id: string
  name: string
  slug: string
  logo_url?: string
  address?: string
  phone?: string
  email?: string
  created_at: string
  updated_at?: string
}

export interface Student {
  id: string
  school_id: string
  name: string
  grade: string
  date_of_birth?: string
  parent_id?: string
  created_at: string
  updated_at?: string
}

export interface AttendanceRecord {
  id: string
  school_id: string
  student_id: string
  date: string
  status: 'present' | 'absent' | 'late'
  marked_by: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface Payment {
  id: string
  school_id: string
  student_id: string
  amount: number
  description: string
  payment_method?: string
  reference_id?: string
  paid_at: string
  created_at: string
  updated_at?: string
}

export interface Message {
  id: string
  school_id: string
  sender_id: string
  recipient_id: string
  subject: string
  content: string
  message_type?: 'sms' | 'whatsapp' | 'email' | 'platform'
  status?: 'sent' | 'delivered' | 'read' | 'failed'
  sent_at: string
  read_at?: string
  created_at: string
  updated_at?: string
}

export interface ParentStudentRelationship {
  id: string
  parent_user_id: string
  student_id: string
  relationship_type: string
  created_at: string
  updated_at?: string
}

/**
 * Generic API response type
 * @template T Type of the `data` field
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Parameters for paginated queries
 */
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Paginated API response
 * @template T Type of items in the data array
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
