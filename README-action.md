# Axiom Action — `codingvibes8/axiom-action`

[![CI](https://github.com/codingvibes8/axiom/actions/workflows/ci.yml/badge.svg)](https://github.com/codingvibes8/axiom/actions/workflows/ci.yml)
[![GitHub Marketplace](https://img.shields.io/badge/GitHub%20Marketplace-Axiom%20Secrets%20Sync-brightgreen?logo=github)](https://github.com/marketplace/actions/axiom-secrets-sync)

> **Sync `.env` secrets to your Axiom vault or validate secrets drift — directly in your CI/CD pipelines.**

---

## Overview

The `codingvibes8/axiom-action` GitHub Action integrates [Axiom](https://github.com/codingvibes8/axiom) — the enterprise secrets manager for developers and AI agents — into any GitHub Actions workflow.

Two modes are supported:

| Mode | Description |
|------|-------------|
| `validate` *(default)* | Compare a `.env` file against your Axiom vault and report drift |
| `sync` | Push all `.env` key/value pairs to your Axiom vault |

---

## Quick Start

### Validate secrets drift on every PR

```yaml
# .github/workflows/secrets-check.yml
name: Secrets Drift Check

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check Axiom Secrets Drift
        uses: codingvibes8/axiom-action@v1
        with:
          axiom_api_url: ${{ secrets.AXIOM_API_URL }}
          axiom_project_id: ${{ secrets.AXIOM_PROJECT_ID }}
          axiom_token: ${{ secrets.AXIOM_AGENT_TOKEN }}
          env_file: '.env.example'
          environment: 'production'
          mode: 'validate'
          fail_on_drift: 'true'
```

### Sync secrets to vault on push to main

```yaml
# .github/workflows/sync-secrets.yml
name: Sync Secrets to Axiom

on:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Sync to Axiom Vault
        uses: codingvibes8/axiom-action@v1
        with:
          axiom_api_url: ${{ secrets.AXIOM_API_URL }}
          axiom_project_id: ${{ secrets.AXIOM_PROJECT_ID }}
          axiom_token: ${{ secrets.AXIOM_AGENT_TOKEN }}
          env_file: '.env.production'
          environment: 'production'
          mode: 'sync'
```

---

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `axiom_api_url` | ✅ | — | Base URL of your Axiom deployment (e.g. `https://your-axiom.vercel.app`) |
| `axiom_project_id` | ✅ | — | Axiom project ID to sync secrets into |
| `axiom_token` | ✅ | — | Axiom agent harness API token — **store as a GitHub secret** |
| `env_file` | ❌ | `.env` | Path to the `.env` file to sync or validate |
| `environment` | ❌ | `production` | Target environment: `development`, `staging`, or `production` |
| `mode` | ❌ | `validate` | Action mode: `sync` or `validate` |
| `fail_on_drift` | ❌ | `true` | Exit with code 1 if drift is detected (validate mode only) |

---

## Outputs

| Output | Description |
|--------|-------------|
| `secrets_synced` | Number of secrets successfully synced (sync mode) |
| `drift_detected` | `true` if drift was found (validate mode) |
| `drift_count` | Number of drifting secrets (validate mode) |

### Using outputs

```yaml
- name: Axiom Validate
  id: axiom
  uses: codingvibes8/axiom-action@v1
  with:
    axiom_api_url: ${{ secrets.AXIOM_API_URL }}
    axiom_project_id: ${{ secrets.AXIOM_PROJECT_ID }}
    axiom_token: ${{ secrets.AXIOM_AGENT_TOKEN }}
    mode: validate
    fail_on_drift: 'false'

- name: Report drift
  if: steps.axiom.outputs.drift_detected == 'true'
  run: echo "⚠️ ${{ steps.axiom.outputs.drift_count }} secrets are out of sync!"
```

---

## GitHub Secrets Required

Add these to your repository at **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `AXIOM_API_URL` | Your Axiom deployment URL |
| `AXIOM_PROJECT_ID` | Your project ID from the Axiom dashboard |
| `AXIOM_AGENT_TOKEN` | An active Axiom Agent Harness token with the required secret scopes |

> [!CAUTION]
> Never commit your `AXIOM_AGENT_TOKEN` to source code. Always use GitHub Secrets.

---

## Versioning

| Ref | Points to |
|-----|-----------|
| `codingvibes8/axiom-action@v1` | Latest v1.x release (recommended) |
| `codingvibes8/axiom-action@v1.0.0` | Pinned patch release |
| `codingvibes8/axiom-action@main` | Bleeding edge (not recommended for production) |

---

## Requirements

- No additional dependencies — the action uses only Node.js built-ins.
- Node.js 18+ (available on all `ubuntu-latest` GitHub runners).

---

## License

MIT — see [LICENSE](./LICENSE)
