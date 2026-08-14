'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Environment, 
  Secret, 
  SecretVersion, 
  Project, 
  TeamMember, 
  ActivityLog, 
  AgentHarness, 
  ProjectSettings, 
  User 
} from './types';
import { 
  INITIAL_PROJECT, 
  INITIAL_SECRETS, 
  INITIAL_TEAM, 
  INITIAL_ACTIVITY, 
  INITIAL_AGENTS, 
  INITIAL_SETTINGS 
} from './seed';

interface AxiomStoreContextType {
  // Auth & Project State
  currentUser: User;
  setCurrentUser: (user: User) => void;
  currentProject: Project;
  setCurrentProject: (proj: Project) => void;
  currentEnv: Environment;
  setCurrentEnv: (env: Environment) => void;
  activeTab: 'secrets' | 'diff' | 'team' | 'activity' | 'agents' | 'settings';
  setActiveTab: (tab: 'secrets' | 'diff' | 'team' | 'activity' | 'agents' | 'settings') => void;
  
  // Secrets
  secrets: Secret[];
  addSecret: (secret: Omit<Secret, 'id' | 'created_at' | 'updated_at' | 'version' | 'updated_by'>) => void;
  updateSecret: (id: string, value: string, comment?: string) => void;
  deleteSecret: (id: string) => void;
  rollbackSecret: (secretId: string, targetVersion: number) => void;
  bulkImportSecrets: (envText: string, env: Environment) => number;
  syncSecretToEnv: (sourceSecret: Secret, targetEnv: Environment) => void;
  
  // Team
  team: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, 'id' | 'created_at'>) => void;
  removeTeamMember: (id: string) => void;
  updateTeamMemberRole: (id: string, role: TeamMember['role'], allowedEnvs: Environment[]) => void;
  
  // Activity Logs
  activities: ActivityLog[];
  logAction: (action: ActivityLog['action'], resource: string, env: Environment, details?: string) => void;
  
  // Agent Harness
  agents: AgentHarness[];
  addAgent: (agent: Omit<AgentHarness, 'id' | 'created_at' | 'tokens_used_today'>) => void;
  updateAgentStatus: (id: string, status: AgentHarness['status']) => void;
  triggerKillSwitch: (id: string) => void;
  rotateAgentToken: (id: string) => void;
  extendAgentTTL: (id: string, minutes: number) => void;
  
  // Settings
  settings: ProjectSettings;
  updateSettings: (newSettings: Partial<ProjectSettings>) => void;
  
  // Utilities
  resetToDefaults: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AxiomStoreContext = createContext<AxiomStoreContextType | null>(null);

const STORAGE_KEYS = {
  PROJECT: 'axiom_project_v1',
  SECRETS: 'axiom_secrets_v1',
  TEAM: 'axiom_team_v1',
  ACTIVITY: 'axiom_activity_v1',
  AGENTS: 'axiom_agents_v1',
  SETTINGS: 'axiom_settings_v1',
  ENV: 'axiom_active_env_v1',
};

export const AxiomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr_01',
    name: 'Alex Mercer',
    email: 'alex@axiom.dev',
    role: 'owner',
  });

  const [currentProject, setCurrentProject] = useState<Project>(INITIAL_PROJECT);
  const [currentEnv, setCurrentEnv] = useState<Environment>('production');
  const [activeTab, setActiveTab] = useState<'secrets' | 'diff' | 'team' | 'activity' | 'agents' | 'settings'>('secrets');
  
  const [secrets, setSecrets] = useState<Secret[]>(INITIAL_SECRETS);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITY);
  const [agents, setAgents] = useState<AgentHarness[]>(INITIAL_AGENTS);
  const [settings, setSettings] = useState<ProjectSettings>(INITIAL_SETTINGS);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize from LocalStorage if available
  useEffect(() => {
    try {
      const savedSecrets = localStorage.getItem(STORAGE_KEYS.SECRETS);
      if (savedSecrets) setSecrets(JSON.parse(savedSecrets));
      
      const savedTeam = localStorage.getItem(STORAGE_KEYS.TEAM);
      if (savedTeam) setTeam(JSON.parse(savedTeam));

      const savedActivity = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      if (savedActivity) setActivities(JSON.parse(savedActivity));

      const savedAgents = localStorage.getItem(STORAGE_KEYS.AGENTS);
      if (savedAgents) setAgents(JSON.parse(savedAgents));

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedEnv = localStorage.getItem(STORAGE_KEYS.ENV) as Environment | null;
      if (savedEnv) setCurrentEnv(savedEnv);
    } catch (e) {
      console.warn('Failed to load Axiom state from localStorage:', e);
    }
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SECRETS, JSON.stringify(secrets));
      localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activities));
      localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      localStorage.setItem(STORAGE_KEYS.ENV, currentEnv);
    } catch (e) {
      console.warn('Failed to save Axiom state to localStorage:', e);
    }
  }, [secrets, team, activities, agents, settings, currentEnv]);

  // Periodic TTL Checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      let hasExpired = false;
      
      setAgents((prev) => {
        const nextAgents = prev.map((a) => {
          if (a.status !== 'revoked' && a.expires_at) {
            const expires = new Date(a.expires_at).getTime();
            if (now >= expires) {
              hasExpired = true;
              return { ...a, status: 'revoked' as const };
            }
          }
          return a;
        });
        
        return hasExpired ? nextAgents : prev;
      });

    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const logAction = (action: ActivityLog['action'], resource: string, env: Environment, details?: string) => {
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      project_id: currentProject.id,
      user_name: currentUser.name,
      user_email: currentUser.email,
      action,
      resource_name: resource,
      environment: env,
      details: details || `Executed ${action} on ${resource}`,
      ip_address: '192.168.1.104',
      created_at: new Date().toISOString(),
    };

    setActivities((prev) => [newLog, ...prev]);
  };

  const addSecret = (newSecData: Omit<Secret, 'id' | 'created_at' | 'updated_at' | 'version' | 'updated_by'>) => {
    const now = new Date().toISOString();
    const newSecret: Secret = {
      ...newSecData,
      id: `sec_${Date.now()}`,
      version: 1,
      created_at: now,
      updated_at: now,
      updated_by: currentUser.email,
      versions: [
        {
          id: `v_${Date.now()}_1`,
          secret_id: `sec_${Date.now()}`,
          version: 1,
          value: newSecData.value,
          created_at: now,
          created_by: currentUser.email,
          comment: 'Initial secret creation',
        }
      ]
    };

    setSecrets((prev) => [newSecret, ...prev]);
    logAction('SECRET_CREATED', newSecret.key, newSecret.environment, `Created key with tags: ${newSecret.tags.join(', ') || 'none'}`);
    showToast(`Secret '${newSecret.key}' successfully created in ${newSecret.environment}`);
  };

  const updateSecret = (id: string, newValue: string, comment?: string) => {
    const now = new Date().toISOString();
    setSecrets((prev) =>
      prev.map((sec) => {
        if (sec.id !== id) return sec;
        const newVersionNum = (sec.version || 1) + 1;
        const newVersionObj: SecretVersion = {
          id: `v_${Date.now()}_${newVersionNum}`,
          secret_id: sec.id,
          version: newVersionNum,
          value: newValue,
          created_at: now,
          created_by: currentUser.email,
          comment: comment || `Updated to version ${newVersionNum}`,
        };

        logAction('SECRET_UPDATED', sec.key, sec.environment, comment || `Rotated to version ${newVersionNum}`);

        return {
          ...sec,
          value: newValue,
          version: newVersionNum,
          updated_at: now,
          updated_by: currentUser.email,
          last_rotated_at: now,
          versions: [newVersionObj, ...(sec.versions || [])],
        };
      })
    );
    showToast(`Secret updated to new version`);
  };

  const deleteSecret = (id: string) => {
    const target = secrets.find((s) => s.id === id);
    if (target) {
      logAction('SECRET_DELETED', target.key, target.environment, `Secret permanently removed`);
      setSecrets((prev) => prev.filter((s) => s.id !== id));
      showToast(`Secret '${target.key}' deleted`);
    }
  };

  const rollbackSecret = (secretId: string, targetVersionNum: number) => {
    const target = secrets.find((s) => s.id === secretId);
    if (!target || !target.versions) return;

    const historical = target.versions.find((v) => v.version === targetVersionNum);
    if (!historical) return;

    const now = new Date().toISOString();
    const newVersionNum = target.version + 1;
    const rollbackVersionObj: SecretVersion = {
      id: `v_${Date.now()}_${newVersionNum}`,
      secret_id: target.id,
      version: newVersionNum,
      value: historical.value,
      created_at: now,
      created_by: currentUser.email,
      comment: `Rollback to Version ${targetVersionNum}`,
    };

    setSecrets((prev) =>
      prev.map((sec) => {
        if (sec.id !== secretId) return sec;
        return {
          ...sec,
          value: historical.value,
          version: newVersionNum,
          updated_at: now,
          updated_by: currentUser.email,
          versions: [rollbackVersionObj, ...(sec.versions || [])],
        };
      })
    );

    logAction('SECRET_ROLLBACK', target.key, target.environment, `Rolled back to snapshot from Version ${targetVersionNum}`);
    showToast(`Rolled back ${target.key} to Version ${targetVersionNum}`);
  };

  const bulkImportSecrets = (envText: string, env: Environment): number => {
    const lines = envText.split('\n');
    let count = 0;
    const now = new Date().toISOString();

    const newEntries: Secret[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;

      const rawKey = trimmed.substring(0, eqIdx).trim();
      let rawVal = trimmed.substring(eqIdx + 1).trim();
      if (
        (rawVal.startsWith('"') && rawVal.endsWith('"')) ||
        (rawVal.startsWith("'") && rawVal.endsWith("'"))
      ) {
        rawVal = rawVal.substring(1, rawVal.length - 1);
      }

      if (rawKey) {
        newEntries.push({
          id: `sec_bulk_${Date.now()}_${count}`,
          project_id: currentProject.id,
          key: rawKey,
          value: rawVal,
          environment: env,
          category: 'General',
          description: 'Imported via .env bulk loader',
          tags: ['bulk-import', env],
          version: 1,
          created_at: now,
          updated_at: now,
          updated_by: currentUser.email,
          versions: [
            {
              id: `v_bulk_${Date.now()}_${count}`,
              secret_id: `sec_bulk_${Date.now()}_${count}`,
              version: 1,
              value: rawVal,
              created_at: now,
              created_by: currentUser.email,
              comment: 'Bulk import initial version',
            }
          ]
        });
        count++;
      }
    }

    if (count > 0) {
      setSecrets((prev) => [...newEntries, ...prev]);
      logAction('SECRET_CREATED', `${count} secrets (.env import)`, env, `Bulk imported ${count} environment variables`);
      showToast(`Imported ${count} secrets into ${env}`);
    }
    return count;
  };

  const syncSecretToEnv = (sourceSecret: Secret, targetEnv: Environment) => {
    const now = new Date().toISOString();
    const existingTarget = secrets.find(
      (s) => s.key === sourceSecret.key && s.environment === targetEnv
    );

    if (existingTarget) {
      updateSecret(existingTarget.id, sourceSecret.value, `Synced from ${sourceSecret.environment}`);
    } else {
      const cloned: Secret = {
        ...sourceSecret,
        id: `sec_sync_${Date.now()}`,
        environment: targetEnv,
        version: 1,
        created_at: now,
        updated_at: now,
        updated_by: currentUser.email,
        tags: [...sourceSecret.tags.filter((t) => t !== sourceSecret.environment), targetEnv],
        versions: [
          {
            id: `v_sync_${Date.now()}`,
            secret_id: `sec_sync_${Date.now()}`,
            version: 1,
            value: sourceSecret.value,
            created_at: now,
            created_by: currentUser.email,
            comment: `Synced from ${sourceSecret.environment} (v${sourceSecret.version})`,
          }
        ]
      };
      setSecrets((prev) => [cloned, ...prev]);
      logAction('ENV_SYNC', sourceSecret.key, targetEnv, `Synced value from ${sourceSecret.environment} to ${targetEnv}`);
      showToast(`Synced ${sourceSecret.key} to ${targetEnv}`);
    }
  };

  const addTeamMember = (memberData: Omit<TeamMember, 'id' | 'created_at'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: `tm_${Date.now()}`,
      created_at: new Date().toISOString(),
      last_active: 'Just invited',
    };
    setTeam((prev) => [...prev, newMember]);
    showToast(`Invited ${newMember.email} as ${newMember.role}`);
  };

  const removeTeamMember = (id: string) => {
    const target = team.find((t) => t.id === id);
    if (target) {
      setTeam((prev) => prev.filter((t) => t.id !== id));
      showToast(`Removed ${target.email} from project`);
    }
  };

  const updateTeamMemberRole = (id: string, role: TeamMember['role'], allowedEnvs: Environment[]) => {
    setTeam((prev) =>
      prev.map((t) => (t.id === id ? { ...t, role, allowed_environments: allowedEnvs } : t))
    );
    showToast(`Updated member permissions`);
  };

  const addAgent = (agentData: Omit<AgentHarness, 'id' | 'created_at' | 'tokens_used_today'>) => {
    const newAgent: AgentHarness = {
      ...agentData,
      id: `agent_${Date.now()}`,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + agentData.ephemeral_ttl_minutes * 60 * 1000).toISOString(),
      tokens_used_today: 0,
      last_invoked: 'Never',
    };
    setAgents((prev) => [newAgent, ...prev]);
    logAction('AGENT_TOKEN_ISSUED', newAgent.name, newAgent.environment, `Issued scoped harness key ${newAgent.api_key_alias}`);
    showToast(`Created AI Agent Harness for ${newAgent.name}`);
  };

  const updateAgentStatus = (id: string, status: AgentHarness['status']) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    showToast(`Agent status updated to: ${status}`);
  };

  const triggerKillSwitch = (id: string) => {
    const target = agents.find((a) => a.id === id);
    if (target) {
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'revoked' } : a))
      );
      logAction('AGENT_KILLSWITCH_TRIGGERED', target.name, target.environment, `Emergency revocation executed by ${currentUser.name}`);
      showToast(`🚨 KILLSWITCH ACTIVATED: All tokens revoked for ${target.name}`);
    }
  };

  const rotateAgentToken = (id: string) => {
    const target = agents.find((a) => a.id === id);
    if (target) {
      const newAlias = `axm_agent_${Math.random().toString(36).substr(2, 8)}`;
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, api_key_alias: newAlias, status: 'active' } : a))
      );
      logAction('KEY_ROTATION', target.name, target.environment, `Rotated token to alias ${newAlias}`);
      showToast(`Agent token rotated`);
    }
  };

  const extendAgentTTL = (id: string, minutes: number) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const baseTime = a.expires_at ? new Date(a.expires_at).getTime() : Date.now();
          const newExpires = new Date(baseTime + minutes * 60 * 1000).toISOString();
          return { ...a, expires_at: newExpires, status: a.status === 'revoked' ? 'active' : a.status };
        }
        return a;
      })
    );
    showToast(`Extended agent TTL by ${minutes} minutes`);
  };

  const updateSettings = (newSettings: Partial<ProjectSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Project security settings updated');
  };

  const resetToDefaults = () => {
    setSecrets(INITIAL_SECRETS);
    setTeam(INITIAL_TEAM);
    setActivities(INITIAL_ACTIVITY);
    setAgents(INITIAL_AGENTS);
    setSettings(INITIAL_SETTINGS);
    setCurrentEnv('production');
    localStorage.clear();
    showToast('Reset all demo data to default baseline');
  };

  return React.createElement(
    AxiomStoreContext.Provider,
    {
      value: {
        currentUser,
        setCurrentUser,
        currentProject,
        setCurrentProject,
        currentEnv,
        setCurrentEnv,
        activeTab,
        setActiveTab,
        secrets,
        addSecret,
        updateSecret,
        deleteSecret,
        rollbackSecret,
        bulkImportSecrets,
        syncSecretToEnv,
        team,
        addTeamMember,
        removeTeamMember,
        updateTeamMemberRole,
        activities,
        logAction,
        agents,
        addAgent,
        updateAgentStatus,
        triggerKillSwitch,
        rotateAgentToken,
        extendAgentTTL,
        settings,
        updateSettings,
        resetToDefaults,
        toastMessage,
        showToast,
      },
    },
    children
  );
};

export const useAxiomStore = () => {
  const context = useContext(AxiomStoreContext);
  if (!context) {
    throw new Error('useAxiomStore must be used within an AxiomProvider');
  }
  return context;
};
