// src/pages/payments.tsx
import { ReactElement, useState } from 'react'
import { useDataContext } from '../contexts/DataContext'
import { formatCurrency, formatDate } from '../lib/utils'
import { Payment } from '../types'

type SortKey = 'amount' | 'paid_at' | 'status'

export default function Payments(): ReactElement {
  const { payments, students, loading } = useDataContext()
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('paid_at')
  const [sortAsc, setSortAsc] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 10 // Show 10 payments per page

  if (loading) {
    return <div className="p-6">Loading payments...</div>
  }

  const paymentsArray: Payment[] = Array.isArray(payments) ? payments : []

  const getStudentName = (student_id: string) => {
    const student = students?.find((s) => s.id === student_id)
    return student?.name ?? student_id
  }

  const isOverdue = (payment: Payment) => {
    if (!payment.paid_at) {
      const created = new Date(payment.created_at)
      const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays > 7
    }
    return false
  }

  // Filter, search, sort
  const displayedPayments = paymentsArray
    .filter((p) => {
      if (filter === 'pending') return !p.paid_at
      if (filter === 'completed') return !!p.paid_at
      return true
    })
    .filter((p) => {
      const studentName = getStudentName(p.student_id).toLowerCase()
      const refId = (p.reference_id || '').toLowerCase()
      const query = search.toLowerCase()
      return studentName.includes(query) || refId.includes(query)
    })
    .sort((a, b) => {
      let valA: string | number = ''
      let valB: string | number = ''

      switch (sortKey) {
        case 'amount':
          valA = a.amount
          valB = b.amount
          break
        case 'paid_at':
          valA = a.paid_at || ''
          valB = b.paid_at || ''
          break
        case 'status':
          valA = a.paid_at ? 1 : 0
          valB = b.paid_at ? 1 : 0
          break
      }

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })

  // Pagination
  const totalPages = Math.ceil(displayedPayments.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedPayments = displayedPayments.slice(startIdx, startIdx + itemsPerPage)

  const totalRevenue = paymentsArray.reduce((sum, p) => sum + (p.amount || 0), 0)
  const pendingPayments = paymentsArray.filter((p) => !p.paid_at)
  const completedPayments = paymentsArray.filter((p) => !!p.paid_at)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Manage and track payments</p>
      </div>

      {/* Summary Cards */}
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

      {/* Filters, Sort & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 space-y-2 md:space-y-0 md:space-x-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded ${
              filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded ${
              filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Completed
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search by student or reference ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-2 py-1 w-full md:w-64"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="border rounded px-2 py-1"
          >
            <option value="paid_at">Date</option>
            <option value="amount">Amount</option>
            <option value="status">Status</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="px-2 py-1 border rounded"
          >
            {sortAsc ? 'Asc' : 'Desc'}
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
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
            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No payments found
                </td>
              </tr>
            ) : (
              paginatedPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className={isOverdue(payment) ? 'bg-red-50' : undefined}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {students?.find((s) => s.id === payment.student_id)?.name || payment.student_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.paid_at ? formatDate(payment.paid_at) : 'Pending'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.paid_at
                          ? 'bg-green-100 text-green-800'
                          : isOverdue(payment)
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {payment.paid_at ? 'Paid' : isOverdue(payment) ? 'Overdue' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
