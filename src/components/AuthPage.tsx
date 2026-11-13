'use client';

import React, { useState } from 'react';
import { useAxiomStore } from '@/lib/store';
import { UserRole } from '@/lib/types';
import { mapSupabaseUser } from '@/lib/auth-user';
import { createClient } from '@/lib/supabase/client';
import { isDemoMode, isSupabaseConfigured } from '@/lib/supabase/config';
import {
  Shield,
  ArrowRight,
  Lock,
  Mail,
  Zap,
  ChevronLeft,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
  onBackToLanding: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBackToLanding }) => {
  const { setCurrentUser, showToast } = useAxiomStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    if (!isSupabaseConfigured) {
      setError(
        isDemoMode
          ? 'Supabase Auth is not configured. Use demo access below, or add your Supabase credentials to .env.local.'
          : 'Authentication is not configured for this deployment.'
      );
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError('Authentication is not configured for this deployment.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        if (!data.user) {
          setError('Sign in failed. Please try again.');
          return;
        }

        const user = mapSupabaseUser(data.user);
        setCurrentUser(user);
        showToast(`Welcome back, ${user.name}`);
        onSuccess();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: name.trim() || trimmedEmail.split('@')[0] },
          emailRedirectTo:
            typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session && data.user) {
        const user = mapSupabaseUser(data.user);
        setCurrentUser(user);
        showToast('Account created');
        onSuccess();
        return;
      }

      setNotice('Check your email to confirm your account, then sign in.');
      setMode('signin');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole, demoName: string, demoEmail: string) => {
    if (!isDemoMode) return;

    setCurrentUser({
      id: `usr_demo_${role}`,
      name: demoName,
      email: demoEmail,
      role,
    });
    showToast(`Logged in as ${demoName} (${role.toUpperCase()}) — demo data only`);
    onSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 bg-grid-pattern relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Back link */}
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Axiom Overview</span>
        </button>

        {/* Card Frame */}
        <div className="glass-panel-elevated p-8 rounded-3xl border border-zinc-800 bg-zinc-900/90 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <Shield className="w-6 h-6 text-zinc-950 font-black" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              {mode === 'signin' ? 'Sign in to Axiom Vault' : 'Create an Account'}
            </h2>
            <p className="text-xs text-zinc-400">
              Developer Secrets Management & AI Agent Harness
            </p>
          </div>

          {/* Demo-mode warning */}
          {isDemoMode && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Demo mode. Logins are not verified and data is stored locally. Never enter real
                credentials.
              </span>
            </div>
          )}

          {/* Quick 1-Click Demo Profiles */}
          {isDemoMode && (
            <>
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/25 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                    Instant 1-Click Demo Access
                  </span>
                  <span className="text-[10px] text-zinc-500">No pass needed</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('owner', 'Alex Mercer', 'alex@axiom.dev')}
                    className="p-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-500/30 text-center transition-all group"
                  >
                    <div className="text-[11px] font-bold text-white group-hover:text-emerald-200">
                      Owner
                    </div>
                    <div className="text-[9px] text-zinc-400">Full Privileges</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickDemoLogin('admin', 'Sarah Chen', 'sarah.sec@axiom.dev')
                    }
                    className="p-2 rounded-xl bg-teal-600/15 hover:bg-teal-600/30 border border-teal-500/30 text-center transition-all group"
                  >
                    <div className="text-[11px] font-bold text-white group-hover:text-teal-200">
                      SecOps
                    </div>
                    <div className="text-[9px] text-zinc-400">Audit & KMS</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickDemoLogin('developer', 'Marcus Vance', 'marcus.v@axiom.dev')
                    }
                    className="p-2 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/30 border border-cyan-500/30 text-center transition-all group"
                  >
                    <div className="text-[11px] font-bold text-white group-hover:text-cyan-200">
                      Developer
                    </div>
                    <div className="text-[9px] text-zinc-400">Dev & Staging</div>
                  </button>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-zinc-900 px-3 text-[10px] text-zinc-500 uppercase font-bold tracking-widest absolute">
                  Or continue with email
                </span>
              </div>
            </>
          )}

          {/* Feedback */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-200"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-200"
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-zinc-300 mb-1.5"
                >
                  FULL NAME
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-sm border-zinc-800 focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="developer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-sm border-zinc-800 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-zinc-300 mb-1.5"
              >
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-sm border-zinc-800 focus:border-emerald-500"
                />
              </div>
              {mode === 'signup' && (
                <p className="mt-1 text-[10px] text-zinc-500">Minimum 8 characters.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>
                {loading
                  ? 'Authenticating...'
                  : mode === 'signin'
                    ? 'Unlock Vault'
                    : 'Create Account'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch Mode */}
          <div className="text-center text-xs text-zinc-400">
            {mode === 'signin' ? (
              <span>
                Don&apos;t have an organization?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setNotice(null);
                  }}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setNotice(null);
                  }}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
