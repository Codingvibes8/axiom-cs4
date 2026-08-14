'use client';

import { DashboardShell } from '@/components/DashboardShell';
import { useRouter } from 'next/navigation';

export default function DashboardClientPage() {
  const router = useRouter();
  return <DashboardShell onLogout={() => router.push('/')} />;
}
