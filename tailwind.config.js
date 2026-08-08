/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        privacy: {
          dark: '#F8FAFC',
          card: '#FFFFFF',
          border: '#e5e0d3',
          accent: '#8a7a5c', // Beige primary accent
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          cyan: '#06B6D4'
        },
        beige: {
          50: '#F7F5EF',
          100: '#EFE8DA',
          200: '#E4DCC5',
          300: '#F0E4C6',
          400: '#e5e0d3',
          500: '#9a9890',
          600: '#7a5f1f',
          700: '#6b5b3a',
          800: '#6b6a64',
          900: '#8a7a5c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(138, 122, 92, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(138, 122, 92, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
