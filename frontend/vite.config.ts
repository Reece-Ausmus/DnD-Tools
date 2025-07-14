// frontend/vite.config.ts

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: true,
    port: 5173,
    hmr: {
      protocol: "ws",
      host: "localhost",
    },

    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: "http://backend:5001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },

      "/socket.io": {
        target: "http://backend:5001",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
