import { useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { AT_CONFIG } from '../../lib/africastalking'

interface SendBulkSMSModalProps {
  onClose: () => void
}

type RecipientType = 'parents' | 'teachers' | 'students' | 'all'

interface BulkSMSResult {
  successful?: number
  failed?: number
  error?: string
}

export default function SendBulkSMSModal({ onClose }: SendBulkSMSModalProps) {
  const [message, setMessage] = useState('')
  const [recipientType, setRecipientType] = useState<RecipientType>('parents')
  const [isSending, setIsSending] = useState(false)
  const [resultSummary, setResultSummary] = useState<BulkSMSResult | null>(null)
  const { user } = useAuthContext()

  const handleSend = async () => {
    if (!message.trim() || !user?.school_id) return

    // Only admins can send bulk messages from UI
    const role = (user && (user as { role?: string }).role) || ''
    if (!(role === 'superadmin' || role === 'school_admin')) {
      setResultSummary({ error: 'You do not have permission to send bulk messages.' })
      return
    }

    setIsSending(true)
    setResultSummary(null)

    try {
      const response = await fetch('/api/sms/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: user.school_id,
          message,
          recipientType
        })
      })

  const result: BulkSMSResult = await response.json()

  if (!response.ok) throw new Error(result.error ?? 'Unknown error')

      // Show summary
      setResultSummary({
        successful: result.successful ?? 0,
        failed: result.failed ?? 0
      })

      // Clear the form for next message
      setMessage('')
      setRecipientType('parents')
    } catch (error: unknown) {
      if (error instanceof Error) {
        setResultSummary({ error: error.message })
      } else {
        setResultSummary({ error: 'An unexpected error occurred' })
      }
    } finally {
      setIsSending(false)
    }
  }

  const charCount = message.length
  const maxChars = 160 // Standard SMS character limit
  const segments = Math.ceil(Math.max(1, charCount) / maxChars)
  const segmentInfo = segments > 1 ? `${segments} segments (${charCount} chars)` : `${charCount} chars`

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Send Bulk SMS</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recipients
        </label>
        <select
          value={recipientType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setRecipientType(e.target.value as RecipientType)
          }
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="parents">Parents Only</option>
          <option value="teachers">Teachers Only</option>
          <option value="students">Students Only</option>
          <option value="all">All Users</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message ({charCount}/{maxChars} characters)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={maxChars}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Type your message here..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Messages will be sent from short code {AT_CONFIG.SMS_SHORT_CODE} • {segmentInfo}
        </p>
      </div>

      <div className="bg-blue-50 p-3 rounded-md">
        <h4 className="font-medium text-blue-800">USSD Service Available</h4>
        <p className="text-sm text-blue-700">
          Parents can dial <strong>{AT_CONFIG.USSD_SERVICE_CODE}</strong> to
          check attendance and fees anytime!
        </p>
      </div>

      {resultSummary && (
        <div
          className={`p-3 rounded-md ${
            resultSummary.error
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {resultSummary.error ? (
            <p>Error: {resultSummary.error}</p>
          ) : (
            <p>
              Bulk SMS sent successfully! {resultSummary.successful} delivered,
              {resultSummary.failed} failed.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          disabled={isSending}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={isSending || !message.trim()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSending ? 'Sending...' : `Send via ${AT_CONFIG.SMS_SHORT_CODE}`}
        </button>
      </div>
    </div>
  )
}
