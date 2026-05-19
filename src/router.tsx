import { createBrowserRouter } from "react-router"
import { AppLayout } from "@/components/AppLayout"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <div>Event list goes here</div> },
      { path: "event/:id", element: <div>Event detail goes here</div> },
      { path: "admin/new", element: <div>Admin new goes here</div> },
    ],
  },
])
