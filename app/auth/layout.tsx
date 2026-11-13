import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — Axiom',
  description:
    'Sign in to Axiom — the enterprise secrets manager and AI agent harness for modern development teams.',
  openGraph: {
    title: 'Sign In — Axiom',
    description:
      'Securely manage secrets, diff environments, and control AI agent access with Axiom.',
    url: '/auth',
    siteName: 'Axiom',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign In — Axiom',
    description: 'Enterprise-grade secrets management and AI agent harness.',
  },
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
