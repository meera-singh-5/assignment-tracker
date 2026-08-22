/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        'primary-hover': '#4338CA',
        surface: '#c9c9c9',
        'surface-dark': '#B4B4B4',
      },
    },
  },
  plugins: [],
};
