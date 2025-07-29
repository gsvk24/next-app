/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // Сканировать папку pages
    "./packages/components/**/*.{js,ts,jsx,tsx,mdx}", // Сканировать ваши компоненты
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
