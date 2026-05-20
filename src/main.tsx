import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { bootstrapLaunch } from "./lib/launch"
import "./index.css"

async function start() {
  const result = await bootstrapLaunch()
  if (result.initialPath && !window.location.hash) {
    window.location.hash = `#${result.initialPath}`
  }
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
