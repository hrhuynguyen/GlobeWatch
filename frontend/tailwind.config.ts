import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#061112",
        ocean: "#07363d",
        alert: "#ff6b35",
        gold: "#f4c95d",
        mint: "#83e6c5"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Verdana", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 60px rgba(131, 230, 197, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
