/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cpu-blue': '#3B82F6',
        'cpu-gray': '#6B7280',
        'cpu-green': '#10B981',
        'cpu-red': '#EF4444',
        'cpu-yellow': '#F59E0B',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'data-flow': 'dataFlow 1s ease-in-out',
      },
      keyframes: {
        dataFlow: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
} 