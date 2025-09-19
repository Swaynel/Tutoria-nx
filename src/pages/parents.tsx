import { useState, useEffect } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Parent {
  id: string
  email: string
  full_name: string
  phone: string
  created_at: string
}

export default function Parents() {
  const { user } = useAuthContext()
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadParents = async () => {
      if (!user?.school_id) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('school_id', user.school_id)
          .eq('role', 'parent')
          .order('full_name')

        if (error) throw error
        setParents(data || [])
      } catch (error) {
        console.error('Error loading parents:', error)
      } finally {
        setLoading(false)
      }
    }

    loadParents()
  }, [user?.school_id])

  if (loading) {
    return <div className="p-6">Loading parents...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parents</h1>
        <p className="text-gray-600">Manage parent contacts</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parents.map((parent) => (
                  <tr key={parent.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {parent.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parent.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parent.phone || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(parent.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}