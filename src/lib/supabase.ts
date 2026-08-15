import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import type { User as AxiomUser } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

// Server-side client (used by API routes). Not used for browser auth.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Browser client backed by cookies so Google OAuth (PKCE) sessions persist
// across the redirect back from Google.
export const supabaseBrowser = isSupabaseConfigured
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null;

export function signInWithGoogle(redirectTo: string = '/auth/callback') {
  if (!supabaseBrowser) return Promise.resolve(null);
  return supabaseBrowser.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}${redirectTo}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
}

export async function signOut() {
  if (!supabaseBrowser) return;
  await supabaseBrowser.auth.signOut();
}

export function mapSupabaseUserToAppUser(user: SupabaseUser | null): AxiomUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  const fullName = meta.full_name ?? meta.name ?? null;
  const avatar = meta.avatar_url ?? meta.picture ?? null;
  return {
    id: user.id,
    email: user.email ?? '',
    name: fullName || (user.email ?? 'Axiom User').split('@')[0],
    avatar_url: avatar ?? undefined,
    role: 'owner',
  };
}
