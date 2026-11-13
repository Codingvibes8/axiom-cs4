import { createClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import type { User as AxiomUser, UserRole } from './types';
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './supabase/config';

export { isSupabaseConfigured };

const VALID_ROLES: UserRole[] = ['owner', 'admin', 'developer', 'viewer', 'agent'];

/**
 * Only `app_metadata` is trusted for authorization because it can only be
 * written with the service role. `user_metadata` is user-editable.
 */
function roleFromAppMetadata(user: SupabaseUser): UserRole {
  const role = user.app_metadata?.role;
  return VALID_ROLES.includes(role as UserRole) ? (role as UserRole) : 'developer';
}

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
    role: roleFromAppMetadata(user),
    twoFactorEnabled: hasVerifiedTotpFactor(user),
  };
}

// ---------------------------------------------------------------------------
// Two-Factor Authentication (TOTP) helpers
// ---------------------------------------------------------------------------

/** Returns true if the user has at least one verified TOTP factor enrolled. */
export function hasVerifiedTotpFactor(user: SupabaseUser | null): boolean {
  if (!user) return false;
  const factors = user.factors ?? [];
  return factors.some(
    (f) => f.factor_type === 'totp' && f.status === 'verified'
  );
}

/** Enroll a new TOTP factor. Returns the factor id, QR code SVG and secret. */
export async function enrollTotpFactor(friendlyName?: string) {
  if (!supabaseBrowser) return { data: null, error: new Error('Supabase is not configured') };
  return supabaseBrowser.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: friendlyName || 'Axiom Vault',
  });
}

/** Create a challenge for the given factor id. */
export async function challengeTotpFactor(factorId: string) {
  if (!supabaseBrowser) return { data: null, error: new Error('Supabase is not configured') };
  return supabaseBrowser.auth.mfa.challenge({ factorId });
}

/** Verify a challenge with the 6-digit TOTP code. */
export async function verifyTotpChallenge(factorId: string, challengeId: string, code: string) {
  if (!supabaseBrowser) return { data: null, error: new Error('Supabase is not configured') };
  return supabaseBrowser.auth.mfa.verify({ factorId, challengeId, code });
}

/** Unenroll (remove) a TOTP factor. */
export async function unenrollTotpFactor(factorId: string) {
  if (!supabaseBrowser) return { data: null, error: new Error('Supabase is not configured') };
  return supabaseBrowser.auth.mfa.unenroll({ factorId });
}

/** List all enrolled factors for the current user. */
export async function listFactors() {
  if (!supabaseBrowser) return { data: null, error: new Error('Supabase is not configured') };
  return supabaseBrowser.auth.mfa.listFactors();
}

/** Get the current Authenticator Assurance Level. */
export async function getAAL() {
  if (!supabaseBrowser) return { data: null, error: new Error('Supabase is not configured') };
  return supabaseBrowser.auth.mfa.getAuthenticatorAssuranceLevel();
}
