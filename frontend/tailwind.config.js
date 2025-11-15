/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // LeetCode-style dark theme colors
        dark: {
          bg: '#1a1a1a',        // Main background
          'bg-secondary': '#1e1e1e',  // Secondary background
          'bg-tertiary': '#2d2d2d',   // Card backgrounds
          'bg-hover': '#3a3a3a',      // Hover states
          border: '#3a3a3a',          // Borders
          'border-light': '#4a4a4a',  // Lighter borders
          text: '#e5e5e5',            // Primary text
          'text-secondary': '#b3b3b3', // Secondary text
          'text-muted': '#888888',     // Muted text
        }
      }
    },
  },
  plugins: [],
}

