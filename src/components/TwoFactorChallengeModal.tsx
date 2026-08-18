'use client';

import React, { useState, useEffect } from 'react';
import {
  listFactors,
  challengeTotpFactor,
  verifyTotpChallenge,
  isSupabaseConfigured,
} from '@/lib/supabase';
import { ShieldCheck, KeyRound, Loader2, X, Info } from 'lucide-react';

interface TwoFactorChallengeModalProps {
  onClose: () => void;
  onVerified: () => void;
}

export const TwoFactorChallengeModal: React.FC<TwoFactorChallengeModalProps> = ({
  onClose,
  onVerified,
}) => {
  const isDemo = !isSupabaseConfigured;
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(isDemo ? false : true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find the verified TOTP factor and create a fresh challenge
  useEffect(() => {
    let active = true;

    if (isDemo) {
      return () => {
        active = false;
      };
    }

    listFactors().then(({ data, error: listError }) => {
      if (!active) return;
      if (listError || !data) {
        setError(listError?.message || 'Failed to load 2FA factors.');
        setLoading(false);
        return;
      }

      const totpFactor = data.all.find(
        (f) => f.factor_type === 'totp' && f.status === 'verified'
      );

      if (!totpFactor) {
        setError('No verified TOTP factor found. Please re-enable 2FA.');
        setLoading(false);
        return;
      }

      setFactorId(totpFactor.id);

      challengeTotpFactor(totpFactor.id).then(({ data: chData, error: chError }) => {
        if (!active) return;
        if (chError || !chData) {
          setError(chError?.message || 'Failed to create verification challenge.');
          setLoading(false);
          return;
        }
        setChallengeId(chData.id);
        setLoading(false);
      });
    });

    return () => {
      active = false;
    };
  }, [isDemo]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    setVerifying(true);
    setError(null);

    if (isDemo) {
      // Demo mode — accept any 6-digit code.
      setVerifying(false);
      onVerified();
      return;
    }

    if (!factorId || !challengeId) {
      setError('Verification challenge is not ready. Please try again.');
      setVerifying(false);
      return;
    }

    const { error: verifyError } = await verifyTotpChallenge(factorId, challengeId, code);

    if (verifyError) {
      setError(verifyError.message || 'Invalid code. Please try again.');
      setVerifying(false);
      return;
    }

    setVerifying(false);
    onVerified();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-panel-elevated p-6 rounded-2xl border border-zinc-800 bg-zinc-900/95 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Re-authentication Required</h3>
              <p className="text-[11px] text-zinc-400">MFA step-up for production secrets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="ml-2 text-sm text-zinc-400">Preparing challenge…</span>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {isDemo && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200">
                  Demo mode — enter any 6-digit code to continue.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 justify-center">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Authentication Code</span>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-emerald-500 focus:outline-none placeholder:text-zinc-700"
              autoFocus
            />

            {error && <p className="text-xs text-rose-400 text-center">{error}</p>}

            <button
              type="submit"
              disabled={code.length !== 6 || verifying}
              className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};