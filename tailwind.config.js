/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        'primary-hover': '#4338CA',
        surface: '#F9FAFB',
        'surface-dark': '#1F2937',
      },
    },
  },
  plugins: [],
};
