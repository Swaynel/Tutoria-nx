// pages/payments.tsx
import { ReactElement } from 'react'
import { useDataContext } from '../contexts/DataContext'
import { formatCurrency, formatDate } from '../lib/utils'

// Define the complete Payment interface to match your data structure
interface Payment {
  id: string
  studentId: string // Note: using camelCase as suggested by the error
  amount: number
  description: string
  paidAt: string | null // Note: using camelCase - adjust if your data uses snake_case
  createdAt?: string
  updatedAt?: string
}

// If your actual data uses snake_case, use this interface instead:
/*
interface Payment {
  id: string
  student_id: string
  amount: number
  description: string
  paid_at: string | null
  created_at?: string
  updated_at?: string
}
*/

export default function Payments(): ReactElement {
  const { payments, loading } = useDataContext()

  if (loading) {
    return <div className="p-6">Loading payments...</div>
  }

  // Ensure payments is an array and handle potential undefined/null values
  const paymentsArray: Payment[] = Array.isArray(payments) ? payments : []

  const totalRevenue: number = paymentsArray.reduce((sum: number, payment: Payment) => {
    return sum + (payment.amount || 0)
  }, 0)

  // Filter payments based on the actual property names in your Payment interface
  // Using camelCase version - adjust if your data uses snake_case
  const pendingPayments: Payment[] = paymentsArray.filter((p: Payment) => !p.paidAt)
  const completedPayments: Payment[] = paymentsArray.filter((p: Payment) => p.paidAt)

  // If your data uses snake_case, use these filters instead:
  // const pendingPayments: Payment[] = paymentsArray.filter((p: Payment) => !p.paid_at)
  // const completedPayments: Payment[] = paymentsArray.filter((p: Payment) => p.paid_at)

  return (
    <div className="p-6">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Manage and track payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Payments</h3>
          <p className="text-3xl font-bold text-blue-600">{completedPayments.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Payments</h3>
          <p className="text-3xl font-bold text-amber-600">{pendingPayments.length}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentsArray.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  paymentsArray.map((payment: Payment) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payment.studentId}
                        {/* If using snake_case: {payment.student_id} */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {payment.description || 'No description'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paidAt ? formatDate(payment.paidAt) : 'Pending'}
                        {/* If using snake_case: {payment.paid_at ? formatDate(payment.paid_at) : 'Pending'} */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.paidAt 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.paidAt ? 'Paid' : 'Pending'}
                          {/* If using snake_case: {payment.paid_at ? 'Paid' : 'Pending'} */}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}