'use client';

import React, { useState } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { AuthPage } from '@/components/AuthPage';
import { DashboardShell } from '@/components/DashboardShell';

export default function HomePage() {
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard'>('dashboard');

  return (
    <div className="min-h-screen bg-[#090d16]">
      {view === 'landing' && (
        <LandingPage onEnterApp={() => setView('auth')} />
      )}

      {view === 'auth' && (
        <AuthPage 
          onSuccess={() => setView('dashboard')} 
          onBackToLanding={() => setView('landing')} 
        />
      )}

      {view === 'dashboard' && (
        <DashboardShell onLogout={() => setView('landing')} />
      )}
    </div>
  );
}
