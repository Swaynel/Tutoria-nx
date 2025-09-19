import { useState, useEffect } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'

interface SchoolSettings {
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

  useEffect(() => {
    const loadSchoolSettings = async () => {
      if (!user?.school_id) return
      
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('id', user.school_id)
          .single()

        if (error) throw error
        if (data) {
          setSettings(data)
        }
      } catch (error) {
        console.error('Error loading school settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSchoolSettings()
  }, [user?.school_id])

  const handleSave = async () => {
    if (!user?.school_id) return
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('schools')
        .update(settings)
        .eq('id', user.school_id)

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
    return <div className="p-6">Loading settings...</div>
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage school settings and preferences</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                School Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                School URL Slug
              </label>
              <input
                type="text"
                id="slug"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={settings.slug}
                onChange={(e) => setSettings({ ...settings, slug: e.target.value })}
                placeholder="school-name"
              />
              <p className="mt-1 text-sm text-gray-500">
                This will be used in your school`&apos;s URL: https://tuitora.com/school/{settings.slug || 'school-name'}
              </p>
            </div>

            <div>
              <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                Logo URL
              </label>
              <input
                type="url"
                id="logo"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={settings.logo_url}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}