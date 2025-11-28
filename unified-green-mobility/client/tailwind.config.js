/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'neon-pink': '#ff006e',
        'neon-blue': '#00f5ff',
        'neon-green': '#00ff41',
        'neon-orange': '#ff9500',
      },
    },
  },
  plugins: [],
}

