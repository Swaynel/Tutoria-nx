import { useState, useEffect } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'

interface SchoolSettings {
  id?: string
  name: string
  slug: string
  logo_url: string
}

export default function Settings() {
  const { user } = useAuthContext()
  const [settings, setSettings] = useState<SchoolSettings>({
    name: '',
    slug: '',
    logo_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schools, setSchools] = useState<SchoolSettings[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null)

  const isSuperAdmin = user?.role === 'superadmin'
  const isSchoolAdmin = user?.role === 'school_admin'
  const canEdit = isSuperAdmin || isSchoolAdmin

  useEffect(() => {
    const load = async () => {
      try {
        // Superadmin: load list of schools to manage
        if (isSuperAdmin) {
          const { data, error } = await supabase.from('schools').select('id, name, slug, logo_url')
          if (error) throw error
          setSchools((data || []) as SchoolSettings[])
        }

        // Determine which school to load: superadmin may pick, otherwise use user's school
        const schoolIdToLoad = isSuperAdmin ? null : user?.school_id || null
        if (!schoolIdToLoad && isSuperAdmin) {
          // default to first school if available
          setLoading(false)
          return
        }

        const idToQuery = schoolIdToLoad || user?.school_id
            if (idToQuery) {
              const { data, error } = await supabase.from('schools').select('*').eq('id', idToQuery).single()
              if (error) throw error
              setSettings(data)
              // data's shape should match SchoolSettings; cast accordingly to avoid `any`
              const d = data as SchoolSettings | null
              setSelectedSchoolId((d && d.id) || null)
            }
      } catch (err) {
        console.error('Error loading settings:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user?.school_id, isSuperAdmin])

  const handleSelectSchool = async (id: string) => {
    setSelectedSchoolId(id)
    setLoading(true)
    try {
      const { data, error } = await supabase.from('schools').select('*').eq('id', id).single()
      if (error) throw error
      setSettings(data)
    } catch (err) {
      console.error('Error selecting school:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Only allow superadmin (for chosen school) or school_admin (for their school)
    if (!canEdit) return

    const id = selectedSchoolId || user?.school_id
    if (!id) {
      alert('No school selected to save')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: settings.name,
        slug: settings.slug,
        logo_url: settings.logo_url
      }

      const { error } = await supabase.from('schools').update(payload).eq('id', id)
      if (error) throw error
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-emerald-300">Loading settings...</div>
  }

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-gray-200">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-emerald-300">Manage school settings and preferences</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {isSuperAdmin && (
              <div>
                <label htmlFor="school" className="block text-sm font-medium text-gray-300">Select School to Manage</label>
                <select
                  id="school"
                  className="mt-1 block w-full rounded-md bg-gray-900 border-gray-700 text-gray-100"
                  value={selectedSchoolId || ''}
                  onChange={(e) => handleSelectSchool(e.target.value)}
                >
                  <option value="">-- Select a school --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                School Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                disabled={!canEdit}
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-300">
                School URL Slug
              </label>
              <input
                type="text"
                id="slug"
                className="mt-1 block w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={settings.slug}
                onChange={(e) => setSettings({ ...settings, slug: e.target.value })}
                placeholder="school-name"
                disabled={!canEdit}
              />
              <p className="mt-1 text-sm text-gray-400">
                This will be used in your school&apos;s URL: https://tuitora.com/school/{settings.slug || 'school-name'}
              </p>
            </div>

            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-300">
                Logo URL
              </label>
              <input
                type="url"
                id="logo"
                className="mt-1 block w-full rounded-md bg-gray-900 border border-gray-700 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={settings.logo_url}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSave}
                disabled={!canEdit || saving}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500"
              >
                {saving ? 'Saving...' : canEdit ? 'Save Settings' : 'View Only'}
              </Button>
              {!canEdit && (
                <p className="text-sm text-gray-400">You do not have permission to edit these settings.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}