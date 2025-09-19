// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { AppUser } from '../types'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

interface AuthResponse {
  success: boolean
  message?: string
  user?: AppUser
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = useCallback(async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (data) setUser(data as AppUser)
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching user profile:', error.message)
      } else {
        console.error('Unknown error fetching user profile:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshUser = useCallback(async (): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await fetchUserProfile(session.user.id)
    } else {
      setUser(null)
    }
  }, [fetchUserProfile])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    schoolName: string
  ): Promise<AuthResponse> => {
    try {
      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert([{ name: schoolName, slug: schoolName.toLowerCase().replace(/\s+/g, '-') }])
        .select()
        .single()

      if (schoolError) throw schoolError

      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError
      if (!user) throw new Error('User not returned after sign up')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            email,
            full_name: fullName,
            role: 'school_admin',
            school_id: schoolData.id,
          },
        ])

      if (profileError) throw profileError

      await refreshUser()

      return { success: true, user: user as AppUser, message: 'Sign up successful' }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error signing up:', error.message)
        return { success: false, message: error.message }
      }
      console.error('Unknown error during sign up:', error)
      return { success: false, message: 'An unknown error occurred during sign up' }
    }
  }

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (!user) throw new Error('No user returned after sign in')

      await refreshUser()
      return { success: true, user: user as AppUser, message: 'Sign in successful' }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error signing in:', error.message)
        return { success: false, message: error.message }
      }
      console.error('Unknown error during sign in:', error)
      return { success: false, message: 'An unknown error occurred during sign in' }
    }
  }

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
  }

  return { user, loading, signUp, signIn, signOut, refreshUser }
}
