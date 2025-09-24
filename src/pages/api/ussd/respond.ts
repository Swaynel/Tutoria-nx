// src/pages/api/ussd/respond.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { processUSSDResponse, USSDSession, USSDResponse } from '../../../lib/africastalking'

interface USSDRespondRequest {
  session: USSDSession
  text: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: true; data: USSDResponse } | { success: false; error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { session, text }: USSDRespondRequest = req.body

  if (!session || !text) {
    return res.status(400).json({ success: false, error: 'Session and text are required' })
  }

  try {
    const response: USSDResponse = await processUSSDResponse(session, text)
    res.status(200).json({ success: true, data: response })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('USSD response processing error:', error)
    res.status(500).json({ success: false, error: message })
  }
}
