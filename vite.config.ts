import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Production (GH Pages) serves at https://webspirio.github.io/ua-well-calendar/
// so build output is base-pathed. Override via VITE_BASE env var when attaching a custom domain.
// Dev server runs at the root for sanity.
export default defineConfig(({ command }) => ({
  base: command === "build" ? (process.env.VITE_BASE ?? "/ua-well-calendar/") : "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
}))
