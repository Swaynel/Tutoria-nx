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

  if (digits.startsWith('0') && digits.length === 10) {
    return '+254' + digits.substring(1)
  }

  if (digits.startsWith('254') && digits.length === 12) {
    return '+' + digits
  }

  if (digits.startsWith('7') && digits.length === 9) {
    return '+254' + digits
  }

  return phone
}

// ========================
// SDK Initialization
// ========================
let africastalking: AfricasTalkingInstance | null = null

if (typeof window === 'undefined') {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY
  const username = process.env.AFRICAS_TALKING_USERNAME

  if (!apiKey || !username || apiKey === 'placeholder' || username === 'placeholder') {
    console.error("Africa's Talking API credentials missing or invalid - SMS/USSD features will be disabled")
  } else {
    try {
      const at = AfricasTalking({ apiKey, username }) as unknown
      africastalking = at as AfricasTalkingInstance
      console.log("Africa's Talking SDK initialized successfully")
    } catch (err) {
      console.error("Failed to initialize Africa's Talking SDK:", err)
    }
  }
}

// ========================
// SMS Functions
// ========================
export const sendSMS = async (to: string[], message: string): Promise<SMSResult[]> => {
  if (typeof window !== 'undefined') {
    console.warn('sendSMS called from browser - this should be a server-side operation')
    return to.map((recipient) => ({
      recipient,
      success: false,
      error: 'SMS must be sent from server-side',
    }))
  }

  if (!africastalking) {
    // Check if this is due to missing credentials
    const credentialsMissing = !process.env.AFRICAS_TALKING_API_KEY || !process.env.AFRICAS_TALKING_USERNAME || 
      process.env.AFRICAS_TALKING_API_KEY === 'placeholder' || process.env.AFRICAS_TALKING_USERNAME === 'placeholder'
    
    const errorMessage = credentialsMissing
      ? "Africa's Talking credentials not configured. Please check your environment variables."
      : "Africa's Talking SDK initialization failed. The service may be temporarily unavailable."
    
    console.warn(`SMS disabled: ${errorMessage}`)
    return to.map((recipient) => ({
      recipient,
      success: false,
      error: errorMessage,
    }))
  }

  const sendOnce = async () => {
    const formattedMessage = `${message}\n\n- ${AT_CONFIG.SMS_SENDER_ID}`
    const result = await africastalking!.SMS.send({
      to,
      message: formattedMessage,
      from: AT_CONFIG.SMS_SHORT_CODE,
      enqueue: true,
    })

    return result.SMSMessageData.Recipients.map((recipient) => ({
      recipient: recipient.number,
      success: recipient.status === 'Success',
      messageId: recipient.messageId,
      cost: recipient.cost,
      error: recipient.status !== 'Success' ? recipient.status : undefined,
    }))
  }

  try {
    // Try once; if it fails, retry once after a short delay
    try {
      return await sendOnce()
    } catch (firstErr) {
      // Check if this is a temporary error worth retrying
      const shouldRetry = firstErr instanceof Error && (
        firstErr.message.includes('timeout') ||
        firstErr.message.includes('network') ||
        firstErr.message.includes('ECONNRESET') ||
        firstErr.message.toLowerCase().includes('temporary')
      )

      if (!shouldRetry) {
        throw firstErr // Don't retry permanent errors
      }

      console.warn('sendSMS first attempt failed, retrying once...', { error: firstErr, recipients: to })
      await new Promise((r) => setTimeout(r, 1000)) // Longer delay for retry
      return await sendOnce()
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown SMS error')
    console.error("Africa's Talking SMS API error:", err)
    return to.map((recipient) => ({
      recipient,
      success: false,
      error: err.message || 'Failed to send SMS',
    }))
  }
}

// ========================
// Bulk SMS
// ========================
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

    if (i + batchSize < phoneNumbers.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000)) // rate limit
    }
  }

  return results
}

// ========================
// WhatsApp Function
// ========================
export const sendWhatsApp = async (to: string[], message: string): Promise<WhatsAppResult[]> => {
  if (typeof window !== 'undefined') {
    throw new Error('sendWhatsApp can only be used on the server side')
  }

  // Currently a stub using sendSMS as fallback
  const smsResults = await sendSMS(to, `[WhatsApp] ${message}`)

  return smsResults.map((r) => ({
    recipient: r.recipient,
    success: r.success,
    messageId: r.messageId,
    error: r.error,
  }))
}

// ========================
// USSD Functions
// ========================
export const initiateUSSD = async (
  phoneNumber: string,
  serviceCode: string = AT_CONFIG.USSD_SERVICE_CODE
): Promise<USSDSession> => {
  if (typeof window !== 'undefined') {
    throw new Error('initiateUSSD can only be used on the server side')
  }

  if (!africastalking) {
    throw new Error("Africa's Talking not initialized")
  }

  const sessionId = `ussd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  return {
    sessionId,
    phoneNumber: formatPhoneNumber(phoneNumber),
    serviceCode,
    text: 'Welcome to Tuitora. Select option:\n1. Check Attendance\n2. Check Fees\n3. Contact School',
  }
}

export const processUSSDResponse = async (
  session: USSDSession,
  text: string
): Promise<USSDResponse> => {
  if (typeof window !== 'undefined') {
    throw new Error('processUSSDResponse can only be used on the server side')
  }

  try {
    const inputs = text.split('*').filter((input) => input.length > 0)

    let responseText: string

    // Route based on the first input (main menu choice)
    const mainChoice = inputs[0] as USSDOption | undefined

    switch (mainChoice) {
      case '1':
        responseText = await getAttendanceViaUSSD(session.phoneNumber, inputs)
        break
      case '2':
        responseText = await getFeesViaUSSD(session.phoneNumber, inputs)
        break
      case '3':
        responseText = 'Contact your school admin at: 0700-000-000\nOr visit: tuitora.com'
        break
      case '0':
      case '00':
      default:
        responseText = 'Welcome to Tuitora. Select option:\n1. Check Attendance\n2. Check Fees\n3. Contact School'
        break
    }

    // Log session to Supabase (best-effort)
    try {
      await logUSSDSession(session.sessionId, session.phoneNumber, text, responseText, 'pending')
    } catch (err) {
      console.error('Failed to log USSD session:', err)
    }

    return {
      sessionId: session.sessionId,
      phoneNumber: session.phoneNumber,
      text: responseText,
      status: 'pending',
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown USSD error')
    console.error('USSD processing error:', err)
    return {
      sessionId: session.sessionId,
      phoneNumber: session.phoneNumber,
      text: 'Sorry, service temporarily unavailable. Please try again later.',
      status: 'pending',
    }
  }
}

// ========================
// Mock USSD services
// ========================
type ParentRelRow = { student_id: string; profiles?: { phone?: string } }
type AttendanceRow = { status: string }

// Simple in-memory cache for lookups (phone -> studentIds)
const lookupCache = new Map<string, { studentIds: string[]; expiresAt: number }>()
const CACHE_TTL_MS = 60_000 // 1 minute

const getCachedStudentIds = (phone: string): string[] | null => {
  const entry = lookupCache.get(phone)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    lookupCache.delete(phone)
    return null
  }
  return entry.studentIds
}

const setCachedStudentIds = (phone: string, studentIds: string[]) => {
  lookupCache.set(phone, { studentIds, expiresAt: Date.now() + CACHE_TTL_MS })
}

const getAttendanceViaUSSD = async (phone?: string, inputs?: string[]): Promise<string> => {
  try {
    if (!phone) {
      return `ATTENDANCE SUMMARY:\nNo phone number provided.\n0. Back\n00. Main Menu`
    }

  // Try cache first
  let studentIds = phone ? getCachedStudentIds(phone) || [] : []

  if (studentIds.length === 0) {
      // Try to find parent_student_relationships by profile phone
      const { data: rels, error: relError } = await supabase
        .from('parent_student_relationships')
        .select('student_id, profiles (phone)')
        .eq('profiles.phone', phone)

      if (relError) throw relError

      studentIds = (rels as ParentRelRow[] | null)?.map((r) => r.student_id) || []
      if (studentIds.length > 0) setCachedStudentIds(phone, studentIds)
    }

  if (studentIds.length === 0) {
      // Maybe it's a student's own phone
      const { data: student, error: stuErr } = await supabase
        .from('students')
        .select('id')
        .eq('phone', phone)
        .single()
      if (stuErr) throw stuErr
      if (student) {
        studentIds.push(student.id)
        setCachedStudentIds(phone, [student.id])
      }
    }

    if (studentIds.length === 0) {
      return `ATTENDANCE SUMMARY:\nNo student found for this phone number.\n0. Back\n00. Main Menu`
    }

    // If multiple students, and only main menu selected (inputs length === 1), show selection menu with real names
    if (studentIds.length > 1 && (!inputs || inputs.length === 1)) {
      try {
        type StudentRow = { id: string; name?: string }
        const { data: stuRows } = await supabase.from('students').select('id, name').in('id', studentIds)
        const ordered = studentIds.map((id, idx) => {
          const found = (stuRows as StudentRow[] | null)?.find((s) => s.id === id)
          const display = found?.name || `Student ${idx + 1}`
          return `${idx + 1}. ${display}`
        })
        const list = ordered.join('\n')
        return `MULTIPLE STUDENTS FOUND:\n${list}\nSelect a number to view that student's attendance\n0. Back\n00. Main Menu`
      } catch (err) {
        console.error('Failed to fetch student names for USSD selection:', err)
        const list = studentIds.map((id, idx) => `${idx + 1}. Student ${idx + 1}`).join('\n')
        return `MULTIPLE STUDENTS FOUND:\n${list}\nSelect a number to view that student's attendance\n0. Back\n00. Main Menu`
      }
    }

    // If selection provided (e.g., inputs[1] = '2'), pick that student
    let chosenStudentId = studentIds[0]
    if (studentIds.length > 1 && inputs && inputs.length >= 2) {
      const sel = parseInt(inputs[1], 10)
      if (!Number.isNaN(sel) && sel >= 1 && sel <= studentIds.length) {
        chosenStudentId = studentIds[sel - 1]
      }
    }

    // Fetch student record to determine school
    type StudentRowFull = { id: string; name?: string; school_id?: string }
    const { data: studentRow, error: studErr } = await supabase
      .from('students')
      .select('id, name, school_id')
      .eq('id', chosenStudentId)
      .single()
    if (studErr) throw studErr

    const schoolId = (studentRow as StudentRowFull | null)?.school_id || null
    if (!schoolId) {
      return `ATTENDANCE SUMMARY:\nNo school assigned to this student. Please contact your school admin.\n0. Back\n00. Main Menu`
    }

    // Check if the school is premium
    type SchoolRow = { id: string; name?: string; is_premium?: boolean }
    const { data: schoolRow, error: schoolErr } = await supabase
      .from('schools')
      .select('id, name, is_premium')
      .eq('id', schoolId)
      .single()
    if (schoolErr) throw schoolErr

    if (!schoolRow || !schoolRow.is_premium) {
      // Upsell message for non-premium schools
      const schoolName = schoolRow?.name || 'your school'
      return `TUITORA PREMIUM REQUIRED:\nThe USSD attendance feature is available for Tuitora Premium schools.\\nTo upgrade ${schoolName}, visit:\nhttps://tuitora.com/pricing\nOr contact sales: +254700000000\n0. Back\n00. Main Menu`
    }

    // Fetch recent attendance records for these students (last 30 days)
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 30)

    const { data: attendanceRows, error: attError } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', chosenStudentId)
      .gt('date', fromDate.toISOString().split('T')[0])

    if (attError) throw attError

    const present = (attendanceRows as AttendanceRow[] | null || []).filter((r) => r.status === 'present').length
    const absent = (attendanceRows as AttendanceRow[] | null || []).filter((r) => r.status === 'absent').length
    const late = (attendanceRows as AttendanceRow[] | null || []).filter((r) => r.status === 'late').length

    return `ATTENDANCE SUMMARY:\nPresent: ${present} days\nAbsent: ${absent} days\nLate: ${late} days\nLast update: ${new Date().toLocaleDateString()}\n\n0. Back\n00. Main Menu`
  } catch (error) {
    console.error('getAttendanceViaUSSD error:', error)
    return `ATTENDANCE SUMMARY:\nUnable to retrieve attendance at the moment.\n0. Back\n00. Main Menu`
  }
}

type PaymentRow = { amount?: number; status?: string }

const getFeesViaUSSD = async (phone?: string, inputs?: string[]): Promise<string> => {
  try {
    if (!phone) {
      return `FEES SUMMARY:\nNo phone number provided.\n0. Back\n00. Main Menu`
    }
    // Try cache first
    let studentIds = phone ? getCachedStudentIds(phone) || [] : []

    if (studentIds.length === 0) {
      const { data: rels, error: relError } = await supabase
        .from('parent_student_relationships')
        .select('student_id, profiles (phone)')
        .eq('profiles.phone', phone)

      if (relError) throw relError

      studentIds = (rels as ParentRelRow[] | null)?.map((r) => r.student_id) || []
      if (studentIds.length > 0 && phone) setCachedStudentIds(phone, studentIds)
    }

    let studentId: string | null = studentIds.length > 0 ? studentIds[0] : null

    if (!studentId) {
      const { data: student, error: stuErr } = await supabase
        .from('students')
        .select('id')
        .eq('phone', phone)
        .single()
      if (stuErr) throw stuErr
      if (student) {
        studentId = student.id
        if (phone && studentId) setCachedStudentIds(phone, [studentId])
      }
    }

    if (!studentId) {
      return `FEES SUMMARY:\nNo student found for this phone number.\n0. Back\n00. Main Menu`
    }

    // Multi-student handling: if multiple studentIds and no selection provided, ask user to choose (show names)
    if (studentIds.length > 1 && (!inputs || inputs.length === 1)) {
      try {
        type StudentRow = { id: string; name?: string }
        const { data: stuRows } = await supabase.from('students').select('id, name').in('id', studentIds)
        const ordered = studentIds.map((id, idx) => {
          const found = (stuRows as StudentRow[] | null)?.find((s) => s.id === id)
          const display = found?.name || `Student ${idx + 1}`
          return `${idx + 1}. ${display}`
        })
        const list = ordered.join('\n')
        return `MULTIPLE STUDENTS FOUND:\n${list}\nSelect a number to view that student's fees\n0. Back\n00. Main Menu`
      } catch (err) {
        console.error('Failed to fetch student names for USSD fees selection:', err)
        const list = studentIds.map((id, idx) => `${idx + 1}. Student ${idx + 1}`).join('\n')
        return `MULTIPLE STUDENTS FOUND:\n${list}\nSelect a number to view that student's fees\n0. Back\n00. Main Menu`
      }
    }

    // If a selection was provided, pick the specified student
    let chosen = studentId
    if (studentIds.length > 1 && inputs && inputs.length >= 2) {
      const sel = parseInt(inputs[1], 10)
      if (!Number.isNaN(sel) && sel >= 1 && sel <= studentIds.length) {
        chosen = studentIds[sel - 1]
      }
    }

    // Fetch student to determine school
    type StudentRowFull = { id: string; name?: string; school_id?: string }
    const { data: studentRow, error: studErr } = await supabase
      .from('students')
      .select('id, name, school_id')
      .eq('id', chosen)
      .single()
    if (studErr) throw studErr

    const schoolId = (studentRow as StudentRowFull | null)?.school_id || null
    if (!schoolId) {
      return `FEES SUMMARY:\nNo school assigned to this student. Please contact your school admin.\n0. Back\n00. Main Menu`
    }

    // Check if the school is premium
    type SchoolRow = { id: string; name?: string; is_premium?: boolean }
    const { data: schoolRow, error: schoolErr } = await supabase
      .from('schools')
      .select('id, name, is_premium')
      .eq('id', schoolId)
      .single()
    if (schoolErr) throw schoolErr

    if (!schoolRow || !schoolRow.is_premium) {
      const schoolName = schoolRow?.name || 'your school'
      return `TUITORA PREMIUM REQUIRED:\nThe USSD fees feature is available for Tuitora Premium schools.\nTo upgrade ${schoolName}, visit:\nhttps://tuitora.com/pricing\nOr contact sales: +254700000000\n0. Back\n00. Main Menu`
    }

    // Calculate fees by summing payments and looking for expected fees
    const { data: paymentsRows, error: payErr } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('student_id', chosen)

    if (payErr) throw payErr

    const paid = (paymentsRows as PaymentRow[] | null || []).filter((p) => p.status === 'paid').reduce((s: number, p) => s + (p.amount || 0), 0)
    const due = (paymentsRows as PaymentRow[] | null || []).filter((p) => p.status !== 'paid').reduce((s: number, p) => s + (p.amount || 0), 0)

    return `FEES SUMMARY:\nTotal Due: KES ${due + paid}\nPaid: KES ${paid}\nBalance: KES ${due}\n\n0. Back\n00. Main Menu`
  } catch (error) {
    console.error('getFeesViaUSSD error:', error)
    return `FEES SUMMARY:\nUnable to retrieve fee information at the moment.\n0. Back\n00. Main Menu`
  }
}

// ========================
// Get SDK Client
// ========================
const logUSSDSession = async (
  sessionId: string,
  phone: string,
  inputText: string,
  responseText: string,
  status: 'pending' | 'completed' | 'failed'
) => {
  try {
    await supabase.from('ussd_sessions').insert([
      {
        session_id: sessionId,
        phone,
        input_text: inputText,
        response_text: responseText,
        status,
        created_at: new Date().toISOString()
      }
    ])
  } catch (err) {
    console.error('logUSSDSession error:', err)
    // swallow errors - logging should be best-effort
  }
}

export const getAfricasTalkingClient = (): AfricasTalkingInstance | null => africastalking

// ========================
// Default Export
// ========================
const africastalkingLib = {
  AT_CONFIG,
  formatPhoneNumber,
  sendSMS,
  sendBulkSMS,
  sendWhatsApp,
  initiateUSSD,
  processUSSDResponse,
  getAfricasTalkingClient,
}

export default africastalkingLib
