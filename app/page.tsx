'use client';

import { useRouter } from 'next/navigation';
import { LandingPage } from '@/components/LandingPage';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#090d16]">
      <LandingPage onEnterApp={() => router.push('/login')} />
    </div>
  );
}
