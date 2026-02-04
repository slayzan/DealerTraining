import animate from 'tailwindcss-animate';
/** @type {import('tailwindcss').Config} */
module.exports = {
  plugins: [require("tailwindcss-animate")],
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    animate,
  ],
} 
