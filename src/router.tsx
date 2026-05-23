import { createHashRouter } from "react-router"
import { AppLayout } from "@/components/AppLayout"
import { EventList } from "@/pages/EventList"
import { EventDetail } from "@/pages/EventDetail"
import { AdminNew } from "@/pages/AdminNew"
import { AdminMembers } from "@/pages/AdminMembers"
import { Profile } from "@/pages/Profile"
import { Offer } from "@/pages/Offer"

export const router = createHashRouter([
  { path: "/offer", element: <Offer /> },
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
