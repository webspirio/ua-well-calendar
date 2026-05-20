import { defineConfig } from "vitest/config"
import { loadEnv } from "vite"
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts"],
      testTimeout: 30_000,
      env,
    },
  }
})
