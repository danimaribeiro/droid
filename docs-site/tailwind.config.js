/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/components/Playground.js",
    "./app/components/usePlaygroundLogic.js",
    "./app/(variants)/**/*.js",
    "./app/(main)/**/*.js",
    "./app/components/*.js",
    "./node_modules/preline/dist/*.js",
  ],
  corePlugins: {
    preflight: true,
  },
  darkMode: "class",
  theme: {
    extend: {
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("preline/plugin"),
  ],
};
