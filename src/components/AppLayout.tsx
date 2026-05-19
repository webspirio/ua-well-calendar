import { Outlet } from "react-router"

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3">
        <h1 className="text-lg font-semibold">Calendar — demo</h1>
      </header>
      <main className="flex-1 px-6 py-4">
        <Outlet />
      </main>
    </div>
  )
}
