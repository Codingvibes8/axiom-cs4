import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — Axiom',
  description:
    'Axiom Dashboard — manage secrets, agents, team access, and audit logs across all environments.',
  openGraph: {
    title: 'Dashboard — Axiom',
    description:
      'Enterprise-grade secrets manager with AI agent harness, environment diffing, and RBAC.',
    url: '/dashboard',
    siteName: 'Axiom',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard — Axiom',
    description: 'Enterprise-grade secrets manager and AI agent harness.',
  },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
