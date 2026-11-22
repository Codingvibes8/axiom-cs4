# Graph Report - axiom  (2026-11-21)

## Corpus Check
- 53 files · ~30,092 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 304 nodes · 514 edges · 27 communities (19 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `84993265`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- store.ts
- supabase.ts
- devDependencies
- compilerOptions
- isSupabaseConfigured
- dependencies
- scripts
- axiom-sync.js
- CommandPalette.tsx
- store.test.ts
- next.config.ts
- app/page.tsx
- auth/layout.tsx
- dashboard/layout.tsx
- eslint.config.mjs
- postcss.config.mjs
- tailwind.config.ts
- ⚡ Key Capabilities
- Axiom Action — `codingvibes8/axiom-action`
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `useAxiomStore()` - 23 edges
2. `compilerOptions` - 16 edges
3. `isSupabaseConfigured` - 13 edges
4. `scripts` - 12 edges
5. `AuthPage()` - 10 edges
6. `AxiomStoreContextType` - 9 edges
7. `listFactors()` - 9 edges
8. `Environment` - 9 edges
9. `User` - 9 edges
10. `Axiom Action — `codingvibes8/axiom-action`` - 9 edges

## Surprising Connections (you probably didn't know these)
- `DashboardClientPageProps` --references--> `User`  [EXTRACTED]
  app/dashboard/dashboard-client.tsx → src/lib/types.ts
- `DashboardClientPage()` --calls--> `signOut()`  [EXTRACTED]
  app/dashboard/dashboard-client.tsx → src/lib/supabase.ts
- `DashboardPage()` --calls--> `getSessionUser()`  [EXTRACTED]
  app/dashboard/page.tsx → src/lib/supabase/server.ts
- `DashboardShell()` --references--> `react`  [EXTRACTED]
  src/components/DashboardShell.tsx → package.json
- `proxy()` --calls--> `safeRedirectPath()`  [EXTRACTED]
  proxy.ts → src/lib/supabase/config.ts

## Import Cycles
- None detected.

## Communities (27 total, 8 thin omitted)

### Community 0 - "store.ts"
Cohesion: 0.14
Nodes (32): DashboardClientPage(), DashboardClientPageProps, ActivityTab(), AgentHarnessTab(), AgentTTLBadge(), DashboardShell(), DashboardShellProps, DiffTab() (+24 more)

### Community 1 - "supabase.ts"
Cohesion: 0.13
Nodes (28): AuthPage(), AuthPageProps, AuthView, SettingsTab(), TwoFactorChallengeModal(), TwoFactorChallengeModalProps, generateDemoSecret(), TwoFactorSetup() (+20 more)

### Community 2 - "devDependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, jsdom, devDependencies, eslint, eslint-config-next, jsdom, @playwright/test (+27 more)

### Community 3 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "isSupabaseConfigured"
Cohesion: 0.13
Nodes (15): DashboardPage(), TAB_META, LoginPage(), LoginPageProps, metadata, config, proxy(), LoginClient() (+7 more)

### Community 5 - "dependencies"
Cohesion: 0.07
Nodes (26): metadata, canvas-confetti, clsx, lucide-react, next, dependencies, canvas-confetti, clsx (+18 more)

### Community 6 - "scripts"
Cohesion: 0.12
Nodes (15): name, private, scripts, build, dev, lint, start, test (+7 more)

### Community 7 - "axiom-sync.js"
Cohesion: 0.29
Nodes (11): apiRequest(), assertConfig(), fs, http, https, main(), parseEnvFile(), path (+3 more)

### Community 8 - "CommandPalette.tsx"
Cohesion: 0.32
Nodes (7): CATEGORY_ICONS, CommandPalette(), CommandPaletteProps, ENV_COLORS, fuzzyMatch(), scoreResult(), SearchResult

### Community 10 - "next.config.ts"
Cohesion: 0.33
Nodes (4): contentSecurityPolicy, nextConfig, securityHeaders, supabaseOrigins

### Community 23 - "⚡ Key Capabilities"
Cohesion: 0.12
Nodes (15): 1. 🤖 AI Agent Proxy Harness & Credential Firewall, 1. Install Dependencies, 2. Configure Environment (Optional), 2. 🔄 Side-by-Side Environment Diff & 1-Click Sync, 3. Start Development Server, 3. ⏪ Version History & Rollback Engine, 4. 👥 Granular RBAC & Team Environment Whitelisting, 5. 📜 Immutable Audit Logs (+7 more)

### Community 24 - "Axiom Action — `codingvibes8/axiom-action`"
Cohesion: 0.15
Nodes (12): Axiom Action — `codingvibes8/axiom-action`, GitHub Secrets Required, Inputs, License, Outputs, Overview, Quick Start, Requirements (+4 more)

## Knowledge Gaps
- **121 isolated node(s):** `metadata`, `metadata`, `TAB_META`, `metadata`, `metadata` (+116 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `react` connect `dependencies` to `store.ts`?**
  _High betweenness centrality (0.202) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `scripts`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `TAB_META` to the rest of the system?**
  _121 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `store.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13953488372093023 - nodes in this community are weakly interconnected._
- **Should `supabase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13063063063063063 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._