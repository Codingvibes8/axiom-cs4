import type { Metadata } from 'next';

// Tab-specific metadata map
const TAB_META: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  secrets: {
    title: 'Secrets Vault — Axiom Dashboard',
    description:
      'Manage, rotate, and audit encrypted secrets across development, staging, and production environments.',
    keywords: ['secrets vault', 'env variables', 'credential rotation', 'key management'],
  },
  diff: {
    title: 'Environment Diff — Axiom Dashboard',
    description:
      'Visually compare and synchronise secrets across environments. Detect drift and push changes with one click.',
    keywords: ['env diff', 'environment sync', 'secrets drift', 'configuration comparison'],
  },
  agents: {
    title: 'AI Agent Harness — Axiom Dashboard',
    description:
      'Issue scoped, ephemeral tokens for autonomous AI agents with TTL controls and emergency kill-switch.',
    keywords: ['ai agent harness', 'agent proxy', 'ephemeral token', 'llm security'],
  },
  team: {
    title: 'Team & RBAC — Axiom Dashboard',
    description:
      'Manage team members, roles, and per-environment access controls for your secrets project.',
    keywords: ['rbac', 'team management', 'secrets access control', 'permissions'],
  },
  activity: {
    title: 'Activity Audit — Axiom Dashboard',
    description:
      'Immutable audit trail of every secret access, rotation, and agent action in your project.',
    keywords: ['audit log', 'activity trail', 'secrets audit', 'compliance'],
  },
  settings: {
    title: 'Settings & KMS — Axiom Dashboard',
    description:
      'Configure encryption algorithms, MFA requirements, webhooks, and agent proxy firewall settings.',
    keywords: ['kms', 'encryption settings', 'mfa', 'webhook', 'secrets configuration'],
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const tab = params?.tab ?? 'secrets';
  const meta = TAB_META[tab] ?? TAB_META['secrets'];

  return {
    title: meta.title,
    description: meta.description,
    keywords: [
      ...meta.keywords,
      'axiom', 'secrets manager', 'developer tools',
    ],
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `/dashboard?tab=${tab}`,
      siteName: 'Axiom',
      type: 'website',
      images: [
        {
          url: '/og-dashboard.png',
          width: 1200,
          height: 630,
          alt: `Axiom — ${meta.title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: ['/og-dashboard.png'],
    },
    robots: {
      index: false, // Dashboard is app UI — keep private from search
      follow: false,
    },
  };
}

// Dashboard page — renders the full shell (client component)
export { default } from './dashboard-client';
