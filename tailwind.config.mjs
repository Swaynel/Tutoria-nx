/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#0f1724', // very dark slate
        'brand-surface': '#111827',
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669'
        },
        muted: {
          400: '#9ca3af',
          500: '#6b7280'
        }
      }
    }
  }
}

export default config