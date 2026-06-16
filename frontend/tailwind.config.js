/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#263138',
          50:  '#eef1f3',
          100: '#d4dde2',
          200: '#a9bbc5',
          300: '#7e99a8',
          400: '#53778b',
          500: '#3d5d6e',
          600: '#2e4a59',
          700: '#263138',  // ← primary brand
          800: '#1c2830',
          900: '#121e24',
          950: '#0a1317',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e8c96f',
          dark:  '#a07c2a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'brand': '0 4px 24px rgba(38,49,56,0.25)',
        'card':  '0 2px 16px rgba(0,0,0,0.08)',
        'glow':  '0 0 20px rgba(38,49,56,0.4)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                     to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
