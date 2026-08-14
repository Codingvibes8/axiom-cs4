#!/usr/bin/env node
/**
 * axiom-sync.js
 * Axiom GitHub Action runner — parses a .env file and either:
 *   - sync:     POSTs each key/value to the Axiom API
 *   - validate: compares the .env file against the vault and reports drift
 *
 * Environment variables (set by action.yml):
 *   AXIOM_API_URL    - Base URL of the Axiom deployment
 *   AXIOM_PROJECT_ID - Axiom project ID
 *   AXIOM_TOKEN      - Axiom agent harness API token
 *   ENV_FILE         - Path to the .env file (default: .env)
 *   ENVIRONMENT      - Target environment (development|staging|production)
 *   MODE             - "sync" or "validate"
 *   FAIL_ON_DRIFT    - "true" to exit 1 on drift in validate mode
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ---------------------------------------------------------------------------
// Configuration from environment
// ---------------------------------------------------------------------------
const {
  AXIOM_API_URL,
  AXIOM_PROJECT_ID,
  AXIOM_TOKEN,
  ENV_FILE = '.env',
  ENVIRONMENT = 'production',
  MODE = 'validate',
  FAIL_ON_DRIFT = 'true',
} = process.env;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function assertConfig() {
  const missing = [];
  if (!AXIOM_API_URL) missing.push('AXIOM_API_URL (axiom_api_url input)');
  if (!AXIOM_PROJECT_ID) missing.push('AXIOM_PROJECT_ID (axiom_project_id input)');
  if (!AXIOM_TOKEN) missing.push('AXIOM_TOKEN (axiom_token input)');
  if (missing.length) {
    console.error(`::error::Missing required inputs:\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Parse .env file
// ---------------------------------------------------------------------------
function parseEnvFile(filePath) {
  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`::error::env file not found: ${absPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(absPath, 'utf8');
  const entries = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let val = trimmed.substring(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.substring(1, val.length - 1);
    }
    if (key) entries[key] = val;
  }

  return entries;
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------
function apiRequest(method, urlStr, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const payload = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Axiom-Project': AXIOM_PROJECT_ID,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// GitHub Actions output helper
// ---------------------------------------------------------------------------
function setOutput(name, value) {
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `${name}=${value}\n`);
  } else {
    console.log(`::set-output name=${name}::${value}`);
  }
}

// ---------------------------------------------------------------------------
// Mode: sync
// ---------------------------------------------------------------------------
async function runSync(entries) {
  console.log(`\n🔄 Axiom Sync — pushing ${Object.keys(entries).length} secrets to ${ENVIRONMENT}...`);

  let synced = 0;
  let failed = 0;

  for (const [key, value] of Object.entries(entries)) {
    try {
      const res = await apiRequest(
        'POST',
        `${AXIOM_API_URL}/api/secrets/upsert`,
        { project_id: AXIOM_PROJECT_ID, key, value, environment: ENVIRONMENT },
        AXIOM_TOKEN
      );
      if (res.status >= 200 && res.status < 300) {
        console.log(`  ✅ ${key}`);
        synced++;
      } else {
        console.error(`  ❌ ${key} — HTTP ${res.status}: ${JSON.stringify(res.body)}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ ${key} — ${err.message}`);
      failed++;
    }
  }

  setOutput('secrets_synced', synced);
  console.log(`\n📊 Sync complete: ${synced} synced, ${failed} failed`);

  if (failed > 0) {
    console.error(`::error::${failed} secret(s) failed to sync`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Mode: validate
// ---------------------------------------------------------------------------
async function runValidate(localEntries) {
  console.log(`\n🔍 Axiom Validate — checking drift against ${ENVIRONMENT} vault...`);

  let vaultEntries = {};

  try {
    const res = await apiRequest(
      'GET',
      `${AXIOM_API_URL}/api/secrets?project_id=${AXIOM_PROJECT_ID}&environment=${ENVIRONMENT}`,
      null,
      AXIOM_TOKEN
    );
    if (res.status === 200 && Array.isArray(res.body)) {
      for (const s of res.body) {
        vaultEntries[s.key] = s.value;
      }
    } else {
      console.warn(`::warning::Could not fetch vault secrets (HTTP ${res.status}) — skipping vault comparison`);
    }
  } catch (err) {
    console.warn(`::warning::Failed to reach Axiom API: ${err.message} — skipping vault comparison`);
  }

  const driftItems = [];

  // Keys in .env but missing from vault
  for (const key of Object.keys(localEntries)) {
    if (!(key in vaultEntries)) {
      driftItems.push({ key, reason: 'Missing in vault' });
    } else if (localEntries[key] !== vaultEntries[key]) {
      driftItems.push({ key, reason: 'Value mismatch' });
    }
  }

  // Keys in vault but missing from .env
  for (const key of Object.keys(vaultEntries)) {
    if (!(key in localEntries)) {
      driftItems.push({ key, reason: 'Missing in .env file' });
    }
  }

  const driftDetected = driftItems.length > 0;
  setOutput('drift_detected', String(driftDetected));
  setOutput('drift_count', String(driftItems.length));

  if (driftDetected) {
    console.log(`\n⚠️  Drift detected — ${driftItems.length} issue(s):`);
    for (const item of driftItems) {
      console.log(`  🔸 ${item.key}: ${item.reason}`);
      console.log(`::warning::Drift: ${item.key} — ${item.reason}`);
    }

    if (FAIL_ON_DRIFT === 'true') {
      console.error(`\n::error::Secrets drift detected between .env and Axiom vault. See warnings above.`);
      process.exit(1);
    }
  } else {
    console.log('\n✅ No drift detected — .env matches the vault perfectly.');
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
async function main() {
  assertConfig();

  const localEntries = parseEnvFile(ENV_FILE);
  const keyCount = Object.keys(localEntries).length;
  console.log(`\n🛡️  Axiom Action (mode: ${MODE})`);
  console.log(`   Project : ${AXIOM_PROJECT_ID}`);
  console.log(`   Env     : ${ENVIRONMENT}`);
  console.log(`   File    : ${ENV_FILE} (${keyCount} keys)`);

  if (MODE === 'sync') {
    await runSync(localEntries);
  } else if (MODE === 'validate') {
    await runValidate(localEntries);
  } else {
    console.error(`::error::Unknown mode "${MODE}". Use "sync" or "validate".`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`::error::Unhandled error: ${err.message}`);
  process.exit(1);
});
