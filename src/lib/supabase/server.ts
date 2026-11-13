import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config';
import { mapSupabaseUser } from '../auth-user';
import type { User } from '../types';

/**
 * Request-scoped server Supabase client. Never share this across requests.
 * Returns null when Supabase is not configured (demo mode).
 */
export async function createClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component where cookies are read-only.
          // Session refresh is handled by middleware instead.
        }
      },
    },
  });
}

/**
 * Server-side session check. Always verifies the JWT with Supabase Auth; never
 * trust a user object supplied by the browser.
 *
 * Returns null in demo mode (or when there is no valid session).
 */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;
    return mapSupabaseUser(user);
  } catch {
    // Network/auth failures fail closed: treat the session as unauthenticated.
    return null;
  }
}
