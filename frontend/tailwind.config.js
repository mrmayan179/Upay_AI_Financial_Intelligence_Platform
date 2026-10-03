/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        upayYellow: '#FFC820',
        upayBlue: '#0047BA',
        upayNavy: '#002C6C',
        upayPill: '#FFF6D1'
      },
      fontFamily: {
        sans: ['"Hind Siliguri"', 'Inter', 'sans-serif'],
        bengali: ['"Hind Siliguri"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
