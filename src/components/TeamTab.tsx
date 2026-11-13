'use client';

import React, { useState } from 'react';
import { useAxiomStore } from '@/lib/store';
import { UserRole, Environment } from '@/lib/types';
import { secureToken } from '@/lib/crypto';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Trash2, 
  Server, 
  X,
  Clock
} from 'lucide-react';

export const TeamTab: React.FC = () => {
  const { team, addTeamMember, removeTeamMember, showToast } = useAxiomStore();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('developer');
  const [selectedEnvs, setSelectedEnvs] = useState<Environment[]>(['development', 'staging']);

  // Service Account generation state
  const [generatedServiceToken, setGeneratedServiceToken] = useState<string | null>(null);

  const environments: Environment[] = ['development', 'staging', 'production'];

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    addTeamMember({
      project_id: 'proj_axiom_prod_01',
      user_id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      allowed_environments: selectedEnvs,
    });

    setName('');
    setEmail('');
    setIsInviteOpen(false);
  };

  const generateServiceToken = () => {
    const token = secureToken('axm_svc_live_', 24);
    setGeneratedServiceToken(token);
    showToast('Created CI/CD Service Account Token');
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'admin':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'developer':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'viewer':
        return 'bg-zinc-700/40 text-zinc-300 border-zinc-600/30';
      case 'agent':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Team & Role-Based Access Control (RBAC)</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Control which team members and service accounts can read, rotate, and promote secrets across each environment.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={generateServiceToken}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-800 transition-colors"
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Generate CI/CD Token</span>
          </button>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Generated Token Banner if present */}
      {generatedServiceToken && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Key className="w-4 h-4" />
              <span>Ephemeral Service Account Token Generated</span>
            </div>
            <div className="font-mono text-xs text-white bg-zinc-950 p-2 rounded truncate select-all border border-zinc-800">
              {generatedServiceToken}
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generatedServiceToken);
              showToast('Copied CI/CD Service Token');
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shrink-0"
          >
            Copy
          </button>
        </div>
      )}

      {/* Team Members List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/70">
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Project Members ({team.length})
          </h3>
          <span className="text-xs text-zinc-400">Zero-Trust Environment Segmentation Active</span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {team.map((member) => (
            <div
              key={member.id}
              className="p-4 hover:bg-zinc-850/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Member Details */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-sm text-zinc-950 shrink-0 shadow-inner">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white truncate">{member.name}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-2 truncate">
                    <span>{member.email}</span>
                    {member.last_active && (
                      <>
                        <span>•</span>
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {member.last_active}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Allowed Environments */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-zinc-400 font-medium mr-1">Access:</span>
                {environments.map((env) => {
                  const hasAccess = member.allowed_environments.includes(env);
                  return (
                    <span
                      key={env}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${
                        hasAccess
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-zinc-950 text-zinc-600 border-zinc-800 line-through opacity-50'
                      }`}
                    >
                      {env}
                    </span>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {member.role !== 'owner' && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${member.name} from project?`)) {
                        removeTeamMember(member.id);
                      }
                    }}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix Reference */}
      <div className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>RBAC Privileges Matrix</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="font-bold text-emerald-400">Owner & Admin</div>
            <div className="text-zinc-400 text-[11px]">Full access to all environments, master key rotation, team billing & audit logs.</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="font-bold text-teal-400">Developer</div>
            <div className="text-zinc-400 text-[11px]">Read & write secrets in Development & Staging. Production requires PR review or Admin role.</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="font-bold text-zinc-300">Viewer</div>
            <div className="text-zinc-400 text-[11px]">Read-only access to masked values in whitelisted non-production environments.</div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="font-bold text-amber-400">Agent Service Account</div>
            <div className="text-zinc-400 text-[11px]">Programmatic access via Scoped Harness proxy only, with mandatory TTL expiry & budget cap.</div>
          </div>
        </div>
      </div>

      {/* INVITE MEMBER MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-elevated w-full max-w-md rounded-2xl p-6 border border-zinc-800 bg-zinc-900 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Invite Team Member</h3>
                  <p className="text-xs text-zinc-400">Grant environment-specific vault access</p>
                </div>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  FULL NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Blake"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm border-zinc-800 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  placeholder="jordan@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm border-zinc-800 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ROLE
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm bg-zinc-950 border-zinc-800 capitalize"
                >
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                  <option value="agent">Agent Service Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  ALLOWED ENVIRONMENTS
                </label>
                <div className="flex gap-2">
                  {environments.map((env) => {
                    const isSelected = selectedEnvs.includes(env);
                    return (
                      <button
                        type="button"
                        key={env}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedEnvs(selectedEnvs.filter((e) => e !== env));
                          } else {
                            setSelectedEnvs([...selectedEnvs, env]);
                          }
                        }}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {env}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-600/30"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
