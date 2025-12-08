/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#C724F6",
        "secondary": "#E13CC9",
        "background": "#0E0C1B",
        "card": "#1C152C",
        "success": "#3CFF72",
        "error": "#FF3C55",
        "text-primary": "#FFFFFF",
        "text-secondary": "#CFCFCF",
        "yellow-neon": "#F2D14F",
        "purple-neon": "#9B4DFF",
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      boxShadow: {
        "neon": "0 0 20px rgba(199, 36, 246, 0.5)",
        "neon-pink": "0 0 20px rgba(225, 60, 201, 0.5)",
      },
    },
  },
  plugins: [],
}
