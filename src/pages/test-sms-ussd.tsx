'use client'

import { useState } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { AT_CONFIG } from '../lib/africastalking'

export default function TestSMSUSSD() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('Test message from Tuitora')
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuthContext()

  const handleError = (err: unknown) => {
    return err instanceof Error ? err.message : String(err)
  }

  const testSMS = async () => {
    if (!phoneNumber) return

    setLoading(true)
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [phoneNumber],
          message,
          messageType: 'test',
          schoolId: user?.school_id
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (err: unknown) {
      setResult({ error: handleError(err) })
    } finally {
      setLoading(false)
    }
  }

  const testUSSD = async () => {
    if (!phoneNumber) return

    setLoading(true)
    try {
      const response = await fetch('/api/ussd/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          serviceCode: AT_CONFIG.USSD_SERVICE_CODE
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (err: unknown) {
      setResult({ error: handleError(err) })
    } finally {
      setLoading(false)
    }
  }

  const testBulkSMS = async () => {
    if (!user?.school_id) return

    setLoading(true)
    try {
      const response = await fetch('/api/sms/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: user.school_id,
          message: 'Bulk SMS test from Tuitora',
          recipientType: 'parents'
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (err: unknown) {
      setResult({ error: handleError(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">SMS & USSD Testing</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number (Kenyan)</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+2547XXXXXXXX"
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={testSMS}
            disabled={loading || !phoneNumber}
            className="p-3 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Test Single SMS
          </button>

          <button
            onClick={testBulkSMS}
            disabled={loading}
            className="p-3 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Test Bulk SMS
          </button>

          <button
            onClick={testUSSD}
            disabled={loading || !phoneNumber}
            className="p-3 bg-purple-500 text-white rounded disabled:opacity-50"
          >
            Test USSD Session
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800">Testing Information</h3>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• SMS Short Code: <strong>{AT_CONFIG.SMS_SHORT_CODE}</strong></li>
            <li>• USSD Code: <strong>{AT_CONFIG.USSD_SERVICE_CODE}</strong></li>
            <li>• Use real Kenyan numbers for production testing</li>
            <li>• Check Africa&apos;s Talking dashboard for delivery reports</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
