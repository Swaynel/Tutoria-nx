import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'

// Africa's Talking incoming SMS webhook
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Expected payload from Africa's Talking (may vary): { from, to, text, id, timestamp, messageId }
    const payload = req.body || {}
    const from = payload.from || payload.From || payload.msisdn || null
    const to = payload.to || payload.To || payload.shortCode || null
    const text = payload.text || payload.Text || payload.message || ''
    const messageId = payload.id || payload.messageId || payload.message_id || null
    const network = payload.network || payload.networkCode || null

    // Best-effort insert into audit_logs so inbound messages are recorded
    await supabase.from('audit_logs').insert([
      {
        action: 'INCOMING_SMS',
        table_name: 'messages',
        new_data: {
          from,
          to,
          text,
          messageId,
          network,
          raw: payload,
          received_at: new Date().toISOString(),
        },
      },
    ])

    // Optionally, you might want to create a message entry or route this to a handler.
    // Keep this endpoint lightweight and idempotent; do not throw for logging failures.

    return res.status(200).send('OK')
  } catch (error) {
    console.error('Incoming SMS handler error:', error)
    return res.status(500).send('Error processing incoming SMS')
  }
}
