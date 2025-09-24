import { NextApiRequest, NextApiResponse } from 'next'
import { sendSMS, formatPhoneNumber, AT_CONFIG } from '../../../lib/africastalking'
import { supabase } from '../../../lib/supabase'

interface SMSRequest {
  to: string[]
  message: string
  messageType?: 'attendance' | 'payment' | 'general'
  schoolId?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { to, message, messageType = 'general', schoolId }: SMSRequest = req.body

  try {
    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' })
    }

    // Validate phone numbers
    const formattedNumbers = to.map(formatPhoneNumber).filter(phone => {
      return phone.startsWith('+254') && phone.length === 13
    })

    if (formattedNumbers.length === 0) {
      return res.status(400).json({ error: 'No valid Kenyan phone numbers provided' })
    }

    // Add SMS branding
    const brandedMessage = `Tuitora: ${message}\nReply STOP to opt-out`

    const results = await sendSMS(formattedNumbers, brandedMessage)

    // Log SMS activity
    if (schoolId) {
      await supabase
        .from('audit_logs')
        .insert([
          {
            action: 'SMS_SENT',
            table_name: 'messages',
            user_id: req.headers['x-user-id'] as string,
            new_data: {
              recipients: formattedNumbers.length,
              message_type: messageType,
              school_id: schoolId,
              results
            }
          }
        ])
    }

    res.status(200).json({ 
      success: true, 
      results,
      sent: formattedNumbers.length,
      message: `SMS sent via short code ${AT_CONFIG.SMS_SHORT_CODE}`
    })
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error)
    console.error('SMS sending error:', errMessage)
    res.status(500).json({ 
      error: 'Failed to send SMS',
      details: process.env.NODE_ENV === 'development' ? errMessage : undefined
    })
  }
}
