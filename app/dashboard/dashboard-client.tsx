'use client';

import { DashboardShell } from '@/components/DashboardShell';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase';

export default function DashboardClientPage() {
  const router = useRouter();
  return (
    <DashboardShell
      onLogout={() => {
        signOut();
        router.push('/');
      }}
    />
  );
}
