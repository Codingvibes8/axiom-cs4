'use client';

import React, { useState, useEffect } from 'react';
import {
  enrollTotpFactor,
  challengeTotpFactor,
  verifyTotpChallenge,
  unenrollTotpFactor,
  isSupabaseConfigured,
} from '@/lib/supabase';
import { ShieldCheck, X, Smartphone, KeyRound, Loader2, CheckCircle2, Info } from 'lucide-react';

interface TwoFactorSetupProps {
  onClose: () => void;
  onSuccess: () => void;
}

const generateDemoSecret = () =>
  'AXIOM' + Array.from({ length: 24 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.charAt(Math.floor(Math.random() * 32))
  ).join('');

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onClose, onSuccess }) => {
  const isDemo = !isSupabaseConfigured;
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(isDemo ? generateDemoSecret() : null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(isDemo ? false : true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const runEnrollment = () => {
    enrollTotpFactor('Axiom Vault').then(({ data, error: enrollError }) => {
      if (enrollError || !data) {
        setError(enrollError?.message || 'Failed to start 2FA enrollment. Is MFA enabled in Supabase?');
        setLoading(false);
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!isDemo) {
      runEnrollment();
    }
  }, [isDemo]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;

    if (isDemo) {
      // Demo mode — accept any 6-digit code.
      setVerifying(true);
      setError(null);
      setVerifying(false);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);
      return;
    }

    if (!factorId) return;

    setVerifying(true);
    setError(null);

    // Create a challenge for the enrolled factor
    const { data: challengeData, error: challengeError } = await challengeTotpFactor(factorId);
    if (challengeError || !challengeData) {
      setError(challengeError?.message || 'Failed to create verification challenge.');
      setVerifying(false);
      return;
    }

    // Verify the challenge with the user's code
    const { data: verifyData, error: verifyError } = await verifyTotpChallenge(
      factorId,
      challengeData.id,
      code
    );

    if (verifyError || !verifyData) {
      setError(verifyError?.message || 'Invalid code. Please try again.');
      setVerifying(false);
      return;
    }

    setSuccess(true);
    setVerifying(false);
    setTimeout(() => {
      onSuccess();
    }, 1200);
  };

  const handleCancel = async () => {
    // If we enrolled but didn't verify, clean up the unverified factor
    if (factorId && !success) {
      await unenrollTotpFactor(factorId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-panel-elevated p-6 rounded-2xl border border-zinc-800 bg-zinc-900/95 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Enable Two-Factor Authentication</h3>
              <p className="text-[11px] text-zinc-400">TOTP Authenticator App</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="ml-2 text-sm text-zinc-400">Generating secure key…</span>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            <p className="text-sm font-semibold text-white">2FA Enabled Successfully</p>
            <p className="text-xs text-zinc-400">Your account is now protected with TOTP.</p>
          </div>
        ) : error && !qrCode ? (
          <div className="py-6 space-y-3 text-center">
            <p className="text-sm text-rose-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                runEnrollment();
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {isDemo ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200">
                    Demo mode &mdash; Supabase isn&apos;t connected, so no real QR code is generated.
                    Use the simulated secret below (any 6-digit code works to verify).
                  </p>
                </div>

                {secret && (
                  <div className="text-center space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      Simulated authenticator secret
                    </p>
                    <code className="inline-block px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-emerald-300 select-all">
                      {secret}
                    </code>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Step 1: QR Code */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Step 1 — Scan with your authenticator app</span>
                  </div>
                  <div className="flex justify-center">
                    <div
                      className="bg-white p-3 rounded-xl"
                      dangerouslySetInnerHTML={{ __html: qrCode || '' }}
                    />
                  </div>
                  {secret && (
                    <div className="text-center space-y-1">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        Or enter this secret manually
                      </p>
                      <code className="inline-block px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-emerald-300 select-all">
                        {secret}
                      </code>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Verify Code */}
            <form onSubmit={handleVerify} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Step 2 — Enter the 6-digit code</span>
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
                  'Verify & Enable 2FA'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};