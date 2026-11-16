/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          light: '#FBF9F5',      // Warm off-white
          dark: '#141417',       // Deep charcoal / night
          surfaceLight: '#FFFFFF',
          surfaceDark: '#1E1E24',
          cardLight: '#F5F2EB',
          cardDark: '#26262E',
          borderLight: '#E8E4DA',
          borderDark: '#32323D',
        },
        lavender: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        coral: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
        },
        ink: {
          DEFAULT: '#19181B',   // Deep rich text
          muted: '#686571',     // Secondary text
          light: '#8E8B99',     // Tertiary subtle text
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(20, 20, 23, 0.05)',
        'medium': '0 8px 30px -4px rgba(20, 20, 23, 0.08)',
        'elevated': '0 16px 40px -6px rgba(20, 20, 23, 0.12)',
      }
    },
  },
  plugins: [],
}
