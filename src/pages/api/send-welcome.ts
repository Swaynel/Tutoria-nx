import { NextApiRequest, NextApiResponse } from 'next'

interface WelcomeRequest {
  email: string
  name: string
  role: string
  school: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, name, role, school } = req.body as WelcomeRequest

  try {
    // In a real implementation, you would send a welcome email
    // For now, we&apos;ll just log it
    console.log('Welcome message would be sent to:', {
      email,
      name,
      role,
      school
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error sending welcome message:', error)
    res.status(500).json({ error: 'Failed to send welcome message' })
  }
}