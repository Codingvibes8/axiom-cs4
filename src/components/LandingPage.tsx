'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  GitCompare, 
  Bot, 
  Terminal, 
  CheckCircle2, 
  ArrowRight, 
  RotateCw, 
  Flame, 
  Sparkles, 
  Users, 
  Activity, 
  ShieldCheck
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'vault' | 'diff' | 'agents'>('agents');
  const [copiedCli, setCopiedCli] = useState(false);

  const cliSnippet = 'npx axiom-cli inject --env=production -- run npm start';

  const copyCli = () => {
    navigator.clipboard.writeText(cliSnippet);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950 bg-grid-pattern relative">
      {/* Glow Orbs */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-600/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-96 left-1/4 w-[400px] h-[300px] bg-teal-500/10 blur-[110px] rounded-full pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Shield className="w-5 h-5 text-zinc-950 font-black" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent">
                AXIOM
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-zinc-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#diff" className="hover:text-emerald-400 transition-colors">Diff Matrix</a>
            <a href="#agent-harness" className="hover:text-emerald-400 transition-colors">AI Agent Proxy</a>
            <a href="#security" className="hover:text-emerald-400 transition-colors">Security</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onEnterApp}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
            >
              <span>Launch Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-20 px-6 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Next-Gen Zero-Trust Vault & AI Proxy Harness</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Stop Leaking Secrets to{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
            Autonomous AI Agents
          </span>
        </h1>

        <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Enterprise secrets management with side-by-side environment diffing, instant rollback history, and scoped credential proxies for Claude Code, Auto-GPT, and LLMs.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-8 py-4 text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black rounded-2xl shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2.5"
          >
            <span>Open Demo Vault</span>
            <ArrowRight className="w-4 h-4 text-zinc-950" />
          </button>

          <button
            onClick={copyCli}
            className="w-full sm:w-auto px-6 py-4 text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-2xl border border-zinc-800 transition-all flex items-center justify-center gap-2"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>{copiedCli ? 'Copied to Clipboard!' : cliSnippet}</span>
          </button>
        </div>

        {/* Hero Interactive Terminal & Interactive Tab Mockup */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="glass-panel-elevated rounded-3xl p-6 border border-zinc-800 bg-zinc-900/80 text-left space-y-5">
            {/* Window Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-zinc-400 ml-2">axiom-interactive-console v2.4</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveShowcaseTab('agents')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    activeShowcaseTab === 'agents' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  AI Agent Harness
                </button>
                <button
                  onClick={() => setActiveShowcaseTab('diff')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    activeShowcaseTab === 'diff' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  Env Diff Sync
                </button>
                <button
                  onClick={() => setActiveShowcaseTab('vault')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    activeShowcaseTab === 'vault' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  Rollback Vault
                </button>
              </div>
            </div>

            {/* Showcase Visual Content */}
            {activeShowcaseTab === 'agents' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-emerald-400 space-y-1">
                  <div>$ axiom agent proxy --target=&quot;claude-code&quot; --ttl=15m</div>
                  <div className="text-zinc-400">✓ Intercepted request from agent ID [usr_claude_991]</div>
                  <div className="text-teal-300">✓ Masked raw OPENAI_API_KEY: [sk-proj-••••••••••••bc10]</div>
                  <div className="text-emerald-300">✓ Hourly token budget active: 18,420 / 50,000 tokens</div>
                </div>

                <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-emerald-500/20">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>Harness Status: Active Sandbox Proxy</span>
                  </div>
                  <button
                    onClick={onEnterApp}
                    className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg font-sans font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <Flame className="w-3 h-3 fill-rose-400" /> Test Killswitch
                  </button>
                </div>
              </div>
            )}

            {activeShowcaseTab === 'diff' && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                  <div className="text-white font-bold">DATABASE_URL</div>
                  <div className="text-zinc-400">Dev: localhost:5432</div>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                  <div className="text-teal-400">Prod: db.us-east-1.supabase.co</div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Synced</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                  <div className="text-white font-bold">STRIPE_SECRET_KEY</div>
                  <div className="text-zinc-400">Dev: rk_test_...</div>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                  <div className="text-rose-400">Prod: MISSING IN PROD</div>
                  <button
                    onClick={onEnterApp}
                    className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-sans font-semibold"
                  >
                    1-Click Sync
                  </button>
                </div>
              </div>
            )}

            {activeShowcaseTab === 'vault' && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="text-white font-bold">OPENAI_API_KEY (v3 - Current)</div>
                    <div className="text-zinc-500 text-[10px]">Rotated 10 minutes ago by sarah.sec@axiom.dev</div>
                  </div>
                  <span className="text-emerald-400 font-sans text-xs">Active</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono opacity-70">
                  <div>
                    <div className="text-zinc-300 font-bold">OPENAI_API_KEY (v2 - Historical)</div>
                    <div className="text-zinc-500 text-[10px]">Archived snapshot</div>
                  </div>
                  <button
                    onClick={onEnterApp}
                    className="px-2 py-0.5 bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white rounded text-[10px] font-sans transition-colors"
                  >
                    Rollback
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Engineered for Modern Engineering & Security Teams
          </h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-white">
            Everything your team needs to manage secrets safely
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">AI Agent Scoped Harness</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Issue ephemeral tokens with hourly budget caps and automatic output masking so LLMs and autonomous agents can execute safely without risking raw credential leakage.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <GitCompare className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Environment Diff & Sync</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instantly identify missing keys between Development, Staging, and Production. Sync drifted secrets with 1-click and eliminate &quot;works on my machine&quot; deployment failures.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <RotateCw className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Immutable Rollback Snapshots</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every secret edit creates an encrypted version snapshot. Revert bad rotations or broken keys back to any point in time with full audit accountability.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">SOC-2 Audit Trail</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Immutable logs for every secret access, proxy query, key creation, and killswitch activation. Exportable directly to CSV and JSON for compliance reviews.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Granular RBAC Segmentation</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Whitelist team members to specific environments. Prevent junior devs or third-party contractors from accessing production credentials.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 space-y-4 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">AES-256-GCM Envelope KMS</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Zero-knowledge client-side encryption envelope. Your secrets remain ciphered at rest, in transit, and during proxy execution.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Simple, Transparent Pricing
          </h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-white">
            Built for indie devs up to high-scale enterprise teams
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Community */}
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-white">Developer</h4>
                <p className="text-xs text-zinc-400">For individual builders & side projects</p>
              </div>
              <div className="text-3xl font-extrabold text-white">$0 <span className="text-xs text-zinc-400 font-normal">/ month</span></div>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited local secrets</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1 AI Agent Harness</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Environment Diff Matrix</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 7-day version history</li>
              </ul>
            </div>
            <button
              onClick={onEnterApp}
              className="w-full py-2.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl"
            >
              Get Started Free
            </button>
          </div>

          {/* Pro */}
          <div className="glass-panel-elevated p-6 rounded-3xl border border-emerald-500/50 bg-zinc-900 space-y-5 flex flex-col justify-between relative shadow-2xl shadow-emerald-500/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Most Popular
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-white">Team & AI Pro</h4>
                <p className="text-xs text-emerald-300">For fast-moving engineering teams</p>
              </div>
              <div className="text-3xl font-extrabold text-white">$29 <span className="text-xs text-zinc-400 font-normal">/ member / month</span></div>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited AI Agent Proxies</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Real-time Killswitch & Quota</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Unlimited Version Rollback</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Granular RBAC Permissions</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 90-day SOC-2 Audit Trail</li>
              </ul>
            </div>
            <button
              onClick={onEnterApp}
              className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30"
            >
              Launch 14-Day Free Trial
            </button>
          </div>

          {/* Enterprise */}
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold text-white">Enterprise KMS</h4>
                <p className="text-xs text-zinc-400">For regulated high-security organizations</p>
              </div>
              <div className="text-3xl font-extrabold text-white">Custom</div>
              <ul className="space-y-2 text-xs text-zinc-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dedicated KMS Key Rings (AWS/GCP)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> On-Premise Agent Gateways</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> SSO & SAML / Okta Integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 24/7 SecOps Incident Support</li>
              </ul>
            </div>
            <button
              onClick={onEnterApp}
              className="w-full py-2.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl"
            >
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 py-12 px-6 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-zinc-950 font-black">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-white">AXIOM SECRETS & AI HARNESS</span>
          <span>© 2026 All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-zinc-300">Privacy Policy</a>
          <a href="#security" className="hover:text-zinc-300">Security Architecture</a>
          <a href="#pricing" className="hover:text-zinc-300">API Documentation</a>
          <button onClick={onEnterApp} className="text-emerald-400 font-semibold hover:underline">
            Launch Console
          </button>
        </div>
      </footer>
    </div>
  );
};
