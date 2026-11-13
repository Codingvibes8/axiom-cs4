'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAxiomStore } from '@/lib/store';
import { Environment } from '@/lib/types';
import { mapSupabaseUser } from '@/lib/auth-user';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { SecretsTab } from './SecretsTab';
import { DiffTab } from './DiffTab';
import { AgentHarnessTab } from './AgentHarnessTab';
import { TeamTab } from './TeamTab';
import { ActivityTab } from './ActivityTab';
import { SettingsTab } from './SettingsTab';
import { 
  Shield, 
  Key, 
  GitCompare, 
  Bot, 
  Users, 
  Activity, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Menu,
  X
} from 'lucide-react';

interface DashboardShellProps {
  onLogout?: () => void;
}

export const DashboardShell: React.FC<DashboardShellProps> = () => {
  const router = useRouter();
  const { 
    currentUser, 
    setCurrentUser,
    clearSession,
    currentProject, 
    currentEnv, 
    setCurrentEnv, 
    activeTab, 
    setActiveTab, 
    secrets, 
    agents, 
    toastMessage 
  } = useAxiomStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hydrate the client store with the server-verified Supabase identity.
  // Authorization still happens server-side and (later) in RLS.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const supabase = createClient();
    if (!supabase) return;

    let active = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (active && data.user) setCurrentUser(mapSupabaseUser(data.user));
      })
      .catch(() => {
        // The route guard will handle a missing/invalid session.
      });

    return () => {
      active = false;
    };
  }, [setCurrentUser]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      if (supabase) await supabase.auth.signOut();
    } catch (error) {
      console.warn('Failed to revoke Supabase session:', error);
    } finally {
      clearSession();
      router.replace('/login');
      router.refresh();
    }
  };

  const envs: { id: Environment; label: string; color: string }[] = [
    { id: 'development', label: 'Dev', color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' },
    { id: 'staging', label: 'Staging', color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
    { id: 'production', label: 'Production', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  ];

  const navItems = [
    { id: 'secrets' as const, label: 'Secrets Vault', icon: Key, badge: secrets.filter(s => s.environment === currentEnv).length },
    { id: 'diff' as const, label: 'Environment Diff', icon: GitCompare },
    { id: 'agents' as const, label: 'AI Agent Harness', icon: Bot, badge: agents.length, glow: true },
    { id: 'team' as const, label: 'Team & RBAC', icon: Users },
    { id: 'activity' as const, label: 'Activity Audit', icon: Activity },
    { id: 'settings' as const, label: 'Settings & KMS', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-950 text-zinc-100 font-sans">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Shield className="w-5 h-5 text-zinc-950 font-black" />
          </div>
          <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
            AXIOM
          </span>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 glass-panel border-r border-zinc-800/80 z-40 flex flex-col justify-between p-5 transition-transform duration-300 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 bg-zinc-900' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Shield className="w-5 h-5 text-zinc-950 font-black" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
                  AXIOM
                </span>
                <span className="block text-[9px] font-mono text-emerald-400 uppercase tracking-widest -mt-1">
                  SECRETS & AGENT VAULT
                </span>
              </div>
            </div>
          </div>

          {/* Project Selector Box */}
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Active Project
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="truncate">{currentProject.name}</span>
              <span className="text-[10px] text-emerald-400 font-mono">v2.4</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.glow ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Exit */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-xs text-zinc-950 shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-zinc-400 capitalize">{currentUser.role}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Dashboard Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        {/* Top Header */}
        <header className="sticky top-0 z-30 glass-panel border-b border-zinc-800 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white capitalize flex items-center gap-2">
              <span>{navItems.find((n) => n.id === activeTab)?.label}</span>
              <span className="text-xs font-mono font-normal text-zinc-400">
                / {currentProject.slug}
              </span>
            </h1>
          </div>

          {/* Environment Switcher */}
          <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2">
              Env:
            </span>
            {envs.map((env) => (
              <button
                key={env.id}
                onClick={() => setCurrentEnv(env.id)}
                className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
                  currentEnv === env.id
                    ? `${env.color} border shadow-md`
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {env.label}
              </button>
            ))}
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6 flex-1 max-w-7xl w-full mx-auto">
          {activeTab === 'secrets' && <SecretsTab />}
          {activeTab === 'diff' && <DiffTab />}
          {activeTab === 'agents' && <AgentHarnessTab />}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </main>

      {/* Floating Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="glass-panel-elevated px-4 py-3 rounded-xl border border-emerald-500/40 text-xs font-semibold text-white shadow-2xl flex items-center gap-2.5 bg-zinc-900/95">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
