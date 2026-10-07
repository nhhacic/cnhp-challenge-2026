import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#ff5722",
          foreground: "#ffffff",
          50: "#fff3e0",
          100: "#ffe0b2",
          500: "#ff5722",
          600: "#f4511e",
          700: "#e64a19",
        },
        strava: "#fc5200",
      },
    },
  },
  plugins: [],
} satisfies Config;
