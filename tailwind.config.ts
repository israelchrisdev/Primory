import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          violet: '#6C3BFF',
          bg: '#F8F9FC',
          text: '#1A1A1A',
          pink: '#FF6EC7',
          sky: '#6ED3FF',
          gold: '#F5C76B',
        },
      },
      boxShadow: {
        soft: '0 12px 32px rgba(108, 59, 255, 0.15)',
      },
      backgroundImage: {
        hero: 'linear-gradient(135deg, rgba(108, 59, 255, 0.95), rgba(255, 110, 199, 0.85), rgba(110, 211, 255, 0.8))',
      },
    },
  },
  plugins: [],
} satisfies Config;
