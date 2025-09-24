import { useState, useEffect } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { useDataContext } from '../../contexts/DataContext'

interface ComposeMessageModalProps {
  onClose: () => void
  recipientId?: string
}

interface Recipient {
  id: string
  name: string
  type: 'student' | 'parent' | 'teacher'
  phone?: string
}

// Extended student type to handle potential variations in phone field names
interface ExtendedStudent {
  id: string
  name?: string
  first_name?: string
  last_name?: string
  phone?: string
  parent_phone?: string
  parentPhone?: string // Alternative naming convention
}

export default function ComposeMessageModal({ onClose, recipientId }: ComposeMessageModalProps) {
  const [selectedRecipientId, setSelectedRecipientId] = useState(recipientId || '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [viaSMS, setViaSMS] = useState(false)
  const [viaWhatsApp, setViaWhatsApp] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const { user } = useAuthContext()
  const { students, refreshAllData } = useDataContext()

  // Load available recipients
  useEffect(() => {
    if (!user?.school_id || !students) return

    try {
      // Students as recipients
      const studentRecipients: Recipient[] = students.map((student: ExtendedStudent) => ({
        id: student.id,
        name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unnamed Student',
        type: 'student' as const,
        phone: student.phone
      }))

      // Parents as recipients - check for parent phone fields
      const parentRecipients: Recipient[] = students
        .filter((student: ExtendedStudent) => student.parent_phone || student.parentPhone)
        .map((student: ExtendedStudent) => ({
          id: `parent_${student.id}`,
          name: `${student.name || 'Student'}'s Parent`,
          type: 'parent' as const,
          phone: student.parent_phone || student.parentPhone
        }))

      setRecipients([...studentRecipients, ...parentRecipients])
    } catch (error) {
      console.error('Error loading recipients:', error)
      setError('Failed to load recipients')
    }
  }, [user?.school_id, students])

  const handleSend = async () => {
    if (!selectedRecipientId || !message || !user) {
      setError('Please fill in all required fields')
      return
    }
    
    setIsSending(true)
    setError(null)
    
    try {
      const selectedRecipient = recipients.find(r => r.id === selectedRecipientId)
      if (!selectedRecipient) {
        throw new Error('Selected recipient not found')
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          schoolId: user.school_id,
          recipientId: selectedRecipientId,
          recipientType: selectedRecipient.type,
          subject: subject || 'No Subject',
          message,
          sendSMS: viaSMS,
          sendWhatsApp: viaWhatsApp
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      const result = await response.json()
      console.log('Message sent successfully:', result)

      setSuccess(true)
      
      if (refreshAllData) {
        await refreshAllData()
      }
      
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Error sending message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Message Sent!</h2>
        <p className="text-sm text-gray-600">Your message has been delivered successfully.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Compose Message</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
          Recipient *
        </label>
        <select
          id="recipient"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={selectedRecipientId}
          onChange={(e) => setSelectedRecipientId(e.target.value)}
          required
        >
          <option value="">Select a recipient...</option>
          {recipients.map((recipient) => (
            <option key={recipient.id} value={recipient.id}>
              {recipient.name} ({recipient.type})
              {recipient.phone && ` - ${recipient.phone}`}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mb-4">
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter message subject"
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message *
        </label>
        <textarea
          id="message"
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          required
        />
        {viaSMS && (
          <p className="text-xs text-gray-500 mt-1">
            SMS character limit: {message.length}/160
          </p>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delivery Methods
        </label>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="platform-message"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              defaultChecked
              disabled
            />
            <label htmlFor="platform-message" className="ml-2 block text-sm text-gray-700">
              Platform Message (always sent)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="sms"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={viaSMS}
              onChange={(e) => setViaSMS(e.target.checked)}
            />
            <label htmlFor="sms" className="ml-2 block text-sm text-gray-700">
              SMS (via Africa&apos;s Talking)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="whatsapp"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              checked={viaWhatsApp}
              onChange={(e) => setViaWhatsApp(e.target.checked)}
            />
            <label htmlFor="whatsapp" className="ml-2 block text-sm text-gray-700">
              WhatsApp (via Africa&apos;s Talking)
            </label>
          </div>
        </div>
        
        {(viaSMS || viaWhatsApp) && (
          <p className="text-xs text-blue-600 mt-2">
            External messages require valid phone numbers
          </p>
        )}
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          onClick={onClose}
          disabled={isSending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
          onClick={handleSend}
          disabled={isSending || !selectedRecipientId || !message}
        >
          {isSending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  )
}