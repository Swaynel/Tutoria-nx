// src/hooks/useMessages.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Message } from '../types'

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  const insertMessage = async (message: Partial<Message>) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .single()
      if (error) throw error
      setMessages(prev => [data as Message, ...prev])
      return data
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const updateMessage = async (id: string, updates: Partial<Message>) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', id)
        .single()
      if (error) throw error
      setMessages(prev => prev.map(m => m.id === id ? data as Message : m))
      return data
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  const removeMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)
      if (error) throw error
      setMessages(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      setError((err as Error).message)
      throw err
    }
  }

  return {
    messages,
    loading,
    error,
    fetchMessages,
    insertMessage,
    updateMessage,
    removeMessage,
  }
}
