import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#090b11',
        foreground: '#e5e7eb',
        card: '#121522',
        border: '#24304a',
        muted: '#9ca3af',
        primary: '#4f7dd1'
      }
    }
  },
  plugins: []
} satisfies Config;
