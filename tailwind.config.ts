import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#d32f2f',
          hover: '#b71c1c',
          light: '#ffebee',
        },
        canvas: '#f8fafc',
        surface: '#ffffff',
        charcoal: {
          DEFAULT: '#17191d',
          soft: '#22252b',
          line: '#343840',
        },
        ink: '#0f172a',
        line: '#e2e8f0',
        slate: {
          950: '#020617',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
      },
    },
  },
  plugins: [],
};
export default config;
