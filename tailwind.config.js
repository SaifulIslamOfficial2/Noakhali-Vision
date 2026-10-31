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
        sans:      ["Hind Siliguri", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        kalpurush: ["Kalpurush", "Hind Siliguri", "sans-serif"],
      },
    },
  },
  plugins: [],
};
