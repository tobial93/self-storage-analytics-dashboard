import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to set custom JWT from Clerk
export const setSupabaseAuth = async (token: string) => {
  const { data, error } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: '', // Not needed when using custom JWT
  });

  if (error) {
    console.error('Error setting Supabase session:', error);
    throw error;
  }

  return data;
};
