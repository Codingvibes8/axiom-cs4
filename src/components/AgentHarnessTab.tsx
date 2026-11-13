'use client';

import React, { useState } from 'react';
import { useAxiomStore } from '@/lib/store';
import { AgentHarness, Environment } from '@/lib/types';
import { secureToken } from '@/lib/crypto';
import { 
  Bot, 
  Plus, 
  ShieldCheck, 
  RotateCw, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Cpu, 
  Flame, 
  X
} from 'lucide-react';

export const AgentHarnessTab: React.FC = () => {
  const { 
    agents, 
    secrets, 
    currentProject, 
    addAgent, 
    updateAgentStatus, 
    triggerKillSwitch, 
    rotateAgentToken, 
    showToast 
  } = useAxiomStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedAlias, setCopiedAlias] = useState<string | null>(null);

  // Agent Harness Creation State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modelProvider, setModelProvider] = useState<AgentHarness['model_provider']>('Anthropic');
  const [agentType] = useState<AgentHarness['agent_type']>('Coding Assistant');
  const [environment, setEnvironment] = useState<Environment>('development');
  const [selectedSecrets, setSelectedSecrets] = useState<string[]>(['OPENAI_API_KEY']);
  const [ephemeralTtl, setEphemeralTtl] = useState(60);
  const [tokenLimitPerHour, setTokenLimitPerHour] = useState(50000);
  const [autoMask] = useState(true);

  // Interactive Live Simulator Terminal State
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || '');
  const [simPrompt, setSimPrompt] = useState('Read user profile and perform vector embedding query on DATABASE_URL');
  const [simOutput, setSimOutput] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  const handleCopy = (alias: string) => {
    navigator.clipboard.writeText(alias);
    setCopiedAlias(alias);
    showToast(`Copied agent token alias to clipboard`);
    setTimeout(() => setCopiedAlias(null), 2000);
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addAgent({
      project_id: currentProject.id,
      name: name.trim(),
      description: description.trim() || 'Custom AI Agent Harness',
      model_provider: modelProvider,
      agent_type: agentType,
      allowed_secrets: selectedSecrets,
      environment,
      status: 'active',
      ephemeral_ttl_minutes: Number(ephemeralTtl),
      token_limit_per_hour: Number(tokenLimitPerHour),
      api_key_alias: secureToken(`axm_${modelProvider.toLowerCase().replace(/\s+/g, '')}_`, 4),
      token_prefix: `axm_${environment.substring(0, 3)}_`,
      auto_mask_secrets: autoMask,
    });

    setName('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  const runSimulation = () => {
    if (!selectedAgent) return;
    setIsSimulating(true);
    setSimOutput([
      `[AXIOM HARNESS PROXY v2.4] Initializing handshake for ${selectedAgent.name}...`,
      `[SECURITY CHECK] Agent Status: ${selectedAgent.status.toUpperCase()} | Token Quota: ${selectedAgent.tokens_used_today}/${selectedAgent.token_limit_per_hour} tokens`,
    ]);

    setTimeout(() => {
      if (selectedAgent.status === 'revoked') {
        setSimOutput((prev) => [
          ...prev,
          `[🚨 BLOCKED] Firewall Rejection: Agent credentials have been REVOKED via Emergency Killswitch.`,
          `[RESULT] 403 Forbidden: Contact SecOps to reissue token.`,
        ]);
        setIsSimulating(false);
        return;
      }

      setSimOutput((prev) => [
        ...prev,
        `[SCOPED VAULT] Requesting ephemeral envelope for secrets: [${selectedAgent.allowed_secrets.join(', ')}]`,
        `[MASKING ENGINE] Ephemeral TTL Lease: ${selectedAgent.ephemeral_ttl_minutes} minutes`,
        `[INSPECTION] Prompt: "${simPrompt}"`,
        `[PROXY SANITIZATION] Masking raw keys: "postgresql://postgres.axiom_prod:••••••••@db..." injected safely.`,
        `[EXECUTION] AI Agent call succeeded via zero-trust sandbox tunnel.`,
        `[METRICS] Recorded 420 tokens against hourly budget (${selectedAgent.token_limit_per_hour - 420} remaining).`,
      ]);
      setIsSimulating(false);
    }, 1200);
  };

  const availableSecretKeys = Array.from(new Set(secrets.map((s) => s.key)));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Bot className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI Agent Credential Harness & Scoped Firewall
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Never expose raw production API keys to autonomous coding agents or LLMs. Axiom provides ephemeral credentials, hourly rate quotas, automatic output masking, and zero-latency emergency killswitches.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Agent Harness</span>
          </button>
        </div>
      </div>

      {/* Agent Harness Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const isRevoked = agent.status === 'revoked';
          const isSandboxed = agent.status === 'sandboxed';
          const isCopied = copiedAlias === agent.api_key_alias;

          return (
            <div
              key={agent.id}
              className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-zinc-900/70 ${
                isRevoked
                  ? 'border-rose-500/30 bg-rose-950/20'
                  : isSandboxed
                  ? 'border-amber-500/30 bg-amber-950/20'
                  : 'border-zinc-800 hover:border-emerald-500/30'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-emerald-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                      <span className="text-[11px] text-zinc-400">{agent.model_provider} • {agent.agent_type}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isRevoked
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : isSandboxed
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2 mt-2 leading-relaxed">
                  {agent.description}
                </p>
              </div>

              {/* Scoped Secrets & Quota Specs */}
              <div className="space-y-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Environment:</span>
                  <span className="text-emerald-400 font-semibold uppercase text-[11px]">{agent.environment}</span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span>Hourly Quota:</span>
                  <span className="text-zinc-200 font-mono">{agent.token_limit_per_hour.toLocaleString()} tok/hr</span>
                </div>

                <div className="flex items-center justify-between text-zinc-400">
                  <span>Ephemeral TTL:</span>
                  <span className="text-zinc-200 font-mono">{agent.ephemeral_ttl_minutes} mins</span>
                </div>

                <div className="pt-1.5 border-t border-zinc-800">
                  <div className="text-[10px] text-zinc-400 uppercase font-bold mb-1">
                    Allowed Scoped Secrets:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {agent.allowed_secrets.map((sec) => (
                      <span
                        key={sec}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Token Alias */}
                <div className="pt-1.5 border-t border-zinc-800 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono text-zinc-400 truncate select-all">
                    {agent.api_key_alias}
                  </span>
                  <button
                    onClick={() => handleCopy(agent.api_key_alias)}
                    className="p-1 hover:text-emerald-400 text-zinc-400 shrink-0"
                    title="Copy Proxy Token"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => rotateAgentToken(agent.id)}
                  className="py-1.5 px-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rotate</span>
                </button>

                {isRevoked ? (
                  <button
                    onClick={() => updateAgentStatus(agent.id, 'active')}
                    className="py-1.5 px-2 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Unblock</span>
                  </button>
                ) : (
                  <button
                    onClick={() => triggerKillSwitch(agent.id)}
                    className="py-1.5 px-2 text-xs font-semibold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 flex items-center justify-center gap-1.5 transition-colors"
                    title="Emergency Stop: instantly revokes agent proxy tokens"
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span>Killswitch</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* LIVE SIMULATOR / TESTING HARNESS */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Live Proxy Firewall & Sandbox Simulator</h3>
              <p className="text-xs text-zinc-400">Test secret injection, output masking, and rate limiter in real time</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="glass-input px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-950 border-zinc-800"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.status})
                </option>
              ))}
            </select>

            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isSimulating ? 'Evaluating...' : 'Dispatch Request'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              TEST AGENT INSTRUCTION / TOOL PAYLOAD
            </label>
            <textarea
              rows={5}
              value={simPrompt}
              onChange={(e) => setSimPrompt(e.target.value)}
              className="glass-input w-full p-3 rounded-xl font-mono text-xs border-zinc-800 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              AXIOM HARNESS PROXY AUDIT STREAM
            </label>
            <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800 font-mono text-[11px] h-[126px] overflow-y-auto space-y-1 text-zinc-300">
              {simOutput.length === 0 ? (
                <span className="text-zinc-600 italic">Click &apos;Dispatch Request&apos; to stream proxy audit logs...</span>
              ) : (
                simOutput.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.includes('🚨')
                        ? 'text-rose-400 font-bold'
                        : line.includes('MASKING')
                        ? 'text-teal-300'
                        : line.includes('METRICS')
                        ? 'text-emerald-400 font-semibold'
                        : 'text-zinc-300'
                    }
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE AGENT HARNESS MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-elevated w-full max-w-lg rounded-2xl p-6 border border-zinc-800 bg-zinc-900 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create AI Agent Harness</h3>
                  <p className="text-xs text-zinc-400">Scoped Proxy & Token Quarantine</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  AGENT / PIPELINE NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Claude Code Developer Bot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm border-zinc-800 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  DESCRIPTION
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scoped harness for automated pull request reviews"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm border-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    MODEL PROVIDER
                  </label>
                  <select
                    value={modelProvider}
                    onChange={(e) => setModelProvider(e.target.value as AgentHarness['model_provider'])}
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm bg-zinc-950 border-zinc-800"
                  >
                    <option value="Anthropic">Anthropic (Claude)</option>
                    <option value="OpenAI">OpenAI (GPT-4o/o3)</option>
                    <option value="Google Gemini">Google Gemini</option>
                    <option value="DeepSeek">DeepSeek</option>
                    <option value="Custom LLM / Agent">Custom LLM / Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    ENVIRONMENT
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as Environment)}
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm bg-zinc-950 border-zinc-800 capitalize"
                  >
                    <option value="development">development</option>
                    <option value="staging">staging</option>
                    <option value="production">production</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ALLOWED SECRETS (SCOPED WHITELIST)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-zinc-950 rounded-lg border border-zinc-800 max-h-32 overflow-y-auto">
                  {availableSecretKeys.map((secKey) => {
                    const isSelected = selectedSecrets.includes(secKey);
                    return (
                      <button
                        type="button"
                        key={secKey}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSecrets(selectedSecrets.filter((k) => k !== secKey));
                          } else {
                            setSelectedSecrets([...selectedSecrets, secKey]);
                          }
                        }}
                        className={`text-xs font-mono px-2 py-1 rounded transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {secKey}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    EPHEMERAL LEASE (MINUTES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={ephemeralTtl}
                    onChange={(e) => setEphemeralTtl(Number(e.target.value))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm border-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    HOURLY TOKEN LIMIT
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={tokenLimitPerHour}
                    onChange={(e) => setTokenLimitPerHour(Number(e.target.value))}
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm border-zinc-800"
                  />
                </div>
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
                  Deploy Harness
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
