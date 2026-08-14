-- ============================================================================
-- Axiom: Developer & AI Agent Secrets Management Schema
-- Fully compatible with Supabase SQL Editor (Error-free & Idempotent)
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Enums Safely (Avoid duplicate type errors on re-run)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_environment') THEN
        CREATE TYPE project_environment AS ENUM ('development', 'staging', 'production');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE member_role AS ENUM ('owner', 'admin', 'developer', 'viewer', 'agent');
    END IF;
END $$;

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    encryption_algorithm TEXT DEFAULT 'AES-256-GCM',
    environments TEXT[] DEFAULT ARRAY['development', 'staging', 'production'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Secrets Vault Table
CREATE TABLE IF NOT EXISTS secrets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL, -- Encrypted ciphertext
    environment project_environment NOT NULL DEFAULT 'development',
    category TEXT DEFAULT 'General',
    description TEXT DEFAULT '',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    version INTEGER NOT NULL DEFAULT 1,
    is_ephemeral BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    last_rotated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT NOT NULL DEFAULT 'system',
    UNIQUE(project_id, key, environment)
);

-- 5. Secret Versions (Immutable Audit History & Rollback)
CREATE TABLE IF NOT EXISTS secret_versions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    secret_id TEXT NOT NULL REFERENCES secrets(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    value TEXT NOT NULL,
    comment TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT NOT NULL DEFAULT 'system',
    UNIQUE(secret_id, version)
);

-- 6. Team Members & RBAC
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role member_role NOT NULL DEFAULT 'developer',
    allowed_environments project_environment[] DEFAULT ARRAY['development'::project_environment],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- 7. AI Agent Harnesses & Scoped Proxies
CREATE TABLE IF NOT EXISTS agent_harnesses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    model_provider TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    allowed_secrets TEXT[] DEFAULT ARRAY[]::TEXT[],
    environment project_environment NOT NULL DEFAULT 'development',
    status TEXT NOT NULL DEFAULT 'active', -- active, sandboxed, revoked, rate_limited
    ephemeral_ttl_minutes INTEGER DEFAULT 60,
    token_limit_per_hour INTEGER DEFAULT 50000,
    tokens_used_today INTEGER DEFAULT 0,
    api_key_alias TEXT NOT NULL UNIQUE,
    token_prefix TEXT NOT NULL DEFAULT 'axm_',
    auto_mask_secrets BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_invoked TIMESTAMP WITH TIME ZONE NULL
);

-- 8. Audit Activity Trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_name TEXT NOT NULL,
    environment project_environment NOT NULL DEFAULT 'development',
    details TEXT DEFAULT '',
    ip_address TEXT DEFAULT '127.0.0.1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Project Security Settings
CREATE TABLE IF NOT EXISTS project_settings (
    project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
    auto_backup_enabled BOOLEAN DEFAULT TRUE,
    slack_webhook_url TEXT NULL,
    discord_webhook_url TEXT NULL,
    pagerduty_key TEXT NULL,
    require_mfa_for_production BOOLEAN DEFAULT TRUE,
    enable_agent_proxy_firewall BOOLEAN DEFAULT TRUE,
    master_key_fingerprint TEXT NOT NULL DEFAULT 'axm_fp_master_v1',
    audit_retention_days INTEGER DEFAULT 90
);

-- 10. Auto Updated_At Trigger Function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_timestamp ON projects;
CREATE TRIGGER update_projects_timestamp
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_secrets_timestamp ON secrets;
CREATE TRIGGER update_secrets_timestamp
    BEFORE UPDATE ON secrets
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 11. Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_harnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_settings ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies (Clean, Drop-and-Recreate for idempotency)
-- Permits access for both authenticated users and anonymous frontend client keys

-- Projects
DROP POLICY IF EXISTS "Allow full access on projects" ON projects;
CREATE POLICY "Allow full access on projects"
    ON projects FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Secrets
DROP POLICY IF EXISTS "Allow full access on secrets" ON secrets;
CREATE POLICY "Allow full access on secrets"
    ON secrets FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Secret Versions
DROP POLICY IF EXISTS "Allow full access on secret_versions" ON secret_versions;
CREATE POLICY "Allow full access on secret_versions"
    ON secret_versions FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Team Members
DROP POLICY IF EXISTS "Allow full access on team_members" ON team_members;
CREATE POLICY "Allow full access on team_members"
    ON team_members FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Agent Harnesses
DROP POLICY IF EXISTS "Allow full access on agent_harnesses" ON agent_harnesses;
CREATE POLICY "Allow full access on agent_harnesses"
    ON agent_harnesses FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Activity Logs
DROP POLICY IF EXISTS "Allow full access on activity_logs" ON activity_logs;
CREATE POLICY "Allow full access on activity_logs"
    ON activity_logs FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Project Settings
DROP POLICY IF EXISTS "Allow full access on project_settings" ON project_settings;
CREATE POLICY "Allow full access on project_settings"
    ON project_settings FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
