/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["DM Sans", "sans-serif"]
      },
      colors: {
        ink: "#111827",
        sand: "#edf4f8",
        coral: "#2563eb",
        mint: "#99f6e4",
        sea: "#0f766e"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(19,34,56,0.12)"
      }
    }
  },
  plugins: []
};
