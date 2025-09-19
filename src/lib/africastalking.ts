// src/lib/africastalking.ts
import AfricasTalking from 'africastalking'

// ----------------- Types -----------------
export interface SMSResult {
  status: string
  messageId: string
  cost: string
  number: string
  statusCode: number
}

export interface WhatsAppResult {
  status: string
  messageId: string
  number: string
  cost?: string
  statusCode?: number
}

// Raw recipient type from SDK
interface RawSMSRecipient {
  status: string
  messageId: string
  cost: string
  number: string
  statusCode: number
}

// Africa's Talking SMS send response
interface AfricasTalkingSMS {
  send: (options: { to: string[] | string; message: string; from?: string }) => Promise<{
    SMSMessageData: {
      Message: string
      Recipients: RawSMSRecipient[]
    }
  }>
}

export interface AfricasTalkingClient {
  SMS: AfricasTalkingSMS
}

let africastalking: AfricasTalkingClient | null = null

if (typeof window === 'undefined') {
  const { AFRICAS_TALKING_API_KEY, AFRICAS_TALKING_USERNAME } = process.env

  if (!AFRICAS_TALKING_API_KEY || !AFRICAS_TALKING_USERNAME) {
    console.error('Missing Africa’s Talking API credentials')
    africastalking = null
  } else {
    try {
      africastalking = AfricasTalking({
        apiKey: AFRICAS_TALKING_API_KEY,
        username: AFRICAS_TALKING_USERNAME,
      }) as unknown as AfricasTalkingClient
    } catch (error) {
      console.error('Failed to initialize Africa’s Talking client:', error)
      africastalking = null
    }
  }
}

// ----------------- Helpers -----------------
export function getAfricasTalkingClient(): AfricasTalkingClient {
  if (!africastalking) {
    throw new Error('Africa’s Talking client not initialized. Check environment variables.')
  }
  return africastalking
}

// ----------------- Named Exports -----------------
export async function sendSMS(to: string | string[], message: string, from?: string): Promise<SMSResult[]> {
  const client = getAfricasTalkingClient()
  const response = await client.SMS.send({ to, message, from })

  const recipients: RawSMSRecipient[] = response.SMSMessageData?.Recipients || []

  return recipients.map((r) => ({
    status: r.status,
    messageId: r.messageId,
    cost: r.cost,
    number: r.number,
    statusCode: r.statusCode,
  }))
}

export async function sendWhatsApp(to: string | string[], message: string): Promise<WhatsAppResult> {
  const client = getAfricasTalkingClient()
  const response = await client.SMS.send({ to, message, from: 'WhatsApp' })

  const recipient: RawSMSRecipient = response.SMSMessageData?.Recipients?.[0] || {
    status: 'failed',
    messageId: '',
    number: '',
    cost: '0',
    statusCode: 0,
  }

  return {
    status: recipient.status,
    messageId: recipient.messageId,
    number: recipient.number,
    cost: recipient.cost,
    statusCode: recipient.statusCode,
  }
}

export default africastalking
