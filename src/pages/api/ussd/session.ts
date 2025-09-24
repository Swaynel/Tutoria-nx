// src/pages/api/ussd/session.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { initiateUSSD, AT_CONFIG, USSDSession } from '../../../lib/africastalking'

interface USSDRequest {
  phoneNumber: string
  serviceCode?: string
}

interface USSDResponsePayload {
  success: boolean
  data: USSDSession
  instruction: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<USSDResponsePayload | { success: false; error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { phoneNumber, serviceCode }: USSDRequest = req.body

  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: 'Phone number is required' })
  }

  try {
    const session: USSDSession = await initiateUSSD(phoneNumber, serviceCode)

    res.status(200).json({
      success: true,
      data: session,
      instruction: `Dial ${AT_CONFIG.USSD_SERVICE_CODE} on your phone to continue`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('USSD session error:', error)
    res.status(500).json({ success: false, error: message })
  }
}
