// src/pages/api/send-message.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { sendSMS, sendWhatsApp, SMSResult, WhatsAppResult } from '../../lib/africastalking'

// ---------------- Request & Response Types ----------------
interface SendMessageRequest {
  recipientId: string
  message: string
  viaSMS: boolean
  viaWhatsApp: boolean
}

interface SuccessResponse {
  success: true
  sms: SMSResult[]
  whatsapp: WhatsAppResult[] | null
}

interface ErrorResponse {
  success?: false
  error: string
  message?: string
}

type ApiResponse = SuccessResponse | ErrorResponse

interface MethodNotAllowedResponse {
  message: string
}

// ---------------- API Handler ----------------
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | MethodNotAllowedResponse>
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { recipientId, message, viaSMS, viaWhatsApp } = req.body as SendMessageRequest

    if (!recipientId || !message) {
      return res.status(400).json({ error: 'Missing required fields: recipientId and message are required' })
    }

    if (!viaSMS && !viaWhatsApp) {
      return res.status(400).json({ error: 'At least one delivery method (SMS or WhatsApp) must be selected' })
    }

    // Initialize results
    let smsResults: SMSResult[] = []
    let whatsappResults: WhatsAppResult[] | null = null

    // Mock recipient phone number
    const recipientPhone = '+254700000000'

    // ---------------- Send SMS ----------------
    if (viaSMS && recipientPhone) {
      try {
        smsResults = await sendSMS([recipientPhone], message)
      } catch (err) {
        console.error('SMS sending failed:', err)
      }
    }

    // ---------------- Send WhatsApp ----------------
    if (viaWhatsApp && recipientPhone) {
      try {
        whatsappResults = await sendWhatsApp([recipientPhone], message)
      } catch (err) {
        console.error('WhatsApp sending failed:', err)
      }
    }

    // ---------------- Check Success ----------------
    const smsSuccess = smsResults.length > 0 && smsResults.some((r) => r.success)
    const whatsappSuccess = whatsappResults !== null && whatsappResults.some((r) => r.success)

    if (!smsSuccess && !whatsappSuccess) {
      return res.status(500).json({ error: 'Failed to send message via any requested method' })
    }

    // ---------------- Return Success ----------------
    const response: SuccessResponse = {
      success: true,
      sms: smsResults,
      whatsapp: whatsappResults,
    }

    return res.status(200).json(response)
  } catch (error) {
    console.error('Error in send-message API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return res.status(500).json({ error: 'Failed to send message', message: errorMessage })
  }
}
