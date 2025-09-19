import { useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { UserRole } from '../../types'

interface AddUserModalProps {
  onClose: () => void
}

export default function AddUserModal({ onClose }: AddUserModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('teacher')
  const [isCreating, setIsCreating] = useState(false)
  const { user: currentUser } = useAuthContext()

  const handleSubmit = async () => {
    if (!fullName || !email || !password || !currentUser) return

    setIsCreating(true)
    try {
      // Create auth user (Supabase v2)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError
      const authUser = data.user
      if (!authUser) throw new Error('Failed to retrieve new user from Supabase.')

      // Create profile in "profiles" table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authUser.id,
            email,
            full_name: fullName,
            role,
            school_id: currentUser.school_id,
          },
        ])

      if (profileError) throw profileError

      // Send welcome message via API
      await fetch('/api/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: fullName,
          role,
          school: currentUser.school_id,
        }),
      })

      onClose()
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Add User</h2>

      <div className="mb-4">
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role
        </label>
        <select
          id="role"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="teacher">Teacher</option>
          <option value="school_admin">School Admin</option>
          <option value="parent">Parent</option>
          <option value="student">Student</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          onClick={onClose}
          disabled={isCreating}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={isCreating || !fullName || !email || !password}
        >
          {isCreating ? 'Creating...' : 'Create User'}
        </button>
      </div>
    </div>
  )
}
