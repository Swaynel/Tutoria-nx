// src/hooks/useStudents.ts

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Student } from '../types'

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const insertStudent = async (student: Partial<Student>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([student])
        .single()
      if (error) throw error
      setStudents(prev => [data as Student, ...prev])
      return data
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .single()
      if (error) throw error
      setStudents(prev => prev.map(s => s.id === id ? data as Student : s))
      return data
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const removeStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id)
      if (error) throw error
      setStudents(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  return {
    students,
    loading,
    error,
    fetchStudents,
    insertStudent,
    updateStudent,
    removeStudent,
  }
}
