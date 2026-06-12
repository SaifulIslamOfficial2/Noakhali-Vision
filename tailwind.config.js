export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary:   "#EF152B",
        secondary: "#A71926",
        border:    "#EAEAEA",
        ink:       "#111111",
        muted:     "#666666",
      },
      fontFamily: {
        sans:      ["Hind Siliguri", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        kalpurush: ["Kalpurush", "Hind Siliguri", "sans-serif"],
      },
    },
  },
  plugins: [],
};
