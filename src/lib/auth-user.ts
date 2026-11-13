import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, UserRole } from './types';

const VALID_ROLES: UserRole[] = ['owner', 'admin', 'developer', 'viewer', 'agent'];

/**
 * Map a Supabase Auth user to the app's User shape.
 *
 * Only `app_metadata` is trusted for role assignment because it can only be
 * written by the service role. `user_metadata` is user-editable and must never
 * be used for authorization decisions.
 */
export function mapSupabaseUser(user: SupabaseUser): User {
  const appRole = user.app_metadata?.role;
  const role: UserRole = VALID_ROLES.includes(appRole as UserRole)
    ? (appRole as UserRole)
    : 'developer';

  const fullName = user.user_metadata?.full_name;
  const email = user.email ?? '';

  return {
    id: user.id,
    email,
    name:
      (typeof fullName === 'string' && fullName.trim()) ||
      email.split('@')[0] ||
      'Authenticated user',
    avatar_url:
      typeof user.user_metadata?.avatar_url === 'string'
        ? user.user_metadata.avatar_url
        : undefined,
    role,
  };
}
