import { createBrowserRouter } from "react-router"
import { AppLayout } from "@/components/AppLayout"
import { EventList } from "@/pages/EventList"
import { EventDetail } from "@/pages/EventDetail"
import { AdminNew } from "@/pages/AdminNew"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <EventList /> },
      { path: "event/:id", element: <EventDetail /> },
      { path: "admin/new", element: <AdminNew /> },
    ],
  },
])
