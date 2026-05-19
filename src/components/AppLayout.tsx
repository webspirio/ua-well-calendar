import { Outlet } from "react-router"
import { AppHeader } from "./AppHeader"

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-6 py-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
