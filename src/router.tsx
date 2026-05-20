import { createHashRouter } from "react-router"
import { AppLayout } from "@/components/AppLayout"
import { EventList } from "@/pages/EventList"
import { EventDetail } from "@/pages/EventDetail"
import { AdminNew } from "@/pages/AdminNew"
import { AdminMembers } from "@/pages/AdminMembers"
import { Profile } from "@/pages/Profile"

export const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <EventList /> },
      { path: "event/:id", element: <EventDetail /> },
      { path: "admin/new", element: <AdminNew /> },
      { path: "admin/members", element: <AdminMembers /> },
      { path: "profile/:userId", element: <Profile /> },
    ],
  },
])
