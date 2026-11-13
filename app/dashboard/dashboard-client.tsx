'use client';

import { useEffect } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { useRouter } from 'next/navigation';
import { useAxiomStore } from '@/lib/store';
import { signOut } from '@/lib/supabase';
import type { User } from '@/lib/types';

interface DashboardClientPageProps {
  /** Server-verified user from the Supabase session. Null in demo mode. */
  user?: User | null;
}

export default function DashboardClientPage({ user }: DashboardClientPageProps) {
  const router = useRouter();
  const { setCurrentUser, clearSession } = useAxiomStore();

  // Hydrate the client store from the server-verified session so a page reload
  // never falls back to demo/guest identity.
  useEffect(() => {
    if (user) setCurrentUser(user);
  }, [user, setCurrentUser]);

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      clearSession();
      router.replace('/login');
      router.refresh();
    }
  };

  return <DashboardShell onLogout={handleLogout} />;
}
