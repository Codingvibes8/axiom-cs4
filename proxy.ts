import { createServerClient } from '@supabase/ssr';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import {
  isSupabaseConfigured,
  safeRedirectPath,
  supabaseAnonKey,
  supabaseUrl,
} from '@/lib/supabase/config';

/**
 * Refreshes the Supabase session on every protected navigation and enforces
 * server-side route protection. When Supabase is not configured (demo mode)
 * requests pass through unchanged.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() validates the JWT with the Auth server; do not use getSession().
  // Fail closed: a lookup failure is treated as unauthenticated.
  let user: SupabaseAuthUser | null = null;
  try {
    const {
      data: { user: verifiedUser },
    } = await supabase.auth.getUser();
    user = verifiedUser;
  } catch {
    user = null;
  }

  const { pathname, search } = request.nextUrl;
  const isLoginRoute = pathname === '/login';

  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', safeRedirectPath(`${pathname}${search}`));
    return NextResponse.redirect(url);
  }

  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
