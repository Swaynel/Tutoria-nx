import { AppUser } from '../../types'

export default function SchoolAdminDashboard({ user }: { user: AppUser }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">School Dashboard</h2>
      <p className="text-sm text-gray-600">Welcome, {user.full_name}</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">Students</div>
        <div className="bg-white p-4 rounded shadow">Attendance</div>
        <div className="bg-white p-4 rounded shadow">Payments</div>
      </div>
    </div>
  )
}
