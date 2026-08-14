import type { Metadata } from 'next';
import './globals.css';
import { AxiomProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Axiom | Developer & AI Agent Secrets Management',
  description: 'Enterprise-grade secrets manager, environment diff synchronization, and scoped proxy harness for autonomous AI agents.',
  keywords: ['secrets manager', 'ai agent proxy', 'env sync', 'developer tools', 'supabase', 'credential firewall'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950">
        <AxiomProvider>
          {children}
        </AxiomProvider>
      </body>
    </html>
  );
}
