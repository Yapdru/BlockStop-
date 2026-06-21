import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Admin dark theme
        'admin-bg': '#0f1419',
        'admin-card': '#1a1f2e',
        'admin-border': '#2d3142',
        'admin-text': '#e4e6eb',
        'admin-text-muted': '#8a8d99',
        'admin-accent': '#3b82f6',
        'admin-success': '#10b981',
        'admin-warning': '#f59e0b',
        'admin-danger': '#ef4444',
      },
      backgroundImage: {
        'gradient-admin': 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
      },
      borderRadius: {
        'admin': '8px',
      },
      spacing: {
        'admin': '16px',
      },
    },
  },
  plugins: [],
}

export default config
