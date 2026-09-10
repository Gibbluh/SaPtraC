import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  // Only apply dark: styles when html/body has class "dark"
  // (do not follow OS dark mode — keeps dashboard/schedule light)
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui : {
    themes: ["corporate", "forest"],
  },
};

