import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        paper: "#f7f8f5",
        line: "#d9ded8",
        teal: "#0f766e",
        coral: "#c2410c",
        gold: "#a16207"
      }
    }
  },
  plugins: []
};

export default config;
