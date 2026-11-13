import type { Metadata } from 'next';
import './globals.css';
import { AxiomProvider } from '@/lib/store';

export const metadata: Metadata = {
  metadataBase: new URL('https://axiom-vault.vercel.app'),
  title: {
    default: 'Axiom | Developer & AI Agent Secrets Management',
    template: '%s | Axiom',
  },
  description:
    'Enterprise-grade secrets manager, environment diff synchronization, and scoped proxy harness for autonomous AI agents.',
  keywords: [
    'secrets manager',
    'ai agent proxy',
    'env sync',
    'developer tools',
    'supabase',
    'credential firewall',
    'environment variables',
    'key management',
    'rbac',
    'zero-trust',
  ],
  authors: [{ name: 'codingvibes8', url: 'https://github.com/codingvibes8' }],
  creator: 'codingvibes8',
  openGraph: {
    title: 'Axiom | Developer & AI Agent Secrets Management',
    description:
      'Enterprise-grade secrets manager with AI agent harness, environment diffing, RBAC, and audit logs.',
    url: '/',
    siteName: 'Axiom',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Axiom — Developer & AI Agent Secrets Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@codingvibes8',
    creator: '@codingvibes8',
    title: 'Axiom | Developer & AI Agent Secrets Management',
    description:
      'Enterprise-grade secrets manager with AI agent harness, environment diffing, and RBAC.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950">
        {/* JSON-LD Structured Data — hoisted by Next.js to <head> */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Axiom',
              applicationCategory: 'DeveloperApplication',
              description:
                'Enterprise-grade secrets manager and AI agent harness for modern development teams.',
              url: 'https://axiom-vault.vercel.app',
              author: {
                '@type': 'Person',
                name: 'codingvibes8',
                url: 'https://github.com/codingvibes8',
              },
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
        <AxiomProvider>
          {children}
        </AxiomProvider>
      </body>
    </html>
  );
}
