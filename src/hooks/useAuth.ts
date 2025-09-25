import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AppUser } from '../types'

interface AuthResponse {
  success: boolean
  message?: string
  user?: AppUser | null
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  // 🔹 Load user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error.message)
      } else if (data.session?.user) {
        const sessionUser = data.session.user
        setUser({
          id: sessionUser.id,
          email: sessionUser.email ?? '',
          full_name: sessionUser.user_metadata?.full_name ?? '',
          role: sessionUser.user_metadata?.role ?? 'student',
          school_id: sessionUser.user_metadata?.school_id ?? undefined,
          created_at: sessionUser.created_at ?? '',
        })
      }
      setLoading(false)
    }

    fetchUser()

    // 🔹 Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const sessionUser = session.user
          setUser({
            id: sessionUser.id,
            email: sessionUser.email ?? '',
            full_name: sessionUser.user_metadata?.full_name ?? '',
            role: sessionUser.user_metadata?.role ?? 'student',
            school_id: sessionUser.user_metadata?.school_id ?? undefined,
            created_at: sessionUser.created_at ?? '',
          })
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 🔹 Sign up
  const signUp = async (
    email: string,
    password: string,
    full_name: string,
    schoolName: string
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name },
        },
      })

      if (error) throw error
      if (!data.user) throw new Error('User creation failed')

      const { data: schoolData, error: schoolError } = await supabase
        .from('schools')
        .insert([{ name: schoolName, slug: schoolName.toLowerCase().replace(/\s+/g, '-') }])
        .select()
        .single()

      if (schoolError) throw schoolError

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name,
          role: 'admin',
          school_id: schoolData.id,
        })

      if (profileError) throw profileError

      const newUser: AppUser = {
        id: data.user.id,
        email,
        full_name,
        role: 'school_admin',
        school_id: schoolData.id,
        created_at: data.user.created_at ?? '',
      }

      setUser(newUser)

      return { success: true, message: 'Sign up successful', user: newUser }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('SignUp Error:', message)
      return { success: false, message }
    }
  }

  // 🔹 Sign in
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (!data.user) throw new Error('Invalid credentials')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      const loggedInUser: AppUser = {
        id: data.user.id,
        email: data.user.email ?? '',
        full_name: profile.full_name,
        role: profile.role,
        school_id: profile.school_id,
        created_at: data.user.created_at ?? '',
      }

      setUser(loggedInUser)
      return { success: true, message: 'Sign in successful', user: loggedInUser }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('SignIn Error:', message)
      return { success: false, message }
    }
  }

  // 🔹 Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // 🔹 Refresh user
  const refreshUser = async () => {
    const { data } = await supabase.auth.getSession()
    const sessionUser = data.session?.user
    if (sessionUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .single()

      if (profile) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email ?? '',
          full_name: profile.full_name,
          role: profile.role,
          school_id: profile.school_id,
          created_at: sessionUser.created_at ?? '',
        })
      }
    }
  }

  return { user, loading, signUp, signIn, signOut, refreshUser }
}
