# Axiom | Developer & AI Agent Secrets Management Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e.svg)](https://supabase.com/)

**Axiom** is an enterprise-grade secrets management platform built for modern engineering teams and autonomous AI agents. It eliminates secret drift, provides side-by-side environment comparison, records immutable rollback snapshots, and deploys a scoped proxy firewall to prevent raw credential exposure to LLMs.

---

## ⚡ Key Capabilities

### 1. 🤖 AI Agent Proxy Harness & Credential Firewall
- **Zero-Trust Scoped Keys**: Autonomous coding assistants (Claude Code, Auto-GPT, Cursor) only receive masked/ephemeral proxy credentials.
- **Hourly Quota & TTL Envelopes**: Limit token usage per hour and enforce automatic credential revocation.
- **Instant Killswitch**: Stop runaway autonomous agents with a single click.

### 2. 🔄 Side-by-Side Environment Diff & 1-Click Sync
- Compare secrets between **Development**, **Staging**, and **Production**.
- Detect missing variables, values drifts, and obsolete tokens before deployment.
- 1-click sync missing secrets across environments.

### 3. ⏪ Version History & Rollback Engine
- Every secret edit creates an encrypted version snapshot.
- View previous values, rotation timestamps, and authors.
- 1-click rollback to any historical version.

### 4. 👥 Granular RBAC & Team Environment Whitelisting
- Assign roles: `Owner`, `Admin`, `Developer`, `Viewer`, and `Agent Service Account`.
- Whitelist developer access to specific environments (e.g. prevent direct production access).

### 5. 📜 Immutable Audit Logs
- SOC-2 / ISO-27001 compliant event tracking.
- Export audit trail to **CSV** and **JSON**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
*(If Supabase credentials are not provided, `next dev` runs in demo mode. Secrets stay in memory and are never written to browser storage; set `NEXT_PUBLIC_DEMO_MODE=false` to disable demo logins.)*

### 3. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Authentication routes

| Route | Description |
|---|---|
| `/` | Public landing page |
| `/login` | Sign in / sign up with Supabase Auth, or demo access |
| `/dashboard` | Protected dashboard (server-side session check) |

Without Supabase credentials, `next dev` enables demo mode automatically. Production
builds require `NEXT_PUBLIC_DEMO_MODE=true` **and** no Supabase configuration.
Demo logins are not authenticated and must never be used with real secrets.

### Auth environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DEMO_MODE=false
```

The `/dashboard` route is guarded twice: by `proxy.ts` (session refresh + redirect)
and by the server component in `app/dashboard/page.tsx` (`auth.getUser()`).
`getSessionUser()` always verifies the JWT server-side; the browser-supplied user
object is never trusted for authorization.

**Security status:** this is a Phase 1 scaffold. Browser-side RBAC, environment
scoping, encrypted secret storage and production RLS policies are not implemented
yet. See the security review in the repository history before handling real data.

---

## 🗄️ Database Schema (Supabase / PostgreSQL)

The complete SQL schema with Row-Level Security (RLS) policies and triggers is located in [`supabase/schema.sql`](supabase/schema.sql).

> **Warning:** the current policies in `schema.sql` are permissive demo policies
> (`TO public USING (true)`). Replace them with membership/environment-scoped
> policies before connecting this app to real data. See Phase 2 of the security review.

To apply to your Supabase project:
1. Open the Supabase SQL Editor.
2. Paste the contents of `supabase/schema.sql`.
3. Run the migration query.

---

## 📁 Project Architecture

```
axiom/
├── app/
│   ├── globals.css          # Glassmorphism design tokens & styles
│   ├── layout.tsx           # Root Next.js layout & global provider
│   ├── page.tsx             # Public landing page
│   ├── login/page.tsx       # Auth route (server-side session check)
│   └── dashboard/page.tsx   # Protected dashboard (server-side session check)
├── proxy.ts                 # Session refresh & route protection (Next.js proxy)
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx      # Marketing hero, interactive demo & pricing
│   │   ├── AuthPage.tsx         # Supabase sign-in/sign-up + gated demo access
│   │   ├── LoginClient.tsx      # Client navigation wrapper for /login
│   │   ├── DashboardShell.tsx   # Sidebar navigation, env switcher & sign-out
│   │   ├── SecretsTab.tsx       # Vault CRUD, search, bulk .env, rollback
│   │   ├── DiffTab.tsx          # Side-by-side env compare & sync
│   │   ├── AgentHarnessTab.tsx  # Scoped proxy harness & live simulator
│   │   ├── TeamTab.tsx          # RBAC team permissions & service tokens
│   │   ├── ActivityTab.tsx      # Audit trail & CSV/JSON export
│   │   └── SettingsTab.tsx      # Envelope KMS rotation & webhook alerts
│   └── lib/
│       ├── types.ts             # TypeScript definitions
│       ├── seed.ts              # Mock baseline data
│       ├── store.ts             # React Context store (in-memory secrets)
│       ├── crypto.ts            # CSPRNG IDs/tokens/fingerprints
│       ├── auth-user.ts         # Supabase user → app user mapping
│       └── supabase/
│           ├── config.ts        # URL/key, demo flag, redirect guard
│           ├── client.ts        # Browser client (@supabase/ssr)
│           └── server.ts        # Server client + getSessionUser()
├── supabase/
│   └── schema.sql           # PostgreSQL table schemas & RLS policies
└── package.json
```
