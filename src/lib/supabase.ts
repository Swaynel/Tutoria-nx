// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

// Client-side safe Supabase
export const supabase = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : undefined

// Server-side/admin Supabase
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : undefined

/**
 * Helper function to choose the right client
 * - Use supabase for browser/public requests
 * - Use supabaseAdmin for server-side tasks (RLS bypass)
 */
export const getSupabaseClient = (serverSide = false) => {
  if (serverSide) {
    if (!supabaseAdmin) throw new Error('Server Supabase client not initialized')
    return supabaseAdmin
  }
  if (!supabase) throw new Error('Client Supabase not initialized')
  return supabase
}
