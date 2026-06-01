import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Cabinet Grotesk", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        midnight: {
          DEFAULT: "#06112B",
          light: "#0E2244",
          muted: "#1A3560",
        },
        teal: {
          DEFAULT: "#00C896",
          light: "#33D9AA",
          pale: "#E0FAF3",
        },
      },
    },
  },
  plugins: [],
};
export default config;
