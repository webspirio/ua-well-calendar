import { createBrowserRouter } from "react-router"
import { AppLayout } from "@/components/AppLayout"
import { EventList } from "@/pages/EventList"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <EventList /> },
      { path: "event/:id", element: <div>Event detail goes here</div> },
      { path: "admin/new", element: <div>Admin new goes here</div> },
    ],
  },
])
