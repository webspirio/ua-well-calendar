import { createBrowserRouter } from "react-router"
import { AppLayout } from "@/components/AppLayout"
import { EventList } from "@/pages/EventList"
import { EventDetail } from "@/pages/EventDetail"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <EventList /> },
      { path: "event/:id", element: <EventDetail /> },
      { path: "admin/new", element: <div>Admin new goes here</div> },
    ],
  },
])
