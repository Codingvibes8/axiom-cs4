export type Environment = 'development' | 'staging' | 'production';

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer' | 'agent';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  twoFactorEnabled?: boolean;
}

export interface SecretVersion {
  id: string;
  secret_id: string;
  version: number;
  value: string;
  created_at: string;
  created_by: string;
  comment?: string;
}

export interface Secret {
  id: string;
  project_id: string;
  key: string;
  value: string;
  environment: Environment;
  category?: 'API Key' | 'Database' | 'OAuth' | 'AI / LLM' | 'Cloud / Infra' | 'General';
  description?: string;
  tags: string[];
  version: number;
  is_ephemeral?: boolean;
  expires_at?: string;
  last_rotated_at?: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  versions?: SecretVersion[];
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  encryption_algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'RSA-4096-KMS';
  environments: Environment[];
  secret_count?: number;
}

export interface TeamMember {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  allowed_environments: Environment[];
  created_at: string;
  last_active?: string;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  user_name: string;
  user_email: string;
  action: 'SECRET_CREATED' | 'SECRET_READ' | 'SECRET_UPDATED' | 'SECRET_DELETED' | 'SECRET_ROLLBACK' | 'ENV_SYNC' | 'AGENT_TOKEN_ISSUED' | 'AGENT_ACCESS_GRANTED' | 'AGENT_KILLSWITCH_TRIGGERED' | 'KEY_ROTATION' | 'MFA_ENABLED' | 'MFA_DISABLED';
  resource_name: string;
  environment: Environment;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface AgentHarness {
  id: string;
  project_id: string;
  name: string;
  description: string;
  model_provider: 'OpenAI' | 'Anthropic' | 'Google Gemini' | 'DeepSeek' | 'Custom LLM / Agent';
  agent_type: 'Autonomous Agent' | 'Coding Assistant' | 'CI/CD Pipeline' | 'Data Extractor' | 'Customer Support Bot';
  allowed_secrets: string[]; // Secret IDs or Keys
  environment: Environment;
  status: 'active' | 'sandboxed' | 'revoked' | 'rate_limited';
  ephemeral_ttl_minutes: number;
  token_limit_per_hour: number;
  tokens_used_today: number;
  api_key_alias: string;
  token_prefix: string;
  created_at: string;
  expires_at?: string;
  last_invoked?: string;
  auto_mask_secrets: boolean;
}

export interface DiffItem {
  key: string;
  sourceValue?: string;
  targetValue?: string;
  sourceVersion?: number;
  targetVersion?: number;
  status: 'synced' | 'missing_in_target' | 'missing_in_source' | 'value_mismatch';
  category?: string;
}

export interface ProjectSettings {
  project_id: string;
  auto_backup_enabled: boolean;
  slack_webhook_url?: string;
  discord_webhook_url?: string;
  pagerduty_key?: string;
  require_mfa_for_production: boolean;
  enable_agent_proxy_firewall: boolean;
  master_key_fingerprint: string;
  audit_retention_days: number;
}
