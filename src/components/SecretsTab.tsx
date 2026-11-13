'use client';

import React, { useState, useEffect } from 'react';
import { useAxiomStore } from '@/lib/store';
import { Secret, Environment } from '@/lib/types';
import { getAAL, isSupabaseConfigured } from '@/lib/supabase';
import { TwoFactorChallengeModal } from './TwoFactorChallengeModal';
import { 
  Key, 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  History, 
  Trash2, 
  Edit3, 
  RotateCw, 
  UploadCloud, 
  Download, 
  ShieldCheck, 
  Tag, 
  Clock, 
  X,
  Lock,
  Sparkles
} from 'lucide-react';

export const SecretsTab: React.FC = () => {
  const { 
    secrets, 
    currentEnv, 
    currentProject, 
    currentUser,
    settings,
    setActiveTab,
    addSecret, 
    updateSecret, 
    deleteSecret, 
    rollbackSecret, 
    bulkImportSecrets,
    showToast 
  } = useAxiomStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // MFA step-up state for production secrets
  const [mfaVerified, setMfaVerified] = useState(false);
  const [mfaPending, setMfaPending] = useState<
    | { kind: 'reveal'; id: string }
    | { kind: 'copy'; id: string; value: string; keyName: string }
    | null
  >(null);

  // If the user already passed 2FA at sign-in, they're at AAL2 — no re-prompt needed.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getAAL().then(({ data }) => {
      if (data?.currentLevel === 'aal2') setMfaVerified(true);
    }).catch(() => {});
  }, []);

  const mfaRequired = (): boolean =>
    currentEnv === 'production' && settings.require_mfa_for_production;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [historySecret, setHistorySecret] = useState<Secret | null>(null);

  // Add secret form state
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<Secret['category']>('AI / LLM');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');

  // Bulk import state
  const [bulkEnvText, setBulkEnvText] = useState('');

  // Edit secret form state
  const [editValue, setEditValue] = useState('');
  const [editComment, setEditComment] = useState('');

  // Filtered secrets
  const envSecrets = secrets.filter((s) => s.environment === currentEnv);
  const filteredSecrets = envSecrets.filter((s) => {
    const matchesSearch = 
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'AI / LLM', 'Database', 'Cloud / Infra', 'OAuth', 'General'];

  const requestMfaStepUp = (pending: { kind: 'reveal'; id: string } | { kind: 'copy'; id: string; value: string; keyName: string }) => {
    if (!currentUser.twoFactorEnabled) {
      showToast('Production secrets are MFA-protected. Enable two-factor authentication first.');
      setActiveTab('settings');
      return;
    }
    setMfaPending(pending);
  };

  const handleMfaVerified = () => {
    setMfaVerified(true);
    const pending = mfaPending;
    setMfaPending(null);
    if (!pending) return;

    if (pending.kind === 'reveal') {
      setRevealedIds((prev) => ({ ...prev, [pending.id]: true }));
    } else {
      navigator.clipboard.writeText(pending.value);
      setCopiedId(pending.id);
      showToast(`Copied ${pending.keyName} to clipboard`);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const toggleReveal = (id: string) => {
    // Hiding a secret never requires MFA
    if (revealedIds[id]) {
      setRevealedIds((prev) => ({ ...prev, [id]: false }));
      return;
    }

    if (!mfaRequired() || mfaVerified) {
      setRevealedIds((prev) => ({ ...prev, [id]: true }));
      return;
    }

    requestMfaStepUp({ kind: 'reveal', id });
  };

  const handleCopy = (id: string, value: string, keyName: string) => {
    if (!mfaRequired() || mfaVerified) {
      navigator.clipboard.writeText(value);
      setCopiedId(id);
      showToast(`Copied ${keyName} to clipboard`);
      setTimeout(() => setCopiedId(null), 2000);
      return;
    }

    requestMfaStepUp({ kind: 'copy', id, value, keyName });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    addSecret({
      project_id: currentProject.id,
      key: newKey.trim().toUpperCase(),
      value: newValue.trim(),
      environment: currentEnv,
      category: newCategory,
      description: newDescription.trim() || undefined,
      tags: newTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    });

    setNewKey('');
    setNewValue('');
    setNewDescription('');
    setNewTags('');
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSecret) return;
    updateSecret(editingSecret.id, editValue, editComment || 'Rotated secret value');
    setEditingSecret(null);
  };

  const handleBulkImport = () => {
    if (!bulkEnvText.trim()) return;
    const count = bulkImportSecrets(bulkEnvText, currentEnv);
    if (count > 0) {
      setBulkEnvText('');
      setIsBulkModalOpen(false);
    }
  };

  const exportAsEnvFile = () => {
    const content = envSecrets
      .map((s) => `# ${s.description || s.category || 'Secret'}\n${s.key}="${s.value}"`)
      .join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject.slug}.${currentEnv}.env`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${envSecrets.length} secrets to .env file`);
  };

  const maskSecret = (val: string) => {
    if (!val) return '••••••••••••••••';
    if (val.length <= 8) return '••••••••';
    return `${val.substring(0, 4)}••••••••••••${val.substring(val.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center gap-4 bg-zinc-900/60">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{envSecrets.length}</div>
            <div className="text-xs text-zinc-400 uppercase font-medium tracking-wider">
              {currentEnv} Secrets
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center gap-4 bg-zinc-900/60">
          <div className="p-3 bg-teal-500/10 rounded-lg text-teal-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{currentProject.encryption_algorithm}</div>
            <div className="text-xs text-zinc-400 uppercase font-medium tracking-wider">
              Encryption Envelope
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center gap-4 bg-zinc-900/60">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {envSecrets.filter((s) => s.category === 'AI / LLM').length}
            </div>
            <div className="text-xs text-zinc-400 uppercase font-medium tracking-wider">
              AI / LLM Credentials
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-zinc-800 flex items-center gap-4 bg-zinc-900/60">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">100% Valid</div>
            <div className="text-xs text-zinc-400 uppercase font-medium tracking-wider">
              Vault Health
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search and Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={`Search ${currentEnv} secrets, tags, descriptions...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-9 pr-4 py-2 text-sm rounded-lg border-zinc-800 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-teal-400" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={exportAsEnvFile}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export .env</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Secret</span>
          </button>
        </div>
      </div>

      {/* Secrets List / Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/60">
        {filteredSecrets.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No secrets found</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your search criteria or category filters.'
                : `There are currently no secrets defined in the ${currentEnv} environment.`}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" /> Create First Secret
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filteredSecrets.map((secret) => {
              const isRevealed = Boolean(revealedIds[secret.id]);
              const isCopied = copiedId === secret.id;

              return (
                <div
                  key={secret.id}
                  className="p-4 hover:bg-zinc-850/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  {/* Left: Key details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold text-sm text-white tracking-wide">
                        {secret.key}
                      </span>

                      {secret.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                          {secret.category}
                        </span>
                      )}

                      <button
                        onClick={() => setHistorySecret(secret)}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1 transition-colors"
                        title="View version history and rollback snapshots"
                      >
                        <History className="w-2.5 h-2.5 text-emerald-400" />
                        v{secret.version}
                      </button>
                    </div>

                    {secret.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{secret.description}</p>
                    )}

                    {secret.tags && secret.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        {secret.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800"
                          >
                            <Tag className="w-2.5 h-2.5 text-zinc-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Middle: Secret Value preview with mask */}
                  <div className="flex items-center gap-2 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800 font-mono text-xs max-w-full md:max-w-md flex-1">
                    <Lock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate flex-1 select-all text-zinc-300">
                      {isRevealed ? secret.value : maskSecret(secret.value)}
                    </span>
                    
                    <button
                      onClick={() => toggleReveal(secret.id)}
                      className="p-1 hover:text-emerald-400 text-zinc-400 transition-colors shrink-0"
                      title={isRevealed ? 'Mask secret' : 'Reveal secret'}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    
                    <button
                      onClick={() => handleCopy(secret.id, secret.value, secret.key)}
                      className="p-1 hover:text-emerald-400 text-zinc-400 transition-colors shrink-0"
                      title="Copy secret value"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingSecret(secret);
                        setEditValue(secret.value);
                        setEditComment('');
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-300 hover:bg-zinc-800 transition-colors"
                      title="Edit / Rotate Secret"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setHistorySecret(secret)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-teal-300 hover:bg-zinc-800 transition-colors"
                      title="Version History & Rollback"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${secret.key}? This action cannot be undone.`)) {
                          deleteSecret(secret.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Secret"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD SECRET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-elevated w-full max-w-lg rounded-2xl p-6 border border-zinc-800 bg-zinc-900 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create New Secret</h3>
                  <p className="text-xs text-zinc-400">Environment: <span className="text-emerald-400 uppercase font-semibold">{currentEnv}</span></p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  SECRET KEY NAME (UPPERCASE)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STRIPE_WEBHOOK_SIGNING_SECRET"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  className="glass-input w-full px-3 py-2 rounded-lg font-mono text-sm border-zinc-800 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  SECRET VALUE
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Paste confidential token, connection string, or private key..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg font-mono text-xs border-zinc-800 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    CATEGORY
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as Secret['category'])
                    }
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm bg-zinc-950 border-zinc-800"
                  >
                    <option value="AI / LLM">AI / LLM</option>
                    <option value="Database">Database</option>
                    <option value="OAuth">OAuth</option>
                    <option value="Cloud / Infra">Cloud / Infra</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    TAGS (COMMA SEPARATED)
                  </label>
                  <input
                    type="text"
                    placeholder="production, auth, critical"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm border-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  DESCRIPTION / NOTES (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="Used by payment webhook endpoint..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm border-zinc-800"
                />
              </div>

              <div className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  This secret will be automatically encrypted with {currentProject.encryption_algorithm} envelope encryption before storage.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-600/30"
                >
                  Encrypt & Save Secret
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-elevated w-full max-w-xl rounded-2xl p-6 border border-zinc-800 bg-zinc-900 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Bulk Import .env</h3>
                  <p className="text-xs text-zinc-400">Target Environment: <span className="text-emerald-400 uppercase font-semibold">{currentEnv}</span></p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Paste your standard <code>.env</code> file format lines below. Key/value pairs with quotes and comments are automatically handled.
            </p>

            <textarea
              rows={8}
              placeholder={`# Example format:\nOPENAI_API_KEY="sk-..."\nDATABASE_URL="postgres://..."\nAWS_REGION="us-east-1"`}
              value={bulkEnvText}
              onChange={(e) => setBulkEnvText(e.target.value)}
              className="glass-input w-full p-3 rounded-lg font-mono text-xs leading-relaxed border-zinc-800"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-600/30"
              >
                Parse & Ingest Secrets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / ROTATE MODAL */}
      {editingSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-elevated w-full max-w-lg rounded-2xl p-6 border border-zinc-800 bg-zinc-900 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Rotate Secret Value</h3>
                  <p className="text-xs font-mono text-emerald-400">{editingSecret.key}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingSecret(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  NEW SECRET VALUE
                </label>
                <textarea
                  required
                  rows={3}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg font-mono text-xs border-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ROTATION REASON / COMMENT
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled quarterly rotation or key compromised"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm border-zinc-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSecret(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-600/30"
                >
                  Save as Version {(editingSecret.version || 1) + 1}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERSION HISTORY & ROLLBACK DRAWER */}
      {historySecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md">
          <div className="glass-panel-elevated w-full max-w-md h-full p-6 border-l border-zinc-800 bg-zinc-900 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Version History</h3>
                    <p className="text-xs font-mono text-emerald-300">{historySecret.key}</p>
                  </div>
                </div>
                <button
                  onClick={() => setHistorySecret(null)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {(!historySecret.versions || historySecret.versions.length === 0) ? (
                  <p className="text-xs text-zinc-400">No previous version snapshots found.</p>
                ) : (
                  historySecret.versions.map((ver) => {
                    const isCurrent = ver.version === historySecret.version;
                    return (
                      <div
                        key={ver.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-emerald-600/10 border-emerald-500/30'
                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 border border-zinc-700">
                              v{ver.version}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                Current Active
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-mono">
                            {new Date(ver.created_at).toLocaleDateString()} {new Date(ver.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {ver.comment && (
                          <p className="text-xs text-zinc-300 mb-2 italic">{`"${ver.comment}"`}</p>
                        )}

                        <div className="bg-black/60 p-2 rounded text-[11px] font-mono text-zinc-400 break-all mb-3 border border-zinc-800">
                          {maskSecret(ver.value)}
                        </div>

                        {!isCurrent && (
                          <button
                            onClick={() => {
                              rollbackSecret(historySecret.id, ver.version);
                              setHistorySecret(null);
                            }}
                            className="w-full py-1.5 px-3 text-xs font-semibold bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-1.5"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            <span>Rollback to this snapshot</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <button
                onClick={() => setHistorySecret(null)}
                className="w-full py-2 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MFA STEP-UP MODAL for production secrets */}
      {mfaPending && (
        <TwoFactorChallengeModal
          onClose={() => setMfaPending(null)}
          onVerified={handleMfaVerified}
        />
      )}
    </div>
  );
};
