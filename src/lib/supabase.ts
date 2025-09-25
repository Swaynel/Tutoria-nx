// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// These are safe to access directly because they are public
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY! // Important!


if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Export a Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseServiceKey)
