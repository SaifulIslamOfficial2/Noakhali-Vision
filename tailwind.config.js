export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary:   "rgba(var(--brand-primary-rgb), <alpha-value>)",
        secondary: "rgba(var(--brand-secondary-rgb), <alpha-value>)",
        border:    "var(--border)",
        ink:       "var(--ink)",
        muted:     "var(--muted)",
      },
      fontFamily: {
        sans:      ["Hind Siliguri", "sans-serif"],
        serif:     ["Hind Siliguri", "sans-serif"],
        mono:      ["Hind Siliguri", "sans-serif"],
        kalpurush: ["Hind Siliguri", "sans-serif"],
      },
      // Hind Siliguri has no weight above 700, so "extrabold"/"black" map to bold (no fake heavier text)
      fontWeight: { extrabold: "700", black: "700" },
    },
  },
  plugins: [],
};
