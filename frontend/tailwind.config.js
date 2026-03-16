/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'jatayu-dark': '#0a0a0f',
        'jatayu-panel': '#12121a',
        'jatayu-border': '#1e1e2e',
        'jatayu-accent': '#6c5ce7',
        'jatayu-danger': '#ff4757',
        'jatayu-success': '#2ed573',
        'jatayu-warn': '#ffa502',
      },
      animation: {
        'pulse-danger': 'pulse-danger 1s ease-in-out infinite',
      },
      keyframes: {
        'pulse-danger': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 71, 87, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(255, 71, 87, 0)' },
        },
      },
    },
  },
  plugins: [],
}

