import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>calendar-app-tg — bootstrapping…</h1>
      <p>If you see this, Vite is running. Tailwind comes next.</p>
    </div>
  </StrictMode>,
)
