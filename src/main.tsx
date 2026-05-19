import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="p-6">
      <h1 className="text-2xl font-semibold">calendar-app-tg — bootstrapping…</h1>
      <p className="text-muted-foreground mt-2">
        Tailwind v4 is wired up. Routes and screens come next.
      </p>
    </div>
  </StrictMode>,
)
