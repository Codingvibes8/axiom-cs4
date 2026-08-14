'use client';

import React, { useState } from 'react';
import { useAxiomStore } from '@/lib/store';
import { Environment, DiffItem } from '@/lib/types';
import { 
  GitCompare, 
  ArrowRight, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Zap 
} from 'lucide-react';

export const DiffTab: React.FC = () => {
  const { secrets, syncSecretToEnv, logAction, showToast } = useAxiomStore();

  const [sourceEnv, setSourceEnv] = useState<Environment>('development');
  const [targetEnv, setTargetEnv] = useState<Environment>('production');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const environments: Environment[] = ['development', 'staging', 'production'];

  const sourceSecrets = secrets.filter((s) => s.environment === sourceEnv);
  const targetSecrets = secrets.filter((s) => s.environment === targetEnv);

  // Build union of all keys across both source and target
  const allUniqueKeys = Array.from(
    new Set([...sourceSecrets.map((s) => s.key), ...targetSecrets.map((s) => s.key)])
  ).sort();

  const diffItems: DiffItem[] = allUniqueKeys.map((key) => {
    const src = sourceSecrets.find((s) => s.key === key);
    const tgt = targetSecrets.find((s) => s.key === key);

    let status: DiffItem['status'] = 'synced';
    if (!tgt && src) {
      status = 'missing_in_target';
    } else if (!src && tgt) {
      status = 'missing_in_source';
    } else if (src && tgt && src.value !== tgt.value) {
      status = 'value_mismatch';
    }

    return {
      key,
      sourceValue: src?.value,
      targetValue: tgt?.value,
      sourceVersion: src?.version,
      targetVersion: tgt?.version,
      status,
      category: src?.category || tgt?.category,
    };
  });

  const filteredDiffs = diffItems.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const missingInTargetCount = diffItems.filter((d) => d.status === 'missing_in_target').length;
  const mismatchCount = diffItems.filter((d) => d.status === 'value_mismatch').length;
  const syncedCount = diffItems.filter((d) => d.status === 'synced').length;

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSwap = () => {
    const temp = sourceEnv;
    setSourceEnv(targetEnv);
    setTargetEnv(temp);
  };

  const syncSingleKey = (key: string) => {
    const src = sourceSecrets.find((s) => s.key === key);
    if (!src) return;
    syncSecretToEnv(src, targetEnv);
  };

  const syncAllMissing = () => {
    const missingKeys = diffItems.filter((d) => d.status === 'missing_in_target');
    if (missingKeys.length === 0) return;

    missingKeys.forEach((item) => {
      const src = sourceSecrets.find((s) => s.key === item.key);
      if (src) syncSecretToEnv(src, targetEnv);
    });

    logAction('ENV_SYNC', `Batch Synced ${missingKeys.length} keys`, targetEnv, `Propagated missing keys from ${sourceEnv} to ${targetEnv}`);
    showToast(`Synced ${missingKeys.length} missing keys into ${targetEnv}`);
  };

  const mask = (val?: string) => {
    if (!val) return '—';
    if (val.length <= 8) return '••••••••';
    return `${val.substring(0, 4)}••••••••${val.substring(val.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Environment Selectors */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Source Environment */}
          <div className="w-full md:w-56 space-y-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              Source Environment
            </label>
            <select
              value={sourceEnv}
              onChange={(e) => setSourceEnv(e.target.value as Environment)}
              className="glass-input w-full px-3 py-2 rounded-xl text-sm font-semibold bg-zinc-950 capitalize border border-zinc-700"
            >
              {environments.map((env) => (
                <option key={env} value={env} disabled={env === targetEnv}>
                  {env}
                </option>
              ))}
            </select>
          </div>

          {/* Swap button */}
          <button
            onClick={handleSwap}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-transform active:scale-95"
            title="Swap source and target environments"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Target Environment */}
          <div className="w-full md:w-56 space-y-1.5">
            <label className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              Target Environment
            </label>
            <select
              value={targetEnv}
              onChange={(e) => setTargetEnv(e.target.value as Environment)}
              className="glass-input w-full px-3 py-2 rounded-xl text-sm font-semibold bg-zinc-950 capitalize border border-emerald-500/40"
            >
              {environments.map((env) => (
                <option key={env} value={env} disabled={env === sourceEnv}>
                  {env}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sync All CTA */}
        {missingInTargetCount > 0 && (
          <button
            onClick={syncAllMissing}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Sync {missingInTargetCount} Missing Keys to {targetEnv}</span>
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterStatus('all')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'all'
              ? 'bg-zinc-900 border-emerald-500 shadow-lg shadow-emerald-500/10'
              : 'glass-panel border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400 font-medium">Total Compared</span>
            <GitCompare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{diffItems.length}</div>
        </button>

        <button
          onClick={() => setFilterStatus('synced')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'synced'
              ? 'bg-zinc-900 border-emerald-500 shadow-lg shadow-emerald-500/10'
              : 'glass-panel border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400 font-medium">Identical Synced</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{syncedCount}</div>
        </button>

        <button
          onClick={() => setFilterStatus('missing_in_target')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'missing_in_target'
              ? 'bg-zinc-900 border-rose-500 shadow-lg shadow-rose-500/10'
              : 'glass-panel border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400 font-medium">Missing in {targetEnv}</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{missingInTargetCount}</div>
        </button>

        <button
          onClick={() => setFilterStatus('value_mismatch')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'value_mismatch'
              ? 'bg-zinc-900 border-amber-500 shadow-lg shadow-amber-500/10'
              : 'glass-panel border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-400 font-medium">Value Drift / Diff</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{mismatchCount}</div>
        </button>
      </div>

      {/* Comparison Matrix Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/70">
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Environment Diff Matrix: <span className="text-teal-400">{sourceEnv}</span> vs <span className="text-emerald-400">{targetEnv}</span>
            </h3>
          </div>
          <div className="text-xs text-zinc-400">
            Showing {filteredDiffs.length} entries
          </div>
        </div>

        {filteredDiffs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-semibold text-white">No differences found</h4>
            <p className="text-xs text-zinc-400 mt-1">All secrets in this filter category match perfectly.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filteredDiffs.map((diff) => {
              const isRevealed = Boolean(revealedKeys[diff.key]);

              return (
                <div
                  key={diff.key}
                  className="p-4 hover:bg-zinc-850/50 transition-colors grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
                >
                  {/* Key & Category (3 cols) */}
                  <div className="lg:col-span-3 space-y-1">
                    <div className="font-mono text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span>{diff.key}</span>
                      {diff.category && (
                        <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                          {diff.category}
                        </span>
                      )}
                    </div>

                    <div>
                      {diff.status === 'synced' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Synced
                        </span>
                      )}
                      {diff.status === 'missing_in_target' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> Missing in {targetEnv}
                        </span>
                      )}
                      {diff.status === 'missing_in_source' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> Missing in {sourceEnv}
                        </span>
                      )}
                      {diff.status === 'value_mismatch' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> Environment Drift
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Source Value (3.5 cols) */}
                  <div className="lg:col-span-3">
                    <div className="text-[10px] uppercase font-bold text-teal-400 mb-1">
                      {sourceEnv} {diff.sourceVersion ? `(v${diff.sourceVersion})` : ''}
                    </div>
                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300 flex items-center justify-between gap-2">
                      <span className="truncate">
                        {isRevealed ? diff.sourceValue || 'Not Set' : mask(diff.sourceValue)}
                      </span>
                      {diff.sourceValue && (
                        <button
                          onClick={() => toggleReveal(diff.key)}
                          className="text-zinc-500 hover:text-emerald-400 shrink-0"
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Direction Arrow (1 col) */}
                  <div className="lg:col-span-1 flex items-center justify-center text-zinc-600">
                    <ArrowRight className="w-4 h-4 hidden lg:block" />
                  </div>

                  {/* Target Value (3 cols) */}
                  <div className="lg:col-span-3">
                    <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">
                      {targetEnv} {diff.targetVersion ? `(v${diff.targetVersion})` : ''}
                    </div>
                    <div
                      className={`p-2 rounded-lg border font-mono text-xs flex items-center justify-between gap-2 ${
                        !diff.targetValue
                          ? 'bg-rose-500/10 border-rose-500/25 text-rose-300 italic'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span className="truncate">
                        {!diff.targetValue
                          ? 'NOT CONFIGURED'
                          : isRevealed
                          ? diff.targetValue
                          : mask(diff.targetValue)}
                      </span>
                      {diff.targetValue && (
                        <button
                          onClick={() => toggleReveal(diff.key)}
                          className="text-zinc-500 hover:text-emerald-400 shrink-0"
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Sync Button (1.5 cols) */}
                  <div className="lg:col-span-1 flex items-center justify-end">
                    {diff.sourceValue && diff.status !== 'synced' && (
                      <button
                        onClick={() => syncSingleKey(diff.key)}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-emerald-600/20"
                        title={`Sync value from ${sourceEnv} to ${targetEnv}`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Sync</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
