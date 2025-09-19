import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AttendanceRecord } from '../types'

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAttendance() }, [fetchAttendance])

  const insertAttendance = async (record: Partial<AttendanceRecord>) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([record])
        .single()
      if (error) throw error
      setRecords(prev => [data as AttendanceRecord, ...prev])
      return data
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const updateAttendance = async (id: string, updates: Partial<AttendanceRecord>) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id)
        .single()
      if (error) throw error
      setRecords(prev => prev.map(r => r.id === id ? data as AttendanceRecord : r))
      return data
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const removeAttendance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id)
      if (error) throw error
      setRecords(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  return {
    records,
    loading,
    error,
    fetchAttendance,
    insertAttendance,
    updateAttendance,
    removeAttendance,
  }
}
