import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'
import { sendSMS as sendSMSProvider } from '../../../lib/africastalking'

import { ApiResponse } from '../../../types'

interface SendMessageRequest {
  schoolId: string
  recipientId: string
  recipientType: 'student' | 'parent' | 'teacher'
  subject: string
  message: string
  sendSMS?: boolean
  sendWhatsApp?: boolean
}

type SMSResult = ApiResponse<{ messageId: string }>

type WhatsAppResult = ApiResponse<{ message: string }>

type MessageResponse = ApiResponse<{
  messageId: string
  smsResult?: SMSResult
  whatsappResult?: WhatsAppResult
}>

// Helper function to get recipient phone number
async function getRecipientPhone(recipientId: string, recipientType: string, schoolId: string): Promise<string | null> {
  try {
    if (recipientType === 'parent') {
      const studentId = recipientId.startsWith('parent_') ? recipientId.replace('parent_', '') : recipientId
      
      const { data: student } = await supabase
        .from('students')
        .select('parent_phone')
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single()
      
      return student?.parent_phone || null
    }
    
    if (recipientType === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('phone')
        .eq('id', recipientId)
        .eq('school_id', schoolId)
        .single()
      
      return student?.phone || null
    }
    
    if (recipientType === 'teacher') {
      const { data: user } = await supabase
        .from('users')
        .select('phone')
        .eq('id', recipientId)
        .eq('school_id', schoolId)
        .single()
      
      return user?.phone || null
    }
    
    return null
  } catch (error) {
    console.error('Error getting recipient phone:', error)
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<MessageResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const {
      schoolId,
      recipientId,
      recipientType,
      subject,
      message,
      sendSMS = false,
      sendWhatsApp = false
    }: SendMessageRequest = req.body

    // Validate required fields
    if (!schoolId || !recipientId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: schoolId, recipientId, and message'
      })
    }

    // Get the current user from headers
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      })
    }

    // Save message to database first
    const { data: savedMessage, error: dbError } = await supabase
      .from('messages')
      .insert([
        {
          school_id: schoolId,
          sender_id: userId,
          recipient_id: recipientId,
          subject: subject || 'No Subject',
          content: message,
          sent_at: new Date().toISOString(),
          read_at: null
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return res.status(500).json({
        success: false,
        error: 'Failed to save message to database',
      })
    }

  type SMSApiResult = { success: boolean; messageId?: string; error?: string }
  let smsResult: SMSApiResult | undefined = undefined
  let whatsappResult: WhatsAppResult | undefined = undefined

    // Send via SMS/WhatsApp if requested
    if (sendSMS || sendWhatsApp) {
      const recipientPhone = await getRecipientPhone(recipientId, recipientType, schoolId)
      
      if (!recipientPhone) {
        console.warn(`No phone number found for recipient ${recipientId}`)
      } else {
        // Send SMS using your existing SMS API
        if (sendSMS) {
          try {
            // Directly send via africastalking helper on the server
            const smsResults = await sendSMSProvider([recipientPhone], `${subject ? subject + ': ' : ''}${message}`)
            // sendSMS returns an array of SMSResult
            const first = Array.isArray(smsResults) ? smsResults[0] : undefined
            smsResult = first
              ? { success: first.success, messageId: first.messageId || '', error: first.error }
              : { success: false, error: 'No result from SMS provider' }
          } catch (error) {
            console.warn('SMS send failed:', error)
            smsResult = { success: false, error: 'SMS send failed' }
          }
        }

        // WhatsApp sending (placeholder for now)
        if (sendWhatsApp) {
          console.log('WhatsApp sending not yet implemented')
          whatsappResult = { success: false, error: 'WhatsApp not implemented yet' }
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        messageId: savedMessage.id,
        smsResult,
        whatsappResult
      }
    })

  } catch (error) {
    console.error('Error in send message API:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}