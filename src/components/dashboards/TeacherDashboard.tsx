import { AppUser } from '../../types'

export default function TeacherDashboard({ user }: { user: AppUser }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Teacher Dashboard</h2>
      <p className="text-sm text-gray-600">Welcome back, {user.full_name}</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">My Classes</div>
        <div className="bg-white p-4 rounded shadow">Mark Attendance</div>
      </div>
    </div>
  )
}
