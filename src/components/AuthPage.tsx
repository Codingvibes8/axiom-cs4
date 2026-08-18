'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAxiomStore } from '@/lib/store';
import { UserRole, User as AxiomUser } from '@/lib/types';
import {
  supabaseBrowser,
  signInWithGoogle,
  signOut,
  mapSupabaseUserToAppUser,
  hasVerifiedTotpFactor,
  getAAL,
} from '@/lib/supabase';
import { TwoFactorVerify } from './TwoFactorVerify';
import {
  Shield,
  ArrowRight,
  Lock,
  Mail,
  Zap,
  ChevronLeft,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
  onBackToLanding: () => void;
}

type AuthView = 'main' | 'twofa' | 'demo2fa';

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onBackToLanding }) => {
  const { setCurrentUser, showToast } = useAxiomStore();

  const [view, setView] = useState<AuthView>('main');
  const [pendingAppUser, setPendingAppUser] = useState<AxiomUser | null>(null);
  const [demoCode, setDemoCode] = useState('');
  const [demoCodeInput, setDemoCodeInput] = useState('');

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  // Guards to prevent double-processing of session events
  const loginCompletedRef = useRef(false);
  const mfaPromptedRef = useRef(false);

  const completeLogin = (appUser: AxiomUser) => {
    loginCompletedRef.current = true;
    setCurrentUser(appUser);
    showToast(`Signed in as ${appUser.name}`);
    onSuccessRef.current();
  };

  const startDemo2FA = (appUser: AxiomUser) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoCode(code);
    setDemoCodeInput('');
    setPendingAppUser(appUser);
    setView('demo2fa');
  };

  // Restore an existing Supabase session (e.g. after Google OAuth redirect)
  useEffect(() => {
    const browser = supabaseBrowser;
    if (!browser) return;

    let active = true;

    const evaluateSession = (sessionUserId?: string) => {
      if (loginCompletedRef.current) return;

      browser.auth.getUser().then(({ data }) => {
        if (!active || !data.user) return;
        const appUser = mapSupabaseUserToAppUser(data.user);
        if (!appUser) return;
        if (sessionUserId && sessionUserId !== data.user.id) return;

        const hasTotp = hasVerifiedTotpFactor(data.user);
        if (!hasTotp) {
          completeLogin(appUser);
          return;
        }

        // User has a TOTP factor — only proceed if already at AAL2, else prompt 2FA
        getAAL().then(({ data: aalData }) => {
          if (!active || loginCompletedRef.current) return;
          const level = aalData?.currentLevel;
          if (level === 'aal2') {
            completeLogin(appUser);
          } else if (!mfaPromptedRef.current) {
            mfaPromptedRef.current = true;
            setPendingAppUser(appUser);
            setView('twofa');
          }
        });
      });
    };

    browser.auth.getSession().then(({ data }) => {
      if (!active || !data.session) return;
      evaluateSession(data.session.user.id);
    });

    const { data: subscription } = browser.auth.onAuthStateChange((_event, session) => {
      if (!active || !session) return;
      evaluateSession(session.user.id);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentUser, showToast]);

  // Surface OAuth errors (e.g. provider not enabled) passed via ?error=
  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error');
    if (error) {
      showToast(error);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [showToast]);

  const handleGoogleSignIn = async () => {
    if (!supabaseBrowser) {
      showToast('Supabase is not configured. Add credentials and enable the Google provider.');
      return;
    }
    setGoogleLoading(true);
    try {
      const { error } = (await signInWithGoogle()) ?? { error: null };
      if (error) {
        showToast(error.message);
        setGoogleLoading(false);
      }
    } catch (e) {
      console.error('Google sign-in error:', e);
      showToast('Google sign-in failed. Check Supabase Google provider settings.');
      setGoogleLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    if (supabaseBrowser) {
      try {
        if (mode === 'signin') {
          const { data, error } = await supabaseBrowser.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (error) {
            showToast(error.message);
            setLoading(false);
            return;
          }
          const appUser = mapSupabaseUserToAppUser(data.user);
          if (!appUser) {
            showToast('Sign-in failed.');
            setLoading(false);
            return;
          }
          if (hasVerifiedTotpFactor(data.user)) {
            mfaPromptedRef.current = true;
            setPendingAppUser(appUser);
            setView('twofa');
          } else {
            completeLogin(appUser);
          }
        } else {
          const { data, error } = await supabaseBrowser.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: name.trim() } },
          });
          if (error) {
            showToast(error.message);
            setLoading(false);
            return;
          }
          if (data.session && data.user) {
            const appUser = mapSupabaseUserToAppUser(data.user);
            if (appUser) completeLogin(appUser);
          } else {
            showToast('Account created. Check your email to confirm, then sign in.');
            setMode('signin');
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
        showToast('Authentication failed. Check your Supabase configuration.');
      }
      setLoading(false);
      return;
    }

    // Supabase not configured — demo flow with simulated 2FA
    const mockUser: AxiomUser = {
      id: `usr_${Date.now()}`,
      email: email.trim(),
      name: name.trim() || email.split('@')[0],
      role: 'owner',
    };
    setLoading(false);
    startDemo2FA(mockUser);
  };

  const handleQuickDemoLogin = (role: UserRole, demoName: string, demoEmail: string) => {
    const demoUser: AxiomUser = {
      id: `usr_demo_${role}`,
      name: demoName,
      email: demoEmail,
      role,
    };
    startDemo2FA(demoUser);
  };

  const handleTwoFactorBack = () => {
    signOut();
    setPendingAppUser(null);
    mfaPromptedRef.current = false;
    setView('main');
  };

  const handleDemoVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAppUser) return;
    if (demoCodeInput === demoCode) {
      completeLogin({ ...pendingAppUser, twoFactorEnabled: true });
    } else {
      showToast('Invalid demo code. Please try again.');
    }
  };

  // ---------------------------------------------------------------------------
  // Real 2FA verification view (Supabase TOTP)
  // ---------------------------------------------------------------------------
  if (view === 'twofa' && pendingAppUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 bg-grid-pattern relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <div className="glass-panel-elevated p-8 rounded-3xl border border-zinc-800 bg-zinc-900/90">
            <TwoFactorVerify
              onSuccess={() => completeLogin({ ...pendingAppUser, twoFactorEnabled: true })}
              onBack={handleTwoFactorBack}
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Simulated 2FA view (demo / unconfigured Supabase)
  // ---------------------------------------------------------------------------
  if (view === 'demo2fa' && pendingAppUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 bg-grid-pattern relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <div className="glass-panel-elevated p-8 rounded-3xl border border-zinc-800 bg-zinc-900/90 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-zinc-950 font-black" />
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Two-Factor Verification
              </h2>
              <p className="text-xs text-zinc-400">
                Demo mode — enter the one-time code shown below
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Your demo one-time code
              </p>
              <p className="text-3xl font-mono font-black tracking-[0.4em] text-white">
                {demoCode}
              </p>
            </div>

            <form onSubmit={handleDemoVerify} className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 justify-center">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Enter code</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={demoCodeInput}
                onChange={(e) => setDemoCodeInput(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none placeholder:text-zinc-700"
                autoFocus
              />
              <button
                type="submit"
                disabled={demoCodeInput.length !== 6}
                className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Verify & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setPendingAppUser(null);
                  setView('main');
                }}
                className="w-full py-2 px-4 text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back to sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main sign-in / sign-up view
  // ---------------------------------------------------------------------------
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

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider bg-white hover:bg-zinc-100 disabled:opacity-60 disabled:cursor-wait text-zinc-900 rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-zinc-950/40"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>{googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-800 w-full" />
            <span className="bg-zinc-900 px-3 text-[10px] text-zinc-500 uppercase font-bold tracking-widest absolute">
              Or
            </span>
          </div>

          {/* Quick 1-Click Demo Profiles */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/25 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                Instant 1-Click Demo Access
              </span>
              <span className="text-[10px] text-zinc-500">2FA simulated</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('owner', 'Alex Mercer', 'alex@axiom.dev')}
                className="p-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-500/30 text-center transition-all group"
              >
                <div className="text-[11px] font-bold text-white group-hover:text-emerald-200">Owner</div>
                <div className="text-[9px] text-zinc-400">Full Privileges</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin', 'Sarah Chen', 'sarah.sec@axiom.dev')}
                className="p-2 rounded-xl bg-teal-600/15 hover:bg-teal-600/30 border border-teal-500/30 text-center transition-all group"
              >
                <div className="text-[11px] font-bold text-white group-hover:text-teal-200">SecOps</div>
                <div className="text-[9px] text-zinc-400">Audit & KMS</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('developer', 'Marcus Vance', 'marcus.v@axiom.dev')}
                className="p-2 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/30 border border-cyan-500/30 text-center transition-all group"
              >
                <div className="text-[11px] font-bold text-white group-hover:text-cyan-200">Developer</div>
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

          {/* Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  FULL NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex Mercer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-sm border-zinc-800 focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="developer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-sm border-zinc-800 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input w-full pl-9 pr-3 py-2 rounded-xl text-sm border-zinc-800 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Unlock Vault' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch Mode */}
          <div className="text-center text-xs text-zinc-400">
            {mode === 'signin' ? (
              <span>
                Don't have an organization?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Create one now
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
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
