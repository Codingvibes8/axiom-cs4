/**
 * Shared Supabase / demo-mode configuration.
 *
 * Demo mode is opt-in via NEXT_PUBLIC_DEMO_MODE=true. It is also enabled
 * automatically for local development when Supabase is not configured, so a
 * fresh checkout stays usable. Production builds require the explicit flag.
 *
 * SECURITY: demo logins bypass real authentication. Never enable demo mode on
 * a deployment that holds real credentials.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
);

const demoFlag = process.env.NEXT_PUBLIC_DEMO_MODE;

export const isDemoMode =
  demoFlag === 'true' ||
  (demoFlag === undefined &&
    !isSupabaseConfigured &&
    process.env.NODE_ENV !== 'production');

/**
 * Only allow same-origin, path-only redirect targets. Prevents header-based
 * open redirects through the `?next=` parameter.
 */
export function safeRedirectPath(value: unknown, fallback = '/dashboard'): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('\\')) return fallback;
  return value;
}
