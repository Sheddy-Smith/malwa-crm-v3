/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#D32F2F',
        'brand-red-dark': '#B71C1C',
        'brand-blue': '#1E3A8A',
        'brand-dark': '#212121',
        'brand-gold': '#FFD700',
        'background': '#FFFFFF',
        'sidebar': '#1E3A8A',
        // Dark mode colors
        'dark-background': '#121212',
        'dark-card': '#1E1E1E',
        'dark-text': '#E0E0E0',
        'dark-text-secondary': '#A0A0A0',
      },
      borderRadius: {
        'xl': '14px',
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'dark-card': '0 4px 12px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '64': '16rem',
      },
      transitionTimingFunction: {
        'out': 'ease-out',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
