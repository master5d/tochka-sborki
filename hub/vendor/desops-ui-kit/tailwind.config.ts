import type { Config } from "tailwindcss";
import containerQueries from '@tailwindcss/container-queries';

const config: Config = {
  content: ["./components/**/*.{js,ts,jsx,tsx}", "./**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--md-sys-color-primary)",
        "on-primary": "var(--md-sys-color-on-primary)",
        "primary-container": "var(--md-sys-color-primary-container)",
        "on-primary-container": "var(--md-sys-color-on-primary-container)",
        secondary: "var(--md-sys-color-secondary)",
        "on-secondary": "var(--md-sys-color-on-secondary)",
        error: "var(--md-sys-color-error)",
        "on-error": "var(--md-sys-color-on-error)",
        background: "var(--md-sys-color-background)",
        "on-background": "var(--md-sys-color-on-background)",
        surface: "var(--md-sys-color-surface)",
        "on-surface": "var(--md-sys-color-on-surface)",
        "surface-variant": "var(--md-sys-color-surface-variant)",
        "on-surface-variant": "var(--md-sys-color-on-surface-variant)",
        "surface-container": "var(--md-sys-color-surface-container)",
        "surface-container-high": "var(--md-sys-color-surface-container-high)",
        "surface-container-highest": "var(--md-sys-color-surface-container-highest)",
      },
      fontFamily: {
        heading: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      transitionTimingFunction: {
        'mui-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'mui-out': 'cubic-bezier(0.0, 0, 0.2, 1)',
        'mui-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'mui-sharp': 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      transitionDuration: {
        'mui-shortest': '150ms',
        'mui-shorter': '200ms',
        'mui-short': '250ms',
        'mui-standard': '300ms',
        'mui-complex': '375ms',
        'mui-entering': '225ms',
        'mui-leaving': '195ms',
      },
      fontSize: {
        'fluid-sm': 'clamp(0.8rem, 0.17vw + 0.76rem, 0.89rem)',
        'fluid-base': 'clamp(1rem, 0.34vw + 0.91rem, 1.19rem)',
        'fluid-lg': 'clamp(1.25rem, 0.61vw + 1.1rem, 1.58rem)',
        'fluid-xl': 'clamp(1.56rem, 1vw + 1.31rem, 2.11rem)',
        'fluid-2xl': 'clamp(1.95rem, 1.56vw + 1.56rem, 2.81rem)',
        'fluid-3xl': 'clamp(2.44rem, 2.38vw + 1.85rem, 3.75rem)',
      },
    },
  },
  plugins: [
    containerQueries,
  ],
};
export default config;
