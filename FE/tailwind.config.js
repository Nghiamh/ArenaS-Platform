/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        danger: '#EF4444',
        accent: {
          primary: 'rgba(var(--accent-primary-rgb), <alpha-value>)',
          secondary: 'rgba(var(--accent-secondary-rgb), <alpha-value>)',
          light: 'rgba(var(--accent-light-rgb), <alpha-value>)',
        },
        deep: 'var(--bg-deep)',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        inter: ['Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
