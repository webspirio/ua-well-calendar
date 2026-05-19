import { supabase } from "./supabase"

export function meQuery(userId: string) {
  return {
    queryKey: ["me", userId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, tg_id, username, first_name, is_admin")
        .eq("id", userId)
        .single()
      if (error) throw error
      return data
    },
  }
}

export function eventsQuery() {
  return {
    queryKey: ["events"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, description, location, starts_at, ends_at, type, capacity, creator_id")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
      if (error) throw error
      return data
    },
  }
}

export function eventQuery(id: string) {
  return {
    queryKey: ["event", id] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, description, location, starts_at, ends_at, type, capacity, creator_id")
        .eq("id", id)
        .single()
      if (error) throw error
      return data
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
      return data
    },
  }
}
