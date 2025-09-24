import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

// Africa's Talking delivery report callback
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id, status, phoneNumber, networkCode, failureReason } = req.body

    // Log delivery status
    await supabase
      .from('audit_logs')
      .insert([
        {
          action: 'SMS_DELIVERY_REPORT',
          table_name: 'messages',
          new_data: {
            message_id: id,
            status,
            phone_number: phoneNumber,
            network_code: networkCode,
            failure_reason: failureReason,
            received_at: new Date().toISOString()
          }
        }
      ])

    res.status(200).send('OK')
  } catch (error) {
    console.error('Delivery report error:', error)
    res.status(500).send('Error processing delivery report')
  }
}