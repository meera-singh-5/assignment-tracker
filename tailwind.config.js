/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1712C6',
        'primary-hover': '#1712C6',
        surface: '#c9c9c9',
        'surface-dark': '#B4B4B4',
      },
    },
  },
  plugins: [],
};
