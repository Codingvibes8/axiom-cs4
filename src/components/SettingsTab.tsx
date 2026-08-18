'use client';

import React, { useState } from 'react';
import { useAxiomStore } from '@/lib/store';
import { isSupabaseConfigured, listFactors, unenrollTotpFactor } from '@/lib/supabase';
import { TwoFactorSetup } from './TwoFactorSetup';
import { 
  Settings, 
  Key, 
  ShieldCheck, 
  Bell, 
  Database, 
  RotateCw, 
  Save, 
  AlertTriangle,
  Smartphone,
  Loader2
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    currentProject, 
    settings, 
    updateSettings, 
    resetToDefaults, 
    logAction, 
    showToast 
  } = useAxiomStore();

  const [slackUrl, setSlackUrl] = useState(settings.slack_webhook_url || '');
  const [discordUrl, setDiscordUrl] = useState(settings.discord_webhook_url || '');
  const [pagerdutyKey, setPagerdutyKey] = useState(settings.pagerduty_key || '');
  const [mfaProd, setMfaProd] = useState(settings.require_mfa_for_production);
  const [agentFirewall, setAgentFirewall] = useState(settings.enable_agent_proxy_firewall);
  const [retentionDays, setRetentionDays] = useState(settings.audit_retention_days);

  const [isRotatingMasterKey, setIsRotatingMasterKey] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  const handleTwoFactorSuccess = () => {
    setCurrentUser({ ...currentUser, twoFactorEnabled: true });
    logAction('MFA_ENABLED', 'Account Security', 'production', 'Two-factor authentication enabled via authenticator app');
    showToast('Two-factor authentication enabled for your account.');
    setIsTwoFactorModalOpen(false);
  };

  const handleDisable2FA = async () => {
    if (!confirm('Disable two-factor authentication? Your account will no longer require a one-time code at sign-in.')) {
      return;
    }
    setIsDisabling2FA(true);
    try {
      if (isSupabaseConfigured) {
        const { data } = await listFactors();
        const totpFactor = data?.all.find(
          (f) => f.factor_type === 'totp' && f.status === 'verified'
        );
        if (totpFactor) {
          await unenrollTotpFactor(totpFactor.id);
        }
      }
      setCurrentUser({ ...currentUser, twoFactorEnabled: false });
      logAction('MFA_DISABLED', 'Account Security', 'production', 'Two-factor authentication disabled');
      showToast('Two-factor authentication disabled.');
    } catch (e) {
      console.error('Failed to disable 2FA:', e);
      showToast('Failed to disable two-factor authentication.');
    }
    setIsDisabling2FA(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      slack_webhook_url: slackUrl.trim() || undefined,
      discord_webhook_url: discordUrl.trim() || undefined,
      pagerduty_key: pagerdutyKey.trim() || undefined,
      require_mfa_for_production: mfaProd,
      enable_agent_proxy_firewall: agentFirewall,
      audit_retention_days: Number(retentionDays),
    });
  };

  const handleRotateMasterKey = () => {
    setIsRotatingMasterKey(true);
    setTimeout(() => {
      const newFingerprint = `SHA256:${Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 256)
          .toString(16)
          .padStart(2, '0')
      ).join(':')}`;

      updateSettings({
        master_key_fingerprint: newFingerprint,
      });

      logAction('KEY_ROTATION', 'Master KMS Root Envelope Key', 'production', `Re-encrypted all secrets with new key fingerprint ${newFingerprint}`);
      setIsRotatingMasterKey(false);
      showToast('Master KMS Key rotated successfully. Re-encrypted all envelope secrets.');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Project & Security Settings</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Configure vault envelope encryption, alert webhooks, and zero-trust policies.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Encryption & KMS Root Ring */}
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">Master Envelope Encryption</h3>
                <p className="text-xs text-zinc-400">All secret values are ciphered with client-side KMS envelope keys</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRotateMasterKey}
              disabled={isRotatingMasterKey}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl border border-emerald-500/30 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRotatingMasterKey ? 'animate-spin' : ''}`} />
              <span>{isRotatingMasterKey ? 'Re-encrypting...' : 'Rotate Master Key'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[11px] text-zinc-400 uppercase font-bold">Algorithm</span>
              <div className="font-mono text-sm font-semibold text-white">{currentProject.encryption_algorithm}</div>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[11px] text-zinc-400 uppercase font-bold">Key Fingerprint</span>
              <div className="font-mono text-xs text-zinc-300 truncate select-all">
                {settings.master_key_fingerprint}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Access Policies */}
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Access & Compliance Policies</h3>
              <p className="text-xs text-zinc-400">Enforce enterprise zero-trust guardrails</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:bg-zinc-900 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white">Require MFA for Production Secrets</span>
                <p className="text-[11px] text-zinc-400">Users must pass hardware security key or TOTP before revealing production values</p>
              </div>
              <input
                type="checkbox"
                checked={mfaProd}
                onChange={(e) => setMfaProd(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:bg-zinc-900 transition-colors">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white">Enable AI Agent Proxy Firewall</span>
                <p className="text-[11px] text-zinc-400">Automatically sanitize prompt traces and mask live secrets before LLM ingestion</p>
              </div>
              <input
                type="checkbox"
                checked={agentFirewall}
                onChange={(e) => setAgentFirewall(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 focus:ring-0"
              />
            </label>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-white">Audit Log Retention (Days)</span>
                <p className="text-[11px] text-zinc-400">Duration audit logs remain queryable for SOC-2 compliance</p>
              </div>
              <input
                type="number"
                min="30"
                max="365"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="glass-input w-24 px-3 py-1 text-xs rounded-lg text-right font-mono border-zinc-800"
              />
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Two-Factor Authentication</h3>
              <p className="text-xs text-zinc-400">Protect your account with a TOTP authenticator app</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">Authenticator App (TOTP)</span>
              <p className="text-[11px] text-zinc-400">
                {currentUser.twoFactorEnabled
                  ? '2FA is on — a one-time code is required at sign-in.'
                  : 'No authenticator enrolled yet. Production MFA policy requires it.'}
              </p>
            </div>
            <span
              className={`text-xs font-bold uppercase px-3 py-1 rounded-full border shrink-0 ${
                currentUser.twoFactorEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              {currentUser.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {!currentUser.twoFactorEnabled ? (
            <button
              type="button"
              onClick={() => setIsTwoFactorModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Enable Two-Factor Authentication
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisable2FA}
              disabled={isDisabling2FA}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-xl border border-rose-500/30 transition-colors disabled:opacity-50"
            >
              {isDisabling2FA ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable Two-Factor Authentication'
              )}
            </button>
          )}
        </div>

        {/* Real-time Webhook Notifications */}
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">Alert Webhooks</h3>
              <p className="text-xs text-zinc-400">Receive instant alerts when secrets are modified or killswitch triggers</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                SLACK INCOMING WEBHOOK URL
              </label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={slackUrl}
                onChange={(e) => setSlackUrl(e.target.value)}
                className="glass-input w-full px-3 py-2 text-xs rounded-xl font-mono border-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                DISCORD WEBHOOK URL
              </label>
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordUrl}
                onChange={(e) => setDiscordUrl(e.target.value)}
                className="glass-input w-full px-3 py-2 text-xs rounded-xl font-mono border-zinc-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                PAGERDUTY INTEGRATION KEY
              </label>
              <input
                type="text"
                placeholder="pd_live_..."
                value={pagerdutyKey}
                onChange={(e) => setPagerdutyKey(e.target.value)}
                className="glass-input w-full px-3 py-2 text-xs rounded-xl font-mono border-zinc-800"
              />
            </div>
          </div>
        </div>

        {/* Supabase Status */}
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-white">Supabase Cloud Database Sync</h3>
                <p className="text-xs text-zinc-400">
                  {isSupabaseConfigured
                    ? 'Connected to live Supabase project instance.'
                    : 'Running in Local Offline-First Mode with auto-persisted browser storage.'}
                </p>
              </div>
            </div>

            <span
              className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              {isSupabaseConfigured ? 'Supabase Active' : 'Offline / Local Store'}
            </span>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* DANGER ZONE */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-zinc-900/70 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <div>
            <h3 className="text-base font-bold text-white">Danger Zone</h3>
            <p className="text-xs text-zinc-400">Irreversible actions for project state</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-rose-950/20 border border-rose-500/20">
          <div>
            <div className="text-xs font-bold text-rose-300">Reset Vault to Baseline Mock Seed</div>
            <p className="text-[11px] text-zinc-400">Clears custom additions and resets secrets, agents, and activities to seed template.</p>
          </div>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all data back to the demo baseline?')) {
                resetToDefaults();
              }
            }}
            className="px-4 py-2 text-xs font-semibold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl border border-rose-500/30 transition-colors shrink-0"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* 2FA Enrollment Modal */}
      {isTwoFactorModalOpen && (
        <TwoFactorSetup
          onClose={() => setIsTwoFactorModalOpen(false)}
          onSuccess={handleTwoFactorSuccess}
        />
      )}
    </div>
  );
};
