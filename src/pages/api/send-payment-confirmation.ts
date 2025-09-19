import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { sendSMS, SMSResult } from '../../lib/africastalking'

interface Profile {
  phone: string
}

interface ParentStudentRelationship {
  parent_user_id: string
  profiles: Profile[]
}

interface Student {
  name: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { studentId, amount, description } = req.body

  if (!studentId || !amount || !description) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    // Fetch parent contacts
    const { data: relData, error: relError } = await supabase
      .from('parent_student_relationships')
      .select(`
        parent_user_id,
        profiles (phone)
      `)
      .eq('student_id', studentId)

    if (relError) throw relError

    const relationships = relData as ParentStudentRelationship[]

    // Fetch student info
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('name')
      .eq('id', studentId)
      .single()

    if (studentError) throw studentError

    const student = studentData as Student

    // Send payment confirmation
    const messages: Promise<SMSResult[]>[] = []

    for (const relationship of relationships || []) {
      for (const profile of relationship.profiles || []) {
        if (profile.phone) {
          const message = `Payment Confirmation: $${amount} paid for ${student.name} - ${description}. Thank you for your payment!`
          messages.push(sendSMS([profile.phone], message))
        }
      }
    }

    // Await all SMS sends
    const results: SMSResult[][] = await Promise.all(messages)

    // Optional: flatten results if you want to return all SMS statuses
    const flattenedResults: SMSResult[] = results.flat()

    res.status(200).json({ success: true, sent: flattenedResults.length, results: flattenedResults })
  } catch (error) {
    console.error('Error sending payment confirmation:', error)
    res.status(500).json({ error: 'Failed to send confirmation' })
  }
}
