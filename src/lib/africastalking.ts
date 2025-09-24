// src/lib/africastalking.ts
import AfricasTalking from 'africastalking'

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

  if (!apiKey || !username) {
    console.error("Africa's Talking API credentials missing - SMS/USSD features will be disabled")
  } else {
    const at = AfricasTalking({ apiKey, username }) as unknown
    africastalking = at as AfricasTalkingInstance
  }
}

// ========================
// SMS Functions
// ========================
export const sendSMS = async (to: string[], message: string): Promise<SMSResult[]> => {
  if (typeof window !== 'undefined') {
    throw new Error('sendSMS can only be used on the server side')
  }

  if (!africastalking) {
    console.warn("Africa's Talking not initialized - SMS feature disabled")
    return to.map((recipient) => ({
      recipient,
      success: false,
      error: 'SMS service temporarily unavailable',
    }))
  }

  try {
    const formattedMessage = `${message}\n\n- ${AT_CONFIG.SMS_SENDER_ID}`

    const result = await africastalking.SMS.send({
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
    const lastInput: USSDOption = inputs[inputs.length - 1] as USSDOption

    let responseText: string

    switch (lastInput) {
      case '1':
        responseText = await getAttendanceViaUSSD()
        break
      case '2':
        responseText = await getFeesViaUSSD()
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
const getAttendanceViaUSSD = async (): Promise<string> => {
  return `ATTENDANCE SUMMARY:
Present: 45 days
Absent: 2 days
Late: 3 days
Last update: ${new Date().toLocaleDateString()}

0. Back
00. Main Menu`
}

const getFeesViaUSSD = async (): Promise<string> => {
  return `FEES SUMMARY:
Total Due: KES 15,000
Paid: KES 10,000
Balance: KES 5,000
Due Date: 25/12/2024

0. Back
00. Main Menu`
}

// ========================
// Get SDK Client
// ========================
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
