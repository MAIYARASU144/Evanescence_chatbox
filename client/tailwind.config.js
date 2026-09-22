/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          950: '#0a0a0f',
          900: '#0f0f1a',
          800: '#1a1a2e',
          700: '#2a2a3e',
          600: '#3a3a52',
          500: '#6b6b8a',
          400: '#9090a8',
          300: '#b8b8cc',
          200: '#d4d4e0',
          100: '#ebebf0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
