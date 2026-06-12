import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    hmr: { overlay: true },
    watch: { usePolling: false },
    // proxy — dev এ backend locally চালালে uncomment করো
    // proxy: {
    //   "/api": { target: "http://localhost:5000", changeOrigin: true },
    //   "/uploads": { target: "http://localhost:5000", changeOrigin: true },
    // },
  },

  // Dependencies আগে থেকেই bundle করে রাখো — cold start দ্রুত হবে
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios",
      "lucide-react",
    ],
  },

  build: {
    // Target modern browsers — output ছোট হয়
    target: "es2020",
    // CSS code splitting চালু রাখো
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor":    ["lucide-react", "axios"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    // Sourcemap production এ বন্ধ রাখো
    sourcemap: false,
    // minify আরও ভালো করো
    minify: "esbuild",
  },
});
