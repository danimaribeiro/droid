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
    extend: {},
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("preline/plugin"),
  ],
};
