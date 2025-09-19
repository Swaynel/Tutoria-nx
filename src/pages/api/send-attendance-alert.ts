import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { sendSMS } from '../../lib/africastalking'

interface AttendanceRecord {
  student_id: string
  status: string
  date: string
}

interface Profile {
  phone?: string
}

interface Relationship {
  student_id: string
  parent_user_id: string
  profiles: Profile
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { students, date } = req.body as { students: AttendanceRecord[]; date: string }

  try {
    // Get parent contacts for absent students
    const studentIds = students.map(s => s.student_id)
    
    const { data: relationships, error: relError } = await supabase
      .from('parent_student_relationships')
      .select(`
        student_id,
        parent_user_id,
        profiles (phone)
      `)
      .in('student_id', studentIds)

    if (relError) throw relError

    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, name')
      .in('id', studentIds)

    if (studentError) throw studentError

    // Send alerts to parents
    const messages = []

    for (const relationship of relationships || []) {
      const student = studentData?.find(s => s.id === (relationship as Relationship).student_id)
      if (student && (relationship as Relationship).profiles?.phone) {
        const message = `Attendance Alert: ${student.name} was absent on ${date}. Please contact the school if this is unexpected.`
        messages.push(
          sendSMS([(relationship as Relationship).profiles.phone!], message)
        )
      }
    }

    await Promise.all(messages)
    res.status(200).json({ success: true, sent: messages.length })
  } catch (error) {
    console.error('Error sending attendance alerts:', error)
    res.status(500).json({ error: 'Failed to send alerts' })
  }
}