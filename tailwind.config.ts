import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'hsl(var(--primary) / <alpha-value>)',
        surfaceZinc: 'hsl(var(--surface-zinc) / <alpha-value>)',
        borderGlass: 'hsl(var(--border-glass) / <alpha-value>)',
        meshPrimary: 'hsl(var(--mesh-primary) / <alpha-value>)',
        meshSecondary: 'hsl(var(--mesh-secondary) / <alpha-value>)',
        meshAccent: 'hsl(var(--mesh-accent) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

export default config;
