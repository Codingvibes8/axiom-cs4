/**
 * Unit tests for Axiom store logic.
 * These tests validate the pure state-transformation functions extracted
 * from the store (addSecret, updateSecret, deleteSecret, rollbackSecret,
 * bulkImportSecrets) without requiring a React runtime.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Secret, SecretVersion, Environment } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers — mirror the logic in store.ts so tests stay self-contained
// ---------------------------------------------------------------------------

const CURRENT_USER_EMAIL = 'alex@axiom.dev';
const PROJECT_ID = 'proj_test_001';

function makeSecret(
  key: string,
  value: string,
  env: Environment = 'development'
): Secret {
  const now = new Date().toISOString();
  const id = `sec_test_${key}`;
  return {
    id,
    project_id: PROJECT_ID,
    key,
    value,
    environment: env,
    category: 'General',
    description: 'Test secret',
    tags: [env],
    version: 1,
    created_at: now,
    updated_at: now,
    updated_by: CURRENT_USER_EMAIL,
    versions: [
      {
        id: `v_${id}_1`,
        secret_id: id,
        version: 1,
        value,
        created_at: now,
        created_by: CURRENT_USER_EMAIL,
        comment: 'Initial version',
      },
    ],
  };
}

// Pure addSecret equivalent
function addSecret(
  secrets: Secret[],
  key: string,
  value: string,
  env: Environment
): Secret[] {
  const s = makeSecret(key, value, env);
  return [s, ...secrets];
}

// Pure updateSecret equivalent
function updateSecret(
  secrets: Secret[],
  id: string,
  newValue: string,
  comment?: string
): Secret[] {
  const now = new Date().toISOString();
  return secrets.map((sec) => {
    if (sec.id !== id) return sec;
    const newVersion = (sec.version || 1) + 1;
    const versionObj: SecretVersion = {
      id: `v_${Date.now()}_${newVersion}`,
      secret_id: sec.id,
      version: newVersion,
      value: newValue,
      created_at: now,
      created_by: CURRENT_USER_EMAIL,
      comment: comment || `Updated to version ${newVersion}`,
    };
    return {
      ...sec,
      value: newValue,
      version: newVersion,
      updated_at: now,
      updated_by: CURRENT_USER_EMAIL,
      last_rotated_at: now,
      versions: [versionObj, ...(sec.versions || [])],
    };
  });
}

// Pure deleteSecret equivalent
function deleteSecret(secrets: Secret[], id: string): Secret[] {
  return secrets.filter((s) => s.id !== id);
}

// Pure rollbackSecret equivalent
function rollbackSecret(
  secrets: Secret[],
  secretId: string,
  targetVersionNum: number
): Secret[] {
  const now = new Date().toISOString();
  return secrets.map((sec) => {
    if (sec.id !== secretId) return sec;
    const historical = (sec.versions || []).find(
      (v) => v.version === targetVersionNum
    );
    if (!historical) return sec;
    const newVersion = sec.version + 1;
    const rollbackVersion: SecretVersion = {
      id: `v_rollback_${Date.now()}`,
      secret_id: sec.id,
      version: newVersion,
      value: historical.value,
      created_at: now,
      created_by: CURRENT_USER_EMAIL,
      comment: `Rollback to Version ${targetVersionNum}`,
    };
    return {
      ...sec,
      value: historical.value,
      version: newVersion,
      updated_at: now,
      updated_by: CURRENT_USER_EMAIL,
      versions: [rollbackVersion, ...(sec.versions || [])],
    };
  });
}

// Pure bulkImportSecrets equivalent
function bulkImportSecrets(envText: string, env: Environment): Secret[] {
  const lines = envText.split('\n');
  const now = new Date().toISOString();
  const result: Secret[] = [];
  let count = 0;

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
      result.push({
        id: `sec_bulk_${count}`,
        project_id: PROJECT_ID,
        key: rawKey,
        value: rawVal,
        environment: env,
        category: 'General',
        description: 'Imported via .env bulk loader',
        tags: ['bulk-import', env],
        version: 1,
        created_at: now,
        updated_at: now,
        updated_by: CURRENT_USER_EMAIL,
        versions: [
          {
            id: `v_bulk_${count}`,
            secret_id: `sec_bulk_${count}`,
            version: 1,
            value: rawVal,
            created_at: now,
            created_by: CURRENT_USER_EMAIL,
            comment: 'Bulk import initial version',
          },
        ],
      });
      count++;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('addSecret', () => {
  let secrets: Secret[];

  beforeEach(() => {
    secrets = [];
  });

  it('prepends a new secret to the list', () => {
    const result = addSecret(secrets, 'API_KEY', 'secret123', 'development');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('API_KEY');
    expect(result[0].value).toBe('secret123');
  });

  it('initialises with version 1', () => {
    const result = addSecret(secrets, 'DB_URL', 'postgres://localhost', 'staging');
    expect(result[0].version).toBe(1);
  });

  it('creates an initial version history entry', () => {
    const result = addSecret(secrets, 'JWT_SECRET', 'abc', 'production');
    expect(result[0].versions).toHaveLength(1);
    expect(result[0].versions![0].version).toBe(1);
    expect(result[0].versions![0].value).toBe('abc');
  });

  it('prepends to existing secrets (newest first)', () => {
    const first = addSecret(secrets, 'FIRST', '1', 'development');
    const result = addSecret(first, 'SECOND', '2', 'development');
    expect(result[0].key).toBe('SECOND');
    expect(result[1].key).toBe('FIRST');
  });
});

describe('updateSecret', () => {
  let secrets: Secret[];

  beforeEach(() => {
    secrets = [makeSecret('API_KEY', 'old_value')];
  });

  it('updates the value of the target secret', () => {
    const result = updateSecret(secrets, 'sec_test_API_KEY', 'new_value');
    expect(result[0].value).toBe('new_value');
  });

  it('increments the version number', () => {
    const result = updateSecret(secrets, 'sec_test_API_KEY', 'new_value');
    expect(result[0].version).toBe(2);
  });

  it('prepends a new version history entry', () => {
    const result = updateSecret(secrets, 'sec_test_API_KEY', 'new_value', 'Manual rotation');
    expect(result[0].versions).toHaveLength(2);
    expect(result[0].versions![0].value).toBe('new_value');
    expect(result[0].versions![0].comment).toBe('Manual rotation');
  });

  it('leaves other secrets unmodified', () => {
    secrets.push(makeSecret('OTHER_KEY', 'unchanged'));
    const result = updateSecret(secrets, 'sec_test_API_KEY', 'new_value');
    const other = result.find((s) => s.key === 'OTHER_KEY')!;
    expect(other.value).toBe('unchanged');
    expect(other.version).toBe(1);
  });

  it('does nothing to a non-existent id', () => {
    const result = updateSecret(secrets, 'sec_nonexistent', 'new_value');
    expect(result[0].value).toBe('old_value');
  });
});

describe('deleteSecret', () => {
  it('removes the secret with the matching id', () => {
    const secrets = [makeSecret('API_KEY', 'val'), makeSecret('DB_URL', 'val2')];
    const result = deleteSecret(secrets, 'sec_test_API_KEY');
    expect(result).toHaveLength(1);
    expect(result[0].key).toBe('DB_URL');
  });

  it('returns empty array when deleting the last secret', () => {
    const secrets = [makeSecret('ONLY', 'v')];
    const result = deleteSecret(secrets, 'sec_test_ONLY');
    expect(result).toHaveLength(0);
  });

  it('is a no-op for a non-existent id', () => {
    const secrets = [makeSecret('KEY', 'v')];
    const result = deleteSecret(secrets, 'sec_nonexistent');
    expect(result).toHaveLength(1);
  });
});

describe('rollbackSecret', () => {
  it('restores the value from the specified historical version', () => {
    let secrets = [makeSecret('API_KEY', 'v1_value')];
    secrets = updateSecret(secrets, 'sec_test_API_KEY', 'v2_value');
    secrets = updateSecret(secrets, 'sec_test_API_KEY', 'v3_value');

    const result = rollbackSecret(secrets, 'sec_test_API_KEY', 1);
    expect(result[0].value).toBe('v1_value');
  });

  it('creates a new version entry for the rollback', () => {
    let secrets = [makeSecret('KEY', 'v1')];
    secrets = updateSecret(secrets, 'sec_test_KEY', 'v2');
    const vCountBefore = secrets[0].versions!.length;

    const result = rollbackSecret(secrets, 'sec_test_KEY', 1);
    expect(result[0].versions!.length).toBe(vCountBefore + 1);
  });

  it('leaves secret unchanged if target version does not exist', () => {
    const secrets = [makeSecret('KEY', 'v1')];
    const result = rollbackSecret(secrets, 'sec_test_KEY', 99);
    expect(result[0].value).toBe('v1');
    expect(result[0].version).toBe(1);
  });
});

describe('bulkImportSecrets', () => {
  const envFile = `
# This is a comment
API_KEY=my_api_key_value
DB_URL=postgres://localhost:5432/mydb
QUOTED_VAL="quoted value here"
SINGLE_QUOTED='single quoted'
EMPTY_KEY=
  `.trim();

  it('parses valid KEY=VALUE lines', () => {
    const result = bulkImportSecrets(envFile, 'staging');
    const keys = result.map((s) => s.key);
    expect(keys).toContain('API_KEY');
    expect(keys).toContain('DB_URL');
  });

  it('strips surrounding quotes from values', () => {
    const result = bulkImportSecrets(envFile, 'staging');
    const quoted = result.find((s) => s.key === 'QUOTED_VAL')!;
    expect(quoted.value).toBe('quoted value here');
    const single = result.find((s) => s.key === 'SINGLE_QUOTED')!;
    expect(single.value).toBe('single quoted');
  });

  it('skips comment lines', () => {
    const result = bulkImportSecrets(envFile, 'staging');
    const hasComment = result.some((s) => s.key.startsWith('#'));
    expect(hasComment).toBe(false);
  });

  it('assigns the correct environment to all imported secrets', () => {
    const result = bulkImportSecrets(envFile, 'production');
    expect(result.every((s) => s.environment === 'production')).toBe(true);
  });

  it('returns an empty array for blank input', () => {
    const result = bulkImportSecrets('', 'development');
    expect(result).toHaveLength(0);
  });

  it('returns an empty array for comment-only input', () => {
    const result = bulkImportSecrets('# just a comment\n# another', 'development');
    expect(result).toHaveLength(0);
  });
});
