import type { Config } from "tailwindcss";
// @ts-ignore
import { colors, typography, spacing, borderRadius } from "@desops/ui-kit/tailwind-theme";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./vendor/desops-ui-kit/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors,
      fontFamily: typography.fontFamily,
      spacing,
      borderRadius
    }
  },
  plugins: [],
};

export default config;
