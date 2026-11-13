'use client';

import React, { useState, useEffect } from 'react';
import {
  listFactors,
  challengeTotpFactor,
  verifyTotpChallenge,
} from '@/lib/supabase';
import { ShieldCheck, KeyRound, Loader2, ChevronLeft } from 'lucide-react';

interface TwoFactorVerifyProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({ onSuccess, onBack }) => {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find the verified TOTP factor and create a challenge
  useEffect(() => {
    let active = true;

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
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || !challengeId || code.length !== 6) return;

    setVerifying(true);
    setError(null);

    const { data, error: verifyError } = await verifyTotpChallenge(factorId, challengeId, code);

    if (verifyError || !data) {
      setError(verifyError?.message || 'Invalid code. Please try again.');
      setVerifying(false);
      return;
    }

    setVerifying(false);
    onSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
          <ShieldCheck className="w-6 h-6 text-zinc-950 font-black" />
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Two-Factor Verification
        </h2>
        <p className="text-xs text-zinc-400">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="ml-2 text-sm text-zinc-400">Preparing challenge…</span>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
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

          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 px-4 text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to sign in
          </button>
        </form>
      )}
    </div>
  );
};