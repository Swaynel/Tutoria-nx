import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  res.status(200).json({
    service: 'Tuitora USSD Service',
    status: 'active',
    code: '*384*38164#',
    features: ['attendance_check', 'fees_inquiry', 'school_contact']
  })
}