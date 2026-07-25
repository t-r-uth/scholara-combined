import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
      colors: {
        surface: { 1: 'var(--surface-1)', 2: 'var(--surface-2)' },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
          accent: 'var(--border-accent)',
          success: 'var(--border-success)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
          success: 'var(--text-success)',
        },
        bg: {
          accent: 'var(--bg-accent)',
          success: 'var(--bg-success)',
        },
      },
      borderRadius: { DEFAULT: 'var(--radius)' },
    },
  },
  plugins: [],
}
export default config
