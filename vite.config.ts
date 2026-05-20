import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Production (GH Pages) serves at https://<user>.github.io/calendar-app-tg/
// so build output is base-pathed. Dev server runs at the root for sanity.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/calendar-app-tg/" : "/",
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
