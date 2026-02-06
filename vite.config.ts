import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["rankitocrm.com", "www.rankitocrm.com", "app.rankitocrm.com"],
  },
  preview: {
    host: "::",
    port: 4173,
    allowedHosts: ["rankitocrm.com", "www.rankitocrm.com", "app.rankitocrm.com"],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
