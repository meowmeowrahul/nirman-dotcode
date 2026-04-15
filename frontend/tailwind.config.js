/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#f97316",
        "primary-container": "#ea580c",
        "on-primary": "#ffffff",
        "on-primary-container": "#ffffff",
        "on-primary-fixed": "#3e1200",
        "on-primary-fixed-variant": "#852d00",
        "primary-fixed": "#ffdbcc",
        "primary-fixed-dim": "#ffb690",
        "inverse-primary": "#ffb690",

        "secondary": "#006c49",
        "secondary-container": "#6cf8bb",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#00714d",
        "on-secondary-fixed": "#002113",
        "on-secondary-fixed-variant": "#005236",
        "secondary-fixed": "#6ffbbe",
        "secondary-fixed-dim": "#4edea3",

        "tertiary": "#ab0b1c",
        "tertiary-container": "#cf2c30",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#ffecea",
        "on-tertiary-fixed": "#410004",
        "on-tertiary-fixed-variant": "#930013",
        "tertiary-fixed": "#ffdad7",
        "tertiary-fixed-dim": "#ffb3ad",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        "surface": "#f7f9fb",
        "surface-dim": "#d8dadc",
        "surface-bright": "#f7f9fb",
        "surface-container": "#eceef0",
        "surface-container-low": "#f2f4f6",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "surface-container-lowest": "#ffffff",
        "surface-variant": "#e0e3e5",
        "surface-tint": "#f97316",
        "on-surface": "#191c1e",
        "on-surface-variant": "#434655",
        "on-background": "#191c1e",
        "background": "#f7f9fb",

        "outline": "#737686",
        "outline-variant": "#c3c6d7",

        "inverse-surface": "#2d3133",
        "inverse-on-surface": "#eff1f3",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "1.5rem",
        full: "9999px",
      },
      fontFamily: {
        headline: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
}
