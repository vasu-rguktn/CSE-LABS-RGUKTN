import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// IMPORTANT: Update 'base' to match your GitHub repository name
export default defineConfig({
  plugins: [react()],
  base: "/cse-labs-rguktn/",
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/firebase/")) {
            return "firebase";
          }
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router-dom/")
          ) {
            return "vendor";
          }
        },
      },
    },
  },
});
