import { NextApiRequest, NextApiResponse } from 'next'
import { processUSSDResponse as processATUSSDResponse } from '../../../lib/africastalking'

// USSD request parameters
export interface USSDRequest {
  sessionId: string
  phoneNumber: string
  text: string
  serviceCode?: string
}

// USSD response is always a string (Africa's Talking expects plain text)
export type USSDResponse = string

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    const { sessionId, phoneNumber, text, serviceCode } = req.body as USSDRequest

    // Validate required fields
    if (!sessionId || !phoneNumber || text === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    // Process the USSD request using our library function
    const session = {
      sessionId,
      phoneNumber,
      serviceCode: serviceCode || '*384*38164#',
      text
    }

    const response = await processATUSSDResponse(session, text)

    // Africa's Talking expects plain text responses
    res.setHeader('Content-Type', 'text/plain')
    return res.status(200).send(response.text)

  } catch (error) {
    console.error('USSD Processing Error:', error)
    res.setHeader('Content-Type', 'text/plain')
    return res.status(500).send('END An error occurred. Please try again later.')
  }
}
