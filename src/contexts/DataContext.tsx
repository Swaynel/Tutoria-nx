import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from './AuthContext'

// ----------------- Interfaces -----------------
export interface Payment {
  id: string
  studentId: string
  amount: number
  description: string
  paidAt: string | null
  school_id?: string
  createdAt?: string
  updatedAt?: string
}

export interface Student {
  id: string
  name: string
  email: string
  phone?: string
  grade?: string
  school_id?: string
  createdAt?: string
  updatedAt?: string
}

export interface Attendance {
  id: string
  studentId: string
  date: string
  status: 'present' | 'absent' | 'late'
  school_id?: string
  createdAt?: string
  updatedAt?: string
}

export interface Message {
  id: string
  subject: string
  content: string
  sent_at: string
  read_at?: string | null
  recipientId?: string
  senderId?: string
  school_id?: string
  createdAt?: string
  updatedAt?: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'superadmin' | 'school_admin' | 'teacher' | 'parent' | 'student'
  school_id: string | null
  phone?: string
  avatar_url?: string
  is_active: boolean
  school?: {
    id: string
    name: string
    slug: string
    is_active: boolean
  }
}

// ----------------- DataContext Types -----------------
export interface DataContextType {
  // User profile
  userProfile: UserProfile | null
  school_id: string | null
  
  // Data arrays
  payments: Payment[]
  students: Student[]
  attendance?: Attendance[]
  messages?: Message[]
  
  // Loading states
  loading: boolean
  profileLoading: boolean
  
  // Error states
  error: string | null
  profileError: string | null
  
  // Actions
  addPayment?: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updatePayment?: (id: string, payment: Partial<Payment>) => Promise<void>
  deletePayment?: (id: string) => Promise<void>
  refreshData: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

// ----------------- Mock Data (Enhanced Fallback) -----------------
const mockPayments: Payment[] = [
  { id: '1', studentId: 'STU001', amount: 5000, description: 'Math Tuition - January', paidAt: '2024-01-15T10:00:00Z' },
  { id: '2', studentId: 'STU002', amount: 3000, description: 'Physics Tuition - January', paidAt: null },
  { id: '3', studentId: 'STU001', amount: 2500, description: 'Lab Fee', paidAt: '2024-01-20T14:30:00Z' },
]

const mockStudents: Student[] = [
  { id: 'STU001', name: 'John Doe', email: 'john.doe@example.com', grade: '10th Grade', phone: '(555) 123-4567' },
  { id: 'STU002', name: 'Jane Smith', email: 'jane.smith@example.com', grade: '11th Grade', phone: '(555) 987-6543' },
  { id: 'STU003', name: 'Bob Johnson', email: 'bob.johnson@example.com', grade: '9th Grade', phone: '(555) 456-7890' },
]

const mockAttendance: Attendance[] = [
  { id: '1', studentId: 'STU001', date: new Date().toISOString().split('T')[0], status: 'present' },
  { id: '2', studentId: 'STU002', date: new Date().toISOString().split('T')[0], status: 'absent' },
  { id: '3', studentId: 'STU003', date: new Date().toISOString().split('T')[0], status: 'late' },
]

const mockMessages: Message[] = [
  { 
    id: '1', 
    subject: 'Assignment Reminder', 
    content: 'Please remember to submit your math assignment by Friday.', 
    sent_at: '2024-01-22T09:00:00Z', 
    read_at: null, 
    recipientId: 'STU001', 
    senderId: 'TEACHER001' 
  },
  { 
    id: '2', 
    subject: 'Parent-Teacher Meeting', 
    content: 'Scheduled for next Tuesday at 3:00 PM.', 
    sent_at: '2024-01-23T11:00:00Z', 
    read_at: null, 
    recipientId: 'PARENT001', 
    senderId: 'TEACHER001' 
  },
]

// ----------------- Provider -----------------
export function DataProvider({ children }: DataProviderProps) {
  const { user } = useAuthContext()
  
  // Profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  
  // Data states
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Derived state
  const school_id = userProfile?.school_id || null

  // ----------------- Fetch Profile -----------------
  const fetchProfile = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      console.log('👤 No user ID available for profile fetch')
      setUserProfile(null)
      return
    }

    setProfileLoading(true)
    setProfileError(null)
    
    try {
      console.log('👤 Fetching profile for user:', user.id)
      
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select(`
          *,
          school:school_id (
            id,
            name,
            slug,
            is_active
          )
        `)
        .eq('id', user.id)
        .maybeSingle()

      if (profileFetchError) {
        console.warn('👤 Profile fetch error:', profileFetchError)
        setProfileError(profileFetchError.message)
        
        // If profile doesn't exist, try to create a basic one
        if (profileFetchError.code === 'PGRST116') {
          console.log('👤 Profile not found, creating basic profile...')
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || 'unknown@example.com',
              full_name: user.user_metadata?.full_name || 'User',
              role: 'teacher',
              is_active: true
            })
            
          if (insertError) {
            console.error('❌ Failed to create profile:', insertError)
            setProfileError('Failed to create user profile')
          } else {
            console.log('✅ Basic profile created, refetching...')
            // Retry fetching after creation
            setTimeout(() => fetchProfile(), 1000)
          }
        }
        return
      }

      if (profileData) {
        console.log('✅ Profile loaded:', {
          id: profileData.id,
          role: profileData.role,
          school_id: profileData.school_id,
          school_name: profileData.school?.name || 'No school'
        })
        setUserProfile(profileData as UserProfile)
        setProfileError(null)
      } else {
        console.log('⚠️ No profile data returned')
        setProfileError('Profile not found')
      }
    } catch (err) {
      console.error('❌ Profile fetch error:', err)
      setProfileError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setProfileLoading(false)
    }
  }, [user])

  // ----------------- Fetch Data -----------------
  const fetchData = useCallback(async (): Promise<void> => {
    console.log("🔎 Fetching data with school_id:", school_id)

    if (!school_id) {
      console.log('⚠️ No school_id available, using mock data')
      setStudents(mockStudents)
      setPayments(mockPayments)
      setAttendance(mockAttendance)
      setMessages(mockMessages)
      setError('Using demo data - user has no school assigned')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [studentsResult, paymentsResult, attendanceResult, messagesResult] = await Promise.allSettled([
        supabase.from('students').select('*').eq('school_id', school_id),
        supabase.from('payments').select('*').eq('school_id', school_id),
        supabase.from('attendance').select('*').eq('school_id', school_id),
        supabase.from('messages').select('*').eq('school_id', school_id)
      ])

      // Handle students
      if (studentsResult.status === 'fulfilled' && !studentsResult.value.error) {
        setStudents(studentsResult.value.data || [])
        console.log('✅ Students loaded:', studentsResult.value.data?.length || 0)
      } else {
        console.warn('⚠️ Students fetch error, using mock:', 
          studentsResult.status === 'fulfilled' ? studentsResult.value.error : studentsResult.reason)
        setStudents(mockStudents)
      }

      // Handle payments
      if (paymentsResult.status === 'fulfilled' && !paymentsResult.value.error) {
        setPayments(paymentsResult.value.data || [])
        console.log('✅ Payments loaded:', paymentsResult.value.data?.length || 0)
      } else {
        console.warn('⚠️ Payments fetch error, using mock:', 
          paymentsResult.status === 'fulfilled' ? paymentsResult.value.error : paymentsResult.reason)
        setPayments(mockPayments)
      }

      // Handle attendance
      if (attendanceResult.status === 'fulfilled' && !attendanceResult.value.error) {
        setAttendance(attendanceResult.value.data || [])
        console.log('✅ Attendance loaded:', attendanceResult.value.data?.length || 0)
      } else {
        console.warn('⚠️ Attendance fetch error, using mock:', 
          attendanceResult.status === 'fulfilled' ? attendanceResult.value.error : attendanceResult.reason)
        setAttendance(mockAttendance)
      }

      // Handle messages
      if (messagesResult.status === 'fulfilled' && !messagesResult.value.error) {
        setMessages(messagesResult.value.data || [])
        console.log('✅ Messages loaded:', messagesResult.value.data?.length || 0)
      } else {
        console.warn('⚠️ Messages fetch error, using mock:', 
          messagesResult.status === 'fulfilled' ? messagesResult.value.error : messagesResult.reason)
        setMessages(mockMessages)
      }

    } catch (err) {
      console.error('❌ Data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      
      // Fallback to mock data
      setStudents(mockStudents)
      setPayments(mockPayments)
      setAttendance(mockAttendance)
      setMessages(mockMessages)
    } finally {
      setLoading(false)
    }
  }, [school_id])

  // ----------------- Payments CRUD -----------------
  const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!school_id) {
      throw new Error('No school assigned to user')
    }

    const newPayment = { 
      ...payment, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString(), 
      school_id 
    }
    
    console.log("➕ Adding payment with school_id:", school_id, newPayment)
    const { data, error: insertError } = await supabase.from('payments').insert([newPayment]).select()
    
    if (insertError) {
      setError(insertError.message)
      throw insertError
    }
    
    setPayments((prev) => [...prev, ...(data || [])])
  }

  const updatePayment = async (id: string, paymentUpdate: Partial<Payment>) => {
    console.log("✏️ Updating payment with id:", id, "school_id:", school_id)
    const { data, error: updateError } = await supabase
      .from('payments
