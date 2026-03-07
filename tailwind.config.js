/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  important: "#root",
  theme: {
    extend: {
      colors: {
        primary: "#2563EB",
        secondary: "#3B82F6",
        cta: "#F97316",
        dark: "#1E293B",
      },
    },
  },
  plugins: [],
}
