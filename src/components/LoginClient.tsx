'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AuthPage } from './AuthPage';

export function LoginClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();

  return (
    <AuthPage
      onSuccess={() => {
        router.replace(nextPath);
        router.refresh();
      }}
      onBackToLanding={() => router.push('/')}
    />
  );
}
