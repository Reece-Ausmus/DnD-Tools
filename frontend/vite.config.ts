// vite.config.ts
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
      // This rule will now handle both regular HTTP requests AND WebSockets
      "/api": {
        target: "http://backend:5000", // Use your backend's port
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        ws: true,
      },

      "/socket.io": {
        target: "http://backend:5000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
