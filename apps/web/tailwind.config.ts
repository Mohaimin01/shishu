import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F7F5F0",
        surface: "#FFFFFF",
        text: "#2B2B2B",
        muted: "#6B6B6B",
        primary: "#6B9080",
        "primary-dark": "#4F7064",
        secondary: "#C9A9A6",
        accent: "#D4A373",
        success: "#7FA99B",
        warning: "#D4A373",
        danger: "#C97A7A",
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem",
        "3xl": "2.5rem",
      },
      transitionDuration: {
        gentle: "400ms",
      },
      transitionTimingFunction: {
        gentle: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
