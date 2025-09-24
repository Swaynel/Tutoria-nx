// src/contexts/DataContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthContext } from './AuthContext'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  AppUser,
  Payment,
  Student,
  AttendanceRecord,
  Message,
  UserRole,
} from '../types'

// ----------------- DataContext Types -----------------
export interface DataContextType {
  userProfile: AppUser | null
  school_id: string | null
  payments: Payment[]
  students: Student[]
  attendance: AttendanceRecord[]
  messages: Message[]
  loading: boolean
  profileLoading: boolean
  error: string | null
  profileError: string | null
  addPayment: (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'school_id'>) => Promise<void>
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<void>
  deletePayment: (id: string) => Promise<void>
  addStudent: (student: Omit<Student, 'id' | 'created_at' | 'school_id'>) => Promise<void>
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
  refreshAllData: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

// ----------------- Mock Data -----------------
const mockPayments: Payment[] = [
  { id: '1', school_id: 'mock-school', student_id: 'STU001', amount: 5000, description: 'Math Tuition - January', paid_at: '2024-01-15T10:00:00Z', created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z' },
  { id: '2', school_id: 'mock-school', student_id: 'STU002', amount: 3000, description: 'Physics Tuition - January', paid_at: '2024-01-20T14:30:00Z', created_at: '2024-01-10T09:00:00Z', updated_at: '2024-01-20T14:30:00Z' },
]
const mockStudents: Student[] = [
  {
    id: 'STU001', school_id: 'mock-school', name: 'John Doe', grade: '10th Grade', date_of_birth: '2008-03-15', created_at: '2024-01-01T00:00:00Z',
    status: ''
  },
  {
    id: 'STU002', school_id: 'mock-school', name: 'Jane Smith', grade: '11th Grade', date_of_birth: '2007-07-22', created_at: '2024-01-01T00:00:00Z',
    status: ''
  },
]
const mockAttendance: AttendanceRecord[] = [
  { id: '1', school_id: 'mock-school', student_id: 'STU001', date: new Date().toISOString().split('T')[0], status: 'present', marked_by: 'TEACHER001', created_at: new Date().toISOString() },
  { id: '2', school_id: 'mock-school', student_id: 'STU002', date: new Date().toISOString().split('T')[0], status: 'absent', marked_by: 'TEACHER001', created_at: new Date().toISOString() },
]
const mockMessages: Message[] = [
  { id: '1', school_id: 'mock-school', sender_id: 'TEACHER001', recipient_id: 'STU001', subject: 'Assignment Reminder', content: 'Please remember to submit your math assignment by Friday.', sent_at: '2024-01-22T09:00:00Z', created_at: '2024-01-22T09:00:00Z' },
  { id: '2', school_id: 'mock-school', sender_id: 'TEACHER001', recipient_id: 'PARENT001', subject: 'Parent-Teacher Meeting', content: 'Scheduled for next Tuesday at 3:00 PM.', sent_at: '2024-01-23T11:00:00Z', created_at: '2024-01-23T11:00:00Z' },
]

// ----------------- Provider Component -----------------
export function DataProvider({ children }: DataProviderProps) {
  const { user } = useAuthContext()

  // Profile state
  const [userProfile, setUserProfile] = useState<AppUser | null>(null)
  const [profileLoading, setProfileLoading] = useState<boolean>(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  // School-related data
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const school_id = userProfile?.school_id || null

  // --- Profile Management ---
  const fetchProfile = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setUserProfile(null)
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)
    setProfileError(null)

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('No profile found, creating one...')
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            role: 'teacher' as UserRole,
          })
          if (insertError) throw insertError
          await fetchProfile()
          return
        }
        throw profileError
      }

      if (profileData) {
        setUserProfile(profileData as AppUser)
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching profile:', err)
        setProfileError(err.message)
      } else {
        console.error('Error fetching profile:', err)
        setProfileError('An unknown error occurred while fetching your profile.')
      }
    } finally {
      setProfileLoading(false)
    }
  }, [user])

  // --- Fetch all school data ---
  const fetchAllSchoolData = useCallback(async (): Promise<void> => {
    if (!school_id) {
      console.warn('User has no school assigned. Using mock data.')
      setStudents(mockStudents)
      setPayments(mockPayments)
      setAttendance(mockAttendance)
      setMessages(mockMessages)
      setError('DEMO MODE: Please ask an admin to assign you to a school.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [studentsData, paymentsData, attendanceData, messagesData] = await Promise.all([
        supabase.from('students').select('*').eq('school_id', school_id),
        supabase.from('payments').select('*').eq('school_id', school_id),
        supabase.from('attendance').select('*').eq('school_id', school_id),
        supabase.from('messages').select('*').eq('school_id', school_id),
      ])

      if (studentsData.error) throw studentsData.error
      if (paymentsData.error) throw paymentsData.error
      if (attendanceData.error) throw attendanceData.error
      if (messagesData.error) throw messagesData.error

      setStudents(studentsData.data as Student[] || [])
      setPayments(paymentsData.data as Payment[] || [])
      setAttendance(attendanceData.data as AttendanceRecord[] || [])
      setMessages(messagesData.data as Message[] || [])
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Failed to fetch school data:', err)
        setError(err.message)
      } else {
        console.error('Failed to fetch school data:', err)
        setError('An unknown error occurred while fetching data.')
      }
    } finally {
      setLoading(false)
    }
  }, [school_id])

  // --- Individual CRUD operations ---
  const addPayment = useCallback(async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'school_id'>) => {
    if (!school_id) throw new Error('Cannot add payment: User has no school ID.')
    const { data, error } = await supabase
      .from('payments')
      .insert({ ...payment, school_id } as unknown as Record<string, unknown>)
      .select()
      .single()
    if (error) throw error
    if (data) setPayments(prev => [...prev, data as Payment])
  }, [school_id])

  const updatePayment = useCallback(async (id: string, payment: Partial<Payment>) => {
    const { error } = await supabase
      .from('payments')
      .update({ ...payment, updated_at: new Date().toISOString() } as unknown as Record<string, unknown>)
      .eq('id', id)
    if (error) throw error
  }, [])

  const deletePayment = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
    if (error) throw error
  }, [])

  const addStudent = useCallback(async (student: Omit<Student, 'id' | 'created_at' | 'school_id'>) => {
    if (!school_id) throw new Error('Cannot add student: User has no school ID.')
    const { error } = await supabase
      .from('students')
      .insert({ ...student, school_id } as unknown as Record<string, unknown>)
      .select()
      .single()
    if (error) throw error
    // The real-time subscription will handle updating the state
  }, [school_id])

  const updateStudent = useCallback(async (id: string, student: Partial<Student>) => {
    const { error } = await supabase
      .from('students')
      .update({ ...student, updated_at: new Date().toISOString() } as unknown as Record<string, unknown>)
      .eq('id', id)
    if (error) throw error
  }, [])

  const deleteStudent = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)
    if (error) throw error
  }, [])

  // --- Effects ---
  useEffect(() => {
    if (user) fetchProfile()
    else {
      setUserProfile(null)
      setStudents([])
      setPayments([])
      setAttendance([])
      setMessages([])
    }
  }, [user, fetchProfile])

  useEffect(() => {
    if (school_id) fetchAllSchoolData()
  }, [school_id, fetchAllSchoolData])

  // --- Real-time subscriptions ---
  useEffect(() => {
    if (!school_id) return

    const setupSubscription = <T extends { id: string }>(
      table: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>,
    ) => {
      return supabase
        .channel(`public:${table}:${school_id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table, filter: `school_id=eq.${school_id}` },
          payload => setter(prev => [...prev, payload.new as T]),
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table, filter: `school_id=eq.${school_id}` },
          payload => setter(prev => prev.map(item => (item.id === payload.new.id ? payload.new as T : item))),
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table, filter: `school_id=eq.${school_id}` },
          payload => setter(prev => prev.filter(item => item.id !== payload.old.id)),
        )
        .subscribe()
    }

    const subscriptions: RealtimeChannel[] = [
      setupSubscription<Student>('students', setStudents),
      setupSubscription<Payment>('payments', setPayments),
      setupSubscription<AttendanceRecord>('attendance', setAttendance),
      setupSubscription<Message>('messages', setMessages),
    ]

    return () => {
      subscriptions.forEach((sub: RealtimeChannel) => supabase.removeChannel(sub))
    }
  }, [school_id])

  // --- Context Value ---
  const value: DataContextType = {
    userProfile,
    school_id,
    payments,
    students,
    attendance,
    messages,
    loading,
    profileLoading,
    error,
    profileError,
    addPayment,
    updatePayment,
    deletePayment,
    addStudent,
    updateStudent,
    deleteStudent,
    refreshAllData: fetchAllSchoolData,
    refreshProfile: fetchProfile,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// ----------------- Hook -----------------
export function useDataContext(): DataContextType {
  const context = useContext(DataContext)
  if (!context) throw new Error('useDataContext must be used within a DataProvider')
  return context
}

// Export types for use in other files
export type { Student, Payment, AttendanceRecord, Message }