import { supabase } from "./supabase"

const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL

export type AnnounceResult = { ok: true } | { ok: false; error: string }

export async function announceEvent(eventId: string, adminUserId: string): Promise<AnnounceResult> {
  const { data: { session } } = await supabase.auth.getSession()
  try {
    const res = await fetch(`${FUNCTIONS_URL}/announce`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}),
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ event_id: eventId, admin_user_id: adminUserId }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: text || `announce ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}
