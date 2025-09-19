import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// Ensure T has an 'id' field
export function useSupabaseData<T extends { id: string }>(
  table: string,
  dependencies: React.DependencyList = []
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize the dependencies array
  const deps = useMemo(() => dependencies, [dependencies])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: result, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setData(result || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [table])

  // Use memoized deps in useEffect
  useEffect(() => {
    fetchData()
  }, [fetchData, deps]) // ✅ no spread, ESLint happy

  const insert = async (item: Partial<T>) => {
    try {
      const { data: result, error: insertError } = await supabase
        .from(table)
        .insert([item])
        .single()

      if (insertError) throw insertError
      setData(prev => [result as T, ...prev])
      return result
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const update = async (id: string, updates: Partial<T>) => {
    try {
      const { data: result, error: updateError } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .single()

      if (updateError) throw updateError
      setData(prev => prev.map(item => item.id === id ? result as T : item))
      return result
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const remove = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      setData(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  return { data, loading, error, insert, update, remove, refetch: fetchData }
}
