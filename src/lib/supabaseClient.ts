// src/lib/supabaseClient.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

let supabaseInstance: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and/or Anon Key are missing from .env.local")
  }

  console.log("Creating a new Supabase client instance.");
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

// This function will be called on window focus
export const resetSupabaseClient = () => {
    // This effectively throws away the old, broken client.
    // The next call to getSupabase() will create a new, fresh one.
    if (supabaseInstance) {
        console.log("Resetting Supabase client instance.");
        supabaseInstance = null;
    }
}