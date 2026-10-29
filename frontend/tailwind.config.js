/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lnmiit-blue': '#005a9c',
        'lnmiit-orange': '#e35205',
      }
    },
  },
  plugins: [],
};
