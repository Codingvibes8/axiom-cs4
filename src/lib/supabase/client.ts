import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config';

let browserClient: SupabaseClient | null = null;

/**
 * Browser Supabase client using cookie-based session storage via @supabase/ssr.
 * Returns null when Supabase is not configured (demo mode).
 */
export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (typeof window === 'undefined') {
    throw new Error('createClient() must only be called from client components');
  }
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}
