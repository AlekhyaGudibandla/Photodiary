/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0B0F",
        card: "#12121A",
        primary: "#7C3AED",
        secondary: "#10B981",
        muted: "#9CA3AF",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': 'radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.1) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.05) 0, transparent 50%)',
      }
    },
  },
  plugins: [],
}
