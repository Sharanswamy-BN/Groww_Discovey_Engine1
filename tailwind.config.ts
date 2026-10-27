import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        groww: {
          green: "#00D09C",
          greenDark: "#00B386",
          mint: "#EBF9F4",
          mint2: "#B2F0E1",
          blue: "#5367FF",
          text: "#44475B",
          muted: "#7C7E8C",
          line: "#E8E8ED",
          bg: "#FFFFFF",
          wash: "#F6F6F6",
          danger: "#EB5B3C",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 20, 43, 0.04), 0 8px 24px rgba(20, 20, 43, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
