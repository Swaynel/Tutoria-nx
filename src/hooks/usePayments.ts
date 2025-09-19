// src/hooks/usePayments.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Payment } from '../types'

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  const insertPayment = async (payment: Partial<Payment>) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([payment])
        .single()
      if (error) throw error
      setPayments(prev => [data as Payment, ...prev])
      return data
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .single()
      if (error) throw error
      setPayments(prev => prev.map(p => p.id === id ? data as Payment : p))
      return data
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const removePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)
      if (error) throw error
      setPayments(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  return {
    payments,
    loading,
    error,
    fetchPayments,
    insertPayment,
    updatePayment,
    removePayment,
  }
}
