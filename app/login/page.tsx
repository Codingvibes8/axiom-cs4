import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginClient } from '@/components/LoginClient';
import { isSupabaseConfigured, safeRedirectPath } from '@/lib/supabase/config';
import { getSessionUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Sign in | Axiom',
};

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = safeRedirectPath(
    Array.isArray(params.next) ? params.next[0] : params.next
  );

  if (isSupabaseConfigured) {
    const user = await getSessionUser();
    if (user) redirect(nextPath);
  }

  return <LoginClient nextPath={nextPath} />;
}
