import { supabase } from "./supabase"

export type EventType = "offline" | "online" | "trip"

export type EventRow = {
  id: string
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string
  type: EventType
  capacity: number
  creator_id: string
  image_url: string | null
  tg_message_id: number | null
  tg_chat_id: number | null
}

export type UserRow = {
  id: string
  tg_id: number
  username: string | null
  first_name: string | null
  is_admin: boolean
  created_at: string
}

export type RsvpRow = {
  event_id: string
  user_id: string
  status: "going" | "cancelled"
}

export type CommentRow = {
  id: string
  event_id: string
  user_id: string
  body: string
  created_at: string
}

const EVENT_COLS =
  "id, title, description, location, starts_at, ends_at, type, capacity, creator_id, image_url, tg_message_id, tg_chat_id"

const USER_COLS = "id, tg_id, username, first_name, is_admin, created_at"

export function meQuery(userId: string) {
  return {
    queryKey: ["me", userId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select(USER_COLS)
        .eq("id", userId)
        .single()
      if (error) throw error
      return data as UserRow
    },
  }
}

export function usersQuery() {
  return {
    queryKey: ["users"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select(USER_COLS)
      if (error) throw error
      return data as UserRow[]
    },
  }
}

export function userQuery(userId: string) {
  return {
    queryKey: ["user", userId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select(USER_COLS)
        .eq("id", userId)
        .single()
      if (error) throw error
      return data as UserRow
    },
  }
}

export function allCommentsQuery() {
  return {
    queryKey: ["comments", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, event_id, user_id, body, created_at")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data as CommentRow[]
    },
  }
}

export function eventsQuery() {
  return {
    queryKey: ["events"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(EVENT_COLS)
        .order("starts_at", { ascending: true })
      if (error) throw error
      return data as EventRow[]
    },
  }
}

export function eventQuery(id: string) {
  return {
    queryKey: ["event", id] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(EVENT_COLS)
        .eq("id", id)
        .single()
      if (error) throw error
      return data as EventRow
    },
  }
}

export function rsvpsQuery(eventId: string) {
  return {
    queryKey: ["rsvps", eventId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rsvps")
        .select("event_id, user_id, status")
        .eq("event_id", eventId)
      if (error) throw error
      return data as RsvpRow[]
    },
  }
}

export function allRsvpsQuery() {
  return {
    queryKey: ["rsvps", "all"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rsvps")
        .select("event_id, user_id, status")
      if (error) throw error
      return data as RsvpRow[]
    },
  }
}

export function commentsQuery(eventId: string) {
  return {
    queryKey: ["comments", eventId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, event_id, user_id, body, created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true })
      if (error) throw error
      return data as CommentRow[]
    },
  }
}
