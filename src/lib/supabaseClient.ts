// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types' // We will create this file next

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and/or Anon Key are missing from .env.local")
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)