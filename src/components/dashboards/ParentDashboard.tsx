import { AppUser } from '../../types'

export default function ParentDashboard({ user }: { user: AppUser }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Parent Dashboard</h2>
      <p className="text-sm text-gray-600">Hello, {user.full_name}</p>
      <div className="mt-6 grid grid-cols-1 gap-4">
        <div className="bg-white p-4 rounded shadow">My Children</div>
        <div className="bg-white p-4 rounded shadow">Payments & Receipts</div>
      </div>
    </div>
  )
}
