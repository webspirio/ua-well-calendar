// Edge Function: announce
//
// POST { event_id, admin_user_id }
// - Verifies the user row has is_admin=true (A1 trust model — no JWT).
// - Fetches the event.
// - Posts to Telegram: sendPhoto if event.image_url is set, else sendMessage.
// - Writes tg_message_id + tg_chat_id back onto the event.
//
// Required env / Supabase secrets:
//   BOT_TOKEN           Telegram bot token from BotFather
//   BOT_USERNAME        Telegram bot username (without @), e.g. "uawell_calendar_bot"
//   FORUM_CHAT_ID       Negative chat id of the target group
//   PUBLIC_BASE_URL     e.g. https://<you>.github.io/calendar-app-tg/
//   SUPABASE_URL        (auto-injected in Supabase Edge runtime)
//   SUPABASE_SERVICE_ROLE_KEY  (auto-injected)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const BOT_TOKEN = Deno.env.get("BOT_TOKEN")!
const BOT_USERNAME = Deno.env.get("BOT_USERNAME")!
const FORUM_CHAT_ID = Deno.env.get("FORUM_CHAT_ID")!
const PUBLIC_BASE_URL = Deno.env.get("PUBLIC_BASE_URL") ?? ""

type EventRow = {
  id: string
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string
  type: "offline" | "online" | "trip"
  capacity: number
  image_url: string | null
}

const TYPE_EMOJI: Record<EventRow["type"], string> = {
  offline: "🟠",
  online: "🟢",
  trip: "🔵",
}

const UA_DAYS = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"]

function formatDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dow = UA_DAYS[d.getUTCDay()]
  const hh = String(d.getUTCHours()).padStart(2, "0")
  const min = String(d.getUTCMinutes()).padStart(2, "0")
  return `${dd}.${mm} (${dow}) ${hh}:${min}`
}

function escapeMd(s: string): string {
  return s.replace(/([_*`[\]])/g, "\\$1")
}

function deepLink(eventId: string): string {
  return `https://t.me/${BOT_USERNAME}/calendar?startapp=event_${eventId}`
}

function withCors(res: Response): Response {
  for (const [k, v] of Object.entries(corsHeaders)) res.headers.set(k, v)
  return res
}

function json(body: unknown, init: ResponseInit = {}): Response {
  return withCors(
    new Response(JSON.stringify(body), {
      ...init,
      headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    }),
  )
}

function err(message: string, status: number): Response {
  return json({ error: message }, { status })
}

async function telegram(method: string, payload: unknown): Promise<{ message_id: number; chat: { id: number } }> {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  const j = await r.json()
  if (!j.ok) {
    throw new Error(`telegram ${method}: ${j.description ?? r.status}`)
  }
  return j.result
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return withCors(new Response(null, { status: 204 }))
  if (req.method !== "POST") return err("method not allowed", 405)

  let body: { event_id?: string; admin_user_id?: string }
  try {
    body = await req.json()
  } catch {
    return err("bad json", 400)
  }
  const { event_id, admin_user_id } = body
  if (!event_id || !admin_user_id) return err("event_id and admin_user_id required", 400)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const { data: admin, error: adminErr } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", admin_user_id)
    .single()
  if (adminErr || !admin?.is_admin) return err("not an admin", 403)

  const { data: event, error: evErr } = await supabase
    .from("events")
    .select("id, title, description, location, starts_at, ends_at, type, capacity, image_url")
    .eq("id", event_id)
    .single<EventRow>()
  if (evErr || !event) return err("event not found", 404)

  const link = deepLink(event.id)
  const button = {
    inline_keyboard: [[{ text: "👉 Відкрити в застосунку", url: link }]],
  }

  let result: { message_id: number; chat: { id: number } }
  try {
    if (event.image_url) {
      const photoUrl = `${PUBLIC_BASE_URL}${event.image_url}`
      const caption =
        `*${escapeMd(event.title)}*\n\n` +
        `Реєстрація: до ${event.capacity} учасників`
      result = await telegram("sendPhoto", {
        chat_id: FORUM_CHAT_ID,
        photo: photoUrl,
        caption,
        parse_mode: "Markdown",
        reply_markup: button,
      })
    } else {
      const emoji = TYPE_EMOJI[event.type]
      const when = formatDate(event.starts_at)
      const text =
        `${emoji} ${when} ${event.location ?? ""}\n\n` +
        `*${escapeMd(event.title)}*\n\n` +
        (event.description ? `${escapeMd(event.description)}\n\n` : "") +
        `Реєстрація: до ${event.capacity} учасників`
      result = await telegram("sendMessage", {
        chat_id: FORUM_CHAT_ID,
        text,
        parse_mode: "Markdown",
        link_preview_options: { is_disabled: true },
        reply_markup: button,
      })
    }
  } catch (e) {
    return err((e as Error).message, 502)
  }

  await supabase
    .from("events")
    .update({ tg_message_id: result.message_id, tg_chat_id: result.chat.id })
    .eq("id", event.id)

  return json({ ok: true, message_id: result.message_id, chat_id: result.chat.id })
})
