// src/lib/africastalking.ts
import AfricasTalking from 'africastalking'
import { supabase } from './supabase'

// ========================
// Config
// ========================
export const AT_CONFIG = {
  USSD_SERVICE_CODE: '*384*38164#',
  SMS_SHORT_CODE: '15680',
  SMS_SENDER_ID: 'TUITORA',
}

// ========================
// Types
// ========================
export interface AfricasTalkingSMSResponse {
  SMSMessageData: {
    Recipients: Array<{
      number: string
      status: string
      messageId: string
      cost: string
    }>
  }
}

export interface AfricasTalkingSMS {
  send(options: {
    to: string[]
    message: string
    from?: string
    enqueue?: boolean
  }): Promise<AfricasTalkingSMSResponse>
}

interface AfricasTalkingInstance {
  SMS: AfricasTalkingSMS
}

// ========================
// SMS Result
// ========================
export interface SMSResult {
  recipient: string
  success: boolean
  messageId?: string
  cost?: string
  error?: string
}

// ========================
// WhatsApp Result
// ========================
export interface WhatsAppResult {
  recipient: string
  success: boolean
  messageId?: string
  error?: string
}

// ========================
// USSD Types
// ========================
export interface USSDSession {
  sessionId: string
  phoneNumber: string
  serviceCode: string
  text: string
}

export type USSDOption = '1' | '2' | '3' | '0' | '00'

export interface USSDResponse {
  sessionId: string
  phoneNumber: string
  text: string
  status: 'pending' | 'completed'
}

// ========================
// Utilities
// ========================
export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')

  if (digits.startsWith('0') && digits.length === 10) return '+254' + digits.substring(1)
  if (digits.startsWith('254') && digits.length === 12) return '+' + digits
  if (digits.startsWith('7') && digits.length === 9) return '+254' + digits
  return phone
}

// ========================
// SDK Initialization
// ========================
let africastalking: AfricasTalkingInstance | null = null

if (typeof window === 'undefined') {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY
  const username = process.env.AFRICAS_TALKING_USERNAME

  if (apiKey && username && apiKey !== 'placeholder' && username !== 'placeholder') {
    // Properly type the AfricasTalking initialization
    africastalking = AfricasTalking({ 
      apiKey, 
      username 
    }) as unknown as AfricasTalkingInstance
    console.log("Africa's Talking SDK initialized successfully")
  } else {
    console.warn("Africa's Talking API credentials missing or invalid - SMS/USSD disabled")
  }
}

// ========================
// SMS Functions
// ========================
export const sendSMS = async (to: string[], message: string): Promise<SMSResult[]> => {
  if (typeof window !== 'undefined' || !africastalking) {
    return to.map((recipient) => ({ recipient, success: false, error: 'SMS must be sent from server-side' }))
  }

  try {
    const result = await africastalking.SMS.send({
      to,
      message: `${message}\n\n- ${AT_CONFIG.SMS_SENDER_ID}`,
      from: AT_CONFIG.SMS_SHORT_CODE,
      enqueue: true,
    })

    return result.SMSMessageData.Recipients.map((r) => ({
      recipient: r.number,
      success: r.status === 'Success',
      messageId: r.messageId,
      cost: r.cost,
      error: r.status !== 'Success' ? r.status : undefined,
    }))
  } catch (err) {
    console.error("Africa's Talking SMS error:", err)
    return to.map((recipient) => ({ recipient, success: false, error: (err as Error).message }))
  }
}

export const sendBulkSMS = async (
  recipients: Array<{ phone: string; name?: string }>,
  message: string
): Promise<SMSResult[]> => {
  const phoneNumbers = recipients.map((r) => formatPhoneNumber(r.phone))
  const batchSize = 10
  const results: SMSResult[] = []

  for (let i = 0; i < phoneNumbers.length; i += batchSize) {
    const batch = phoneNumbers.slice(i, i + batchSize)
    const batchResults = await sendSMS(batch, message)
    results.push(...batchResults)
    if (i + batchSize < phoneNumbers.length) await new Promise((r) => setTimeout(r, 1000))
  }

  return results
}

export const sendWhatsApp = async (to: string[], message: string): Promise<WhatsAppResult[]> => {
  const smsResults = await sendSMS(to, `[WhatsApp] ${message}`)
  return smsResults.map((r) => ({ recipient: r.recipient, success: r.success, messageId: r.messageId, error: r.error }))
}

// ========================
// USSD Functions
// ========================
export const initiateUSSD = async (phoneNumber: string, serviceCode = AT_CONFIG.USSD_SERVICE_CODE): Promise<USSDSession> => {
  const sessionId = `ussd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  return {
    sessionId,
    phoneNumber: formatPhoneNumber(phoneNumber),
    serviceCode,
    text: 'Welcome to Tuitora. Select option:\n1. Check Attendance\n2. Check Fees\n3. Contact School',
  }
}

export const processUSSDResponse = async (session: USSDSession, text: string): Promise<USSDResponse> => {
  const inputs = text.split('*').filter((i) => i)
  let responseText: string

  switch (inputs[0] as USSDOption) {
    case '1':
      responseText = await getAttendanceUSSD(session.phoneNumber, inputs)
      break
    case '2':
      responseText = await getFeesUSSD(session.phoneNumber, inputs)
      break
    case '3':
      responseText = 'Contact your school admin at: 0700-000-000\nOr visit: tuitora.com'
      break
    default:
      responseText = 'Welcome to Tuitora. Select option:\n1. Check Attendance\n2. Check Fees\n3. Contact School'
      break
  }

  await supabase.from('ussd_sessions').insert([{
    session_id: session.sessionId,
    phone: session.phoneNumber,
    input_text: text,
    response_text: responseText,
    status: 'pending',
    created_at: new Date().toISOString(),
  }]).match((err: unknown) => console.error('USSD log error:', err))

  return { sessionId: session.sessionId, phoneNumber: session.phoneNumber, text: responseText, status: 'pending' }
}

// ========================
// USSD DB functions based on your actual database schema
// ========================

const getAttendanceUSSD = async (phone: string, inputs: string[]): Promise<string> => {
  try {
    console.log('Fetching attendance for phone:', phone)
    
    let studentIds: string[] = []

    // Method 1: Check if phone belongs to a profile (user)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name,school_id')
      .eq('phone', phone)
      .single()

    if (profile && !profileError) {
      console.log('Profile found:', profile)

      if (profile.role === 'parent') {
        // Find students through parent_student_relationships
        const { data: relationships, error: relError } = await supabase
          .from('parent_student_relationships')
          .select(`
            student_id,
            students(id, name)
          `)
          .eq('parent_user_id', profile.id)

        if (!relError && relationships) {
          studentIds = relationships.map(r => r.student_id)
          console.log('Students found via profile parent relationships:', studentIds)
        }
      } else if (profile.role === 'student') {
        // If profile is a student, find matching student record by name/email
        const { data: student } = await supabase
          .from('students')
          .select('id, name')
          .eq('school_id', profile.school_id ?? '')
          .ilike('name', `%${profile.full_name}%`) // Fuzzy match by name
          .single()

        if (student) {
          studentIds.push(student.id)
          console.log('Student found via profile match:', student)
        }
      }
    }

    // Method 2: Check if phone belongs to a parent directly
    if (studentIds.length === 0) {
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('id, full_name')
        .eq('phone', phone)
        .single()

      if (parent && !parentError) {
        console.log('Direct parent found:', parent)

        const { data: relationships, error: relError } = await supabase
          .from('parent_student_relationships')
          .select(`
            student_id,
            students(id, name)
          `)
          .eq('parent_user_id', parent.id)

        if (!relError && relationships) {
          studentIds = relationships.map(r => r.student_id)
          console.log('Students found via direct parent relationships:', studentIds)
        }
      }
    }

    // Method 3: Check guardian phone in students table
    if (studentIds.length === 0) {
      const { data: students, error: guardianError } = await supabase
        .from('students')
        .select('id, name, guardian_name')
        .eq('guardian_phone', phone)

      if (!guardianError && students && students.length > 0) {
        studentIds = students.map(s => s.id)
        console.log('Students found via guardian phone:', students)
      }
    }

    if (studentIds.length === 0) {
      console.log('No students found for phone:', phone)
      return 'ATTENDANCE SUMMARY:\nNo student found for this number.\n0. Back\n00. Main Menu'
    }

    // Handle multiple students
    if (studentIds.length > 1 && inputs.length === 1) {
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .in('id', studentIds)

      if (studentsError) {
        console.error('Students query error:', studentsError)
        return 'ATTENDANCE SUMMARY:\nError fetching student data.\n0. Back\n00. Main Menu'
      }

      const menu = studentIds.map((id, i) => {
        const student = students?.find(s => s.id === id)
        return `${i + 1}. ${student?.name || 'Student ' + (i + 1)}`
      }).join('\n')

      return `MULTIPLE STUDENTS:\n${menu}\nSelect a number\n0. Back\n00. Main Menu`
    }

    // Select specific student if multiple
    let studentId = studentIds[0]
    if (inputs.length >= 2 && studentIds.length > 1) {
      const selection = parseInt(inputs[1], 10)
      if (!isNaN(selection) && selection >= 1 && selection <= studentIds.length) {
        studentId = studentIds[selection - 1]
      }
    }

    console.log('Fetching attendance for student ID:', studentId)

    // Get student name for display
    const { data: student } = await supabase
      .from('students')
      .select('name')
      .eq('id', studentId)
      .single()

    // Get attendance data for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('status, date')
      .eq('student_id', studentId)
      .gte('date', thirtyDaysAgo)

    if (attendanceError) {
      console.error('Attendance query error:', attendanceError)
      return 'ATTENDANCE SUMMARY:\nError fetching attendance data.\n0. Back\n00. Main Menu'
    }

    console.log('Attendance data found:', attendance?.length || 0, 'records')

    const present = attendance?.filter(a => a.status === 'present').length || 0
    const absent = attendance?.filter(a => a.status === 'absent').length || 0
    const late = attendance?.filter(a => a.status === 'late').length || 0
    const excused = attendance?.filter(a => a.status === 'excused').length || 0
    const total = present + absent + late + excused

    const studentName = student?.name ? ` - ${student.name}` : ''

    return `ATTENDANCE${studentName}\n(Last 30 days)\nTotal: ${total}\nPresent: ${present}\nAbsent: ${absent}\nLate: ${late}\nExcused: ${excused}\n0. Back\n00. Main Menu`

  } catch (err) {
    console.error('Attendance USSD error:', err)
    return 'ATTENDANCE SUMMARY:\nSystem error. Please try again.\n0. Back\n00. Main Menu'
  }
}

const getFeesUSSD = async (phone: string, inputs: string[]): Promise<string> => {
  try {
    console.log('Fetching fees for phone:', phone)

    let studentIds: string[] = []

    // Method 1: Check if phone belongs to a profile (user)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, full_name, school_id')
      .eq('phone', phone)
      .single()

    if (profile && !profileError) {
      console.log('Profile found:', profile)

      if (profile.role === 'parent') {
        // Find students through parent_student_relationships
        const { data: relationships, error: relError } = await supabase
          .from('parent_student_relationships')
          .select(`
            student_id,
            students(id, name)
          `)
          .eq('parent_user_id', profile.id)

        if (!relError && relationships) {
          studentIds = relationships.map(r => r.student_id)
          console.log('Students found via profile parent relationships:', studentIds)
        }
      } else if (profile.role === 'student') {
        // If profile is a student, find matching student record
        const { data: student } = await supabase
          .from('students')
          .select('id, name')
          .eq('school_id', profile.school_id)
          .ilike('name', `%${profile.full_name}%`)
          .single()

        if (student) {
          studentIds.push(student.id)
          console.log('Student found via profile match:', student)
        }
      }
    }

    // Method 2: Check if phone belongs to a parent directly
    if (studentIds.length === 0) {
      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('id, full_name')
        .eq('phone', phone)
        .single()

      if (parent && !parentError) {
        console.log('Direct parent found:', parent)

        const { data: relationships, error: relError } = await supabase
          .from('parent_student_relationships')
          .select(`
            student_id,
            students(id, name)
          `)
          .eq('parent_user_id', parent.id)

        if (!relError && relationships) {
          studentIds = relationships.map(r => r.student_id)
          console.log('Students found via direct parent relationships:', studentIds)
        }
      }
    }

    // Method 3: Check guardian phone in students table
    if (studentIds.length === 0) {
      const { data: students, error: guardianError } = await supabase
        .from('students')
        .select('id, name, guardian_name')
        .eq('guardian_phone', phone)

      if (!guardianError && students && students.length > 0) {
        studentIds = students.map(s => s.id)
        console.log('Students found via guardian phone:', students)
      }
    }

    if (studentIds.length === 0) {
      console.log('No students found for phone:', phone)
      return 'FEES SUMMARY:\nNo student found for this number.\n0. Back\n00. Main Menu'
    }

    // Handle multiple students
    if (studentIds.length > 1 && inputs.length === 1) {
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .in('id', studentIds)

      if (studentsError) {
        console.error('Students query error:', studentsError)
        return 'FEES SUMMARY:\nError fetching student data.\n0. Back\n00. Main Menu'
      }

      const menu = studentIds.map((id, i) => {
        const student = students?.find(s => s.id === id)
        return `${i + 1}. ${student?.name || 'Student ' + (i + 1)}`
      }).join('\n')

      return `MULTIPLE STUDENTS:\n${menu}\nSelect a number\n0. Back\n00. Main Menu`
    }

    // Select specific student if multiple
    let studentId = studentIds[0]
    if (inputs.length >= 2 && studentIds.length > 1) {
      const selection = parseInt(inputs[1], 10)
      if (!isNaN(selection) && selection >= 1 && selection <= studentIds.length) {
        studentId = studentIds[selection - 1]
      }
    }

    console.log('Fetching fees for student ID:', studentId)

    // Get student name for display
    const { data: student } = await supabase
      .from('students')
      .select('name')
      .eq('id', studentId)
      .single()

    // Get payment data - all payments for this student
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount, description, status, fee_type, due_date, paid_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.error('Payments query error:', paymentsError)
      return 'FEES SUMMARY:\nError fetching payment data.\n0. Back\n00. Main Menu'
    }

    console.log('Payment data found:', payments?.length || 0, 'records')

    if (!payments || payments.length === 0) {
      const studentName = student?.name ? ` - ${student.name}` : ''
      return `FEES SUMMARY${studentName}\nNo fee records found.\n0. Back\n00. Main Menu`
    }

    // Calculate totals based on payment status
    const completedPayments = payments.filter(p => p.status === 'completed')
    const pendingPayments = payments.filter(p => p.status === 'pending')
    const failedPayments = payments.filter(p => p.status === 'failed')

    const totalPaid = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const totalFailed = failedPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const grandTotal = totalPaid + totalPending + totalFailed

    const studentName = student?.name ? ` - ${student.name}` : ''

    return `FEES SUMMARY${studentName}\nTotal Fees: KES ${grandTotal.toLocaleString()}\nPaid: KES ${totalPaid.toLocaleString()}\nPending: KES ${totalPending.toLocaleString()}\nBalance: KES ${(totalPending + totalFailed).toLocaleString()}\n0. Back\n00. Main Menu`

  } catch (err) {
    console.error('Fees USSD error:', err)
    return 'FEES SUMMARY:\nSystem error. Please try again.\n0. Back\n00. Main Menu'
  }
}

// ========================
// Improved USSD session logging
// ========================
export const logUSSDSession = async (
  sessionId: string,
  phone: string,
  serviceCode: string,
  inputText: string,
  responseText: string,
  step = 1
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('ussd_sessions')
      .insert([{
        session_id: sessionId,
        phone: phone,
        service_code: serviceCode,
        input_text: inputText,
        response_text: responseText,
        status: 'active',
        step: step,
        user_data: {},
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])

    if (error) {
      console.error('USSD session log error:', error)
    } else {
      console.log('USSD session logged successfully')
    }
  } catch (err) {
    console.error('USSD session logging failed:', err)
  }
}

// ========================
// Debug helper for your actual schema
// ========================
export const debugActualSchema = async (testPhone = '+254700000000'): Promise<void> => {
  try {
    console.log('=== Testing Actual Database Schema ===')
    console.log('Test phone:', testPhone)
    
    // Test 1: Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, phone')
      .limit(3)

    console.log('✅ Profiles test:', { count: profiles?.length, error: profilesError })

    // Test 2: Check parents table
    const { data: parents, error: parentsError } = await supabase
      .from('parents')
      .select('id, full_name, phone')
      .limit(3)

    console.log('✅ Parents test:', { count: parents?.length, error: parentsError })

    // Test 3: Check students table
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name, guardian_phone')
      .limit(3)

    console.log('✅ Students test:', { count: students?.length, error: studentsError })

    // Test 4: Check relationships
    const { data: relationships, error: relError } = await supabase
      .from('parent_student_relationships')
      .select(`
        parent_user_id,
        student_id,
        students(name),
        parents(full_name)
      `)
      .limit(3)

    console.log('✅ Relationships test:', { count: relationships?.length, error: relError })

    // Test 5: Check attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('student_id, status, date')
      .limit(3)

    console.log('✅ Attendance test:', { count: attendance?.length, error: attendanceError })

    // Test 6: Check payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('student_id, amount, status')
      .limit(3)

    console.log('✅ Payments test:', { count: payments?.length, error: paymentsError })

    // Test with specific phone
    if (testPhone) {
      console.log('\n=== Phone Lookup Tests ===')
      
      const { data: profilePhone, error: profilePhoneError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', testPhone)

      console.log('Profile by phone:', { found: profilePhone?.length, error: profilePhoneError })

      const { data: parentPhone, error: parentPhoneError } = await supabase
        .from('parents')
        .select('*')
        .eq('phone', testPhone)

      console.log('Parent by phone:', { found: parentPhone?.length, error: parentPhoneError })

      const { data: guardianPhone, error: guardianPhoneError } = await supabase
        .from('students')
        .select('*')
        .eq('guardian_phone', testPhone)

      console.log('Students by guardian phone:', { found: guardianPhone?.length, error: guardianPhoneError })
    }

  } catch (err) {
    console.error('Schema debug error:', err)
  }
}

// ========================
// Default Export
// ========================
export const getAfricasTalkingClient = (): AfricasTalkingInstance | null => africastalking

// Create named export object to avoid anonymous default export
const africastalkingService = {
  AT_CONFIG,
  formatPhoneNumber,
  sendSMS,
  sendBulkSMS,
  sendWhatsApp,
  initiateUSSD,
  processUSSDResponse,
  getAfricasTalkingClient,
}

export default africastalkingService