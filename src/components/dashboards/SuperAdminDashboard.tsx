import Button from '../../components/ui/Button'
import { AppUser } from '../../types'

export default function SuperAdminDashboard({ user }: { user: AppUser }) {
  return (
    <div className="p-6 bg-gradient-to-r from-gray-800 via-indigo-900 to-black min-h-screen rounded-xl text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Super Admin Console</h2>
          <p className="text-sm text-gray-300">Overview and global controls</p>
        </div>
        <div>
          <Button variant="secondary">Global Settings</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 p-6 rounded-lg">
          <h3 className="font-semibold text-lg">All Schools</h3>
          <p className="text-sm text-gray-300 mt-2">Manage and audit schools across the platform</p>
        </div>

        <div className="bg-white/5 p-6 rounded-lg">
          <h3 className="font-semibold text-lg">Platform Usage</h3>
          <p className="text-sm text-gray-300 mt-2">View usage metrics, messages, and system logs</p>
        </div>

        <div className="bg-white/5 p-6 rounded-lg">
          <h3 className="font-semibold text-lg">User Management</h3>
          <p className="text-sm text-gray-300 mt-2">Create top-level admins and manage access</p>
        </div>
      </div>
    </div>
  )
}
