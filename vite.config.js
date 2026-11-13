import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    // Local development: run `node dev-api.mjs` (needs MONGODB_URI etc.) and the API is proxied here.
    proxy: { "/api": "http://localhost:3001" },
    hmr: { overlay: true },
    watch: { usePolling: false },
  },

  // Dependencies আগে থেকেই bundle করে রাখো — cold start দ্রুত হবে
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
    ],
  },

  preview: { proxy: { "/api": "http://localhost:3001" } },

  build: {
    // Target modern browsers — output ছোট হয়
    target: "es2020",
    // CSS code splitting চালু রাখো
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return "react-vendor";
          if (id.includes("node_modules/lucide-react")) return "ui-vendor";
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 600,
    // Sourcemap production এ বন্ধ রাখো
    sourcemap: false,
  },
});
