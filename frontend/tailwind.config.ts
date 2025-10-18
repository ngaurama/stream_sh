import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        accent: 'var(--accent)',
        card: 'color-mix(in srgb, var(--foreground) 5%, var(--background))',
      },
    },
  },
  plugins: [],
} satisfies Config
