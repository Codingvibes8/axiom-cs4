'use client';

import React, { useState } from 'react';
import { useAxiomStore } from '@/lib/store';
import { ActivityLog } from '@/lib/types';
import { 
  Activity, 
  Search, 
  Download, 
  RotateCw, 
  PlusCircle, 
  FileText, 
  Bot, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Globe 
} from 'lucide-react';

export const ActivityTab: React.FC = () => {
  const { activities, showToast } = useAxiomStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterEnv, setFilterEnv] = useState<string>('ALL');

  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      act.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.resource_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = filterAction === 'ALL' || act.action === filterAction;
    const matchesEnv = filterEnv === 'ALL' || act.environment === filterEnv;

    return matchesSearch && matchesAction && matchesEnv;
  });

  const exportAuditLog = (format: 'csv' | 'json') => {
    let content = '';
    let mimeType = 'text/plain';
    let fileName = `axiom-audit-log-${new Date().toISOString().substring(0, 10)}`;

    if (format === 'json') {
      content = JSON.stringify(filteredActivities, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      const headers = ['Timestamp', 'Actor', 'Email', 'Action', 'Resource', 'Environment', 'IP Address', 'Details'];
      const rows = filteredActivities.map((a) => [
        `"${a.created_at}"`,
        `"${a.user_name}"`,
        `"${a.user_email}"`,
        `"${a.action}"`,
        `"${a.resource_name}"`,
        `"${a.environment}"`,
        `"${a.ip_address || ''}"`,
        `"${(a.details || '').replace(/"/g, '""')}"`
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      mimeType = 'text/csv';
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredActivities.length} audit records to ${format.toUpperCase()}`);
  };

  const getActionBadge = (action: ActivityLog['action']) => {
    switch (action) {
      case 'AGENT_KILLSWITCH_TRIGGERED':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />,
          label: 'Killswitch Triggered',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
      case 'SECRET_ROLLBACK':
        return {
          icon: <RotateCw className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Secret Rollback',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        };
      case 'AGENT_ACCESS_GRANTED':
      case 'AGENT_TOKEN_ISSUED':
        return {
          icon: <Bot className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Agent Scoped Token',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'SECRET_CREATED':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Secret Created',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'ENV_SYNC':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />,
          label: 'Diff Synchronized',
          color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        };
      case 'KEY_ROTATION':
        return {
          icon: <RotateCw className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Key Rotation',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5 text-zinc-400" />,
          label: action.replace(/_/g, ' '),
          color: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Immutable Security Audit Trail</h2>
          </div>
          <p className="text-xs text-zinc-400">
            SOC-2 Type II compliant event recording for every secret access, proxy query, and agent execution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportAuditLog('csv')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-800 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => exportAuditLog('json')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-800 transition-colors"
          >
            <FileText className="w-4 h-4 text-teal-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor, secret key, IP address, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-9 pr-4 py-2 text-xs rounded-xl border-zinc-800 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="glass-input px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-950 border-zinc-800"
          >
            <option value="ALL">All Action Types</option>
            <option value="SECRET_CREATED">Secret Created</option>
            <option value="SECRET_UPDATED">Secret Updated</option>
            <option value="SECRET_ROLLBACK">Secret Rollback</option>
            <option value="SECRET_DELETED">Secret Deleted</option>
            <option value="ENV_SYNC">Env Diff Sync</option>
            <option value="AGENT_KILLSWITCH_TRIGGERED">Agent Killswitch</option>
            <option value="AGENT_ACCESS_GRANTED">Agent Token</option>
            <option value="KEY_ROTATION">Key Rotation</option>
          </select>

          <select
            value={filterEnv}
            onChange={(e) => setFilterEnv(e.target.value)}
            className="glass-input px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-950 border-zinc-800 capitalize"
          >
            <option value="ALL">All Environments</option>
            <option value="development">development</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/70">
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Audit Events ({filteredActivities.length})
          </span>
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Retention: 90 Days
          </span>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-xs">
            No audit records match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filteredActivities.map((log) => {
              const badge = getActionBadge(log.action);

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-zinc-850/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Action badge & details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      <span className="font-mono font-bold text-white text-xs">
                        {log.resource_name}
                      </span>

                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {log.environment}
                      </span>
                    </div>

                    {log.details && (
                      <p className="text-xs text-zinc-300 font-mono bg-zinc-950 p-2 rounded border border-zinc-800">
                        {log.details}
                      </p>
                    )}
                  </div>

                  {/* Right: Actor & Timestamp & IP */}
                  <div className="flex md:flex-col items-center md:items-end justify-between text-[11px] text-zinc-400 shrink-0 gap-1">
                    <div className="font-semibold text-zinc-200 flex items-center gap-1">
                      <span>{log.user_name}</span>
                      <span className="text-zinc-500 hidden md:inline">({log.user_email})</span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-500">
                      {log.ip_address && (
                        <span className="flex items-center gap-0.5 font-mono">
                          <Globe className="w-3 h-3" /> {log.ip_address}
                        </span>
                      )}
                      <span>•</span>
                      <span>
                        {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
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
