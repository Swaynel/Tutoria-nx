import { useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { useDataContext } from '../../contexts/DataContext'
import { supabase } from '../../lib/supabase'

interface ComposeMessageModalProps {
  onClose: () => void
}

export default function ComposeMessageModal({ onClose }: ComposeMessageModalProps) {
  const [recipientId, setRecipientId] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [viaSMS, setViaSMS] = useState(false)
  const [viaWhatsApp, setViaWhatsApp] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const { user } = useAuthContext()
  const { refreshData } = useDataContext() // fixed here

  const handleSend = async () => {
    if (!recipientId || !message || !user) return
    
    setIsSending(true)
    try {
      // Save message to database
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            school_id: user.school_id,
            sender_id: user.id,
            recipient_id: recipientId,
            subject,
            content: message,
            sent_at: new Date().toISOString()
          }
        ])

      if (error) throw error

      // Send via external channels if selected
      if (viaSMS || viaWhatsApp) {
        await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId,
            message,
            viaSMS,
            viaWhatsApp
          })
        })
      }

      await refreshData?.() // call the correct method
      onClose()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Compose Message</h2>
      
      <div className="mb-4">
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
          Recipient
        </label>
        <select
          id="recipient"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          required
        >
          <option value="">Select a recipient</option>
          <option value="user1">John Doe (Parent)</option>
          <option value="user2">Mrs. Smith (Teacher)</option>
          <option value="user3">School Admin</option>
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
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          id="message"
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Delivery Methods
        </label>
        <div className="flex items-center mb-2">
          <input
            id="platform-message"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            defaultChecked
            disabled
          />
          <label htmlFor="platform-message" className="ml-2 block text-sm text-gray-700">
            Platform Message
          </label>
        </div>
        <div className="flex items-center mb-2">
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
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          onClick={onClose}
          disabled={isSending}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
          onClick={handleSend}
          disabled={isSending || !recipientId || !message}
        >
          {isSending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  )
}
