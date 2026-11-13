import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getSessionUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Dashboard | Axiom',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // Defence in depth: middleware also guards this route.
  if (isSupabaseConfigured) {
    const user = await getSessionUser();
    if (!user) redirect('/login?next=/dashboard');
  }

  return <DashboardShell />;
}
