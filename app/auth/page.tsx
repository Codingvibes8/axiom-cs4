'use client';

import { AuthPage } from '@/components/AuthPage';
import { useRouter } from 'next/navigation';

export default function AuthPageRoute() {
  const router = useRouter();

  return (
    <AuthPage
      onSuccess={() => router.push('/dashboard')}
      onBackToLanding={() => router.push('/')}
    />
  );
}
