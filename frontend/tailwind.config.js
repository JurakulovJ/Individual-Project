/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#36abf7',
          500: '#0c8fe9',
          600: '#0171c7',
          700: '#025aa1',
          800: '#064d85',
          900: '#0b416e',
          950: '#072a49',
        },
        travel: {
          dark: '#0B0F19',
          card: '#111827',
          surface: '#1F2937',
          accent: '#10B981',
          coral: '#F43F5E',
          gold: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 25px -5px rgba(12, 143, 233, 0.3)',
      },
    },
  },
  plugins: [],
};
