/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: { 950: '#07090c', 900: '#0b0f14', 850: '#10151c', 800: '#151b24', 700: '#1f2733', 600: '#2b3542', 500: '#3b4757' },
        signal: { DEFAULT: '#4fb3bf', dim: '#2c6f77' },
        verified: '#5fb98a', published: '#5b9bd5', reconstructed: '#d6a64a', model: '#c46ad6', pending: '#7b8796',
      },
    },
  },
  plugins: [],
}
