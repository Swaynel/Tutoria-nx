import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'

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

// ----------------- DataContext Types -----------------
export interface DataContextType {
  payments: Payment[]
  loading: boolean
  error: string | null
  students: Student[]
  attendance?: Attendance[]
  messages?: Message[]
  addPayment?: (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updatePayment?: (id: string, payment: Partial<Payment>) => Promise<void>
  deletePayment?: (id: string) => Promise<void>
  refreshData: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
  school_id?: string // optional for multi-tenant
}

// ----------------- Mock Data (Fallback) -----------------
const mockPayments: Payment[] = [
  { id: '1', studentId: 'STU001', amount: 5000, description: 'Math Tuition', paidAt: '2024-01-15T10:00:00Z' },
  { id: '2', studentId: 'STU002', amount: 3000, description: 'Physics Tuition', paidAt: null },
]

const mockStudents: Student[] = [
  { id: 'STU001', name: 'John Doe', email: 'john.doe@example.com', grade: '10' },
  { id: 'STU002', name: 'Jane Smith', email: 'jane.smith@example.com', grade: '11' },
]

const mockAttendance: Attendance[] = [
  { id: '1', studentId: 'STU001', date: new Date().toISOString().split('T')[0], status: 'present' },
  { id: '2', studentId: 'STU002', date: new Date().toISOString().split('T')[0], status: 'absent' },
]

const mockMessages: Message[] = [
  { id: '1', subject: 'Assignment Reminder', content: 'Submit your assignment.', sent_at: '2024-01-22T09:00:00Z', read_at: null, recipientId: 'STU001', senderId: 'TEACHER001' },
]

// ----------------- Provider -----------------
export function DataProvider({ children, school_id }: DataProviderProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // ----------------- Fetch Data -----------------
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔎 Fetching data with school_id:", school_id)

      // Students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', school_id || '')
      setStudents(studentsData || mockStudents)
      if (studentsError) console.warn('⚠️ Students fetch error, using mock', studentsError)

      // Payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('school_id', school_id || '')
      setPayments(paymentsData || mockPayments)
      if (paymentsError) console.warn('⚠️ Payments fetch error, using mock', paymentsError)

      // Attendance
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('school_id', school_id || '')
      setAttendance(attendanceData || mockAttendance)
      if (attendanceError) console.warn('⚠️ Attendance fetch error, using mock', attendanceError)

      // Messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('school_id', school_id || '')
      setMessages(messagesData || mockMessages)
      if (messagesError) console.warn('⚠️ Messages fetch error, using mock', messagesError)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStudents(mockStudents)
      setPayments(mockPayments)
      setAttendance(mockAttendance)
      setMessages(mockMessages)
    } finally {
      setLoading(false)
    }
  }, [school_id])
useEffect(() => {
  console.log("✅ DataProvider mounted with school_id:", school_id)
  fetchData()
}, [fetchData, school_id])
  // ----------------- Payments CRUD -----------------
  const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPayment = { ...payment, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), school_id }
    console.log("➕ Adding payment with school_id:", school_id, newPayment)
    const { data, error } = await supabase.from('payments').insert([newPayment]).select()
    if (error) {
      setError(error.message)
      throw error
    }
    setPayments((prev) => [...prev, ...(data || [])])
  }

  const updatePayment = async (id: string, paymentUpdate: Partial<Payment>) => {
    console.log("✏️ Updating payment with id:", id, "school_id:", school_id)
    const { data, error } = await supabase.from('payments').update(paymentUpdate).eq('id', id).select()
    if (error) {
      setError(error.message)
      throw error
    }
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...(data?.[0] || {}) } : p)))
  }

  const deletePayment = async (id: string) => {
    console.log("🗑️ Deleting payment with id:", id, "school_id:", school_id)
    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (error) {
      setError(error.message)
      throw error
    }
    setPayments((prev) => prev.filter((p) => p.id !== id))
  }

  const refreshData = async () => {
    console.log("🔄 Refreshing data with school_id:", school_id)
    setLoading(true)
    await fetchData()
  }

  const value: DataContextType = {
    payments,
    students,
    attendance,
    messages,
    loading,
    error,
    addPayment,
    updatePayment,
    deletePayment,
    refreshData,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// ----------------- Hook -----------------
export function useDataContext(): DataContextType {
  const context = useContext(DataContext)
  if (!context) throw new Error('useDataContext must be used within a DataProvider')
  return context
}
