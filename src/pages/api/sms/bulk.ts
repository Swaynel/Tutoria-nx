import { NextApiRequest, NextApiResponse } from 'next'
import { sendBulkSMS } from '../../../lib/africastalking'
import { supabase } from '../../../lib/supabase'

interface BulkSMSRequest {
  schoolId: string
  message: string
  recipientType: 'parents' | 'teachers' | 'students' | 'all'
  grade?: string
}

// Define the Supabase recipient type
interface Recipient {
  phone: string
  full_name: string | null
  role: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { schoolId, message, recipientType } = req.body as BulkSMSRequest

  try {
    if (!schoolId || !message) {
      return res.status(400).json({ error: 'Missing required fields: schoolId, message' })
    }

    // Get recipients based on type
    let recipientsQuery = supabase
      .from('profiles')
      .select('phone, full_name, role')
      .eq('school_id', schoolId)
      .not('phone', 'is', null)

    if (recipientType === 'parents') {
      recipientsQuery = recipientsQuery.eq('role', 'parent')
    } else if (recipientType === 'teachers') {
      recipientsQuery = recipientsQuery.eq('role', 'teacher')
    } else if (recipientType === 'students') {
      recipientsQuery = recipientsQuery.eq('role', 'student')
    }
    // if 'all', no additional filter is applied

    const { data: recipients, error } = await recipientsQuery.returns<Recipient[]>()
    if (error) throw error

    if (!recipients || recipients.length === 0) {
      return res.status(404).json({ error: 'No recipients found with phone numbers' })
    }

    // Map recipients into correct shape for sendBulkSMS
    const formattedRecipients = recipients.map(r => ({
      phone: r.phone,
      name: r.full_name || 'Unknown'
    }))

    const results = await sendBulkSMS(formattedRecipients, message)

    // Log bulk SMS activity
    await supabase
      .from('audit_logs')
      .insert([
        {
          action: 'BULK_SMS_SENT',
          table_name: 'messages',
          user_id: req.headers['x-user-id'] as string,
          new_data: {
            school_id: schoolId,
            recipient_type: recipientType,
            recipient_count: recipients.length,
            message_length: message.length
          }
        }
      ])

    res.status(200).json({ 
      success: true, 
      totalRecipients: recipients.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    })
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error)
    console.error('Bulk SMS error:', errMessage)
    res.status(500).json({ 
      error: 'Failed to send bulk SMS',
      details: process.env.NODE_ENV === 'development' ? errMessage : undefined
    })
  }
}
