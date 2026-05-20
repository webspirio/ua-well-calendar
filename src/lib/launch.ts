import { supabase } from "./supabase"

const KEY = "demo.user_id"
const TG_FLAG = "demo.is_tg_launch"

type TelegramWebApp = {
  initData?: string
  initDataUnsafe?: {
    user?: { id: number; username?: string; first_name?: string; last_name?: string }
    start_param?: string
  }
  ready?: () => void
  expand?: () => void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

export type LaunchResult = {
  isTelegram: boolean
  initialPath: string | null
}

export async function bootstrapLaunch(): Promise<LaunchResult> {
  const tg = window.Telegram?.WebApp
  if (!tg || !tg.initData) {
    sessionStorage.removeItem(TG_FLAG)
    return { isTelegram: false, initialPath: null }
  }

  tg.ready?.()
  tg.expand?.()

  const tgUser = tg.initDataUnsafe?.user
  if (tgUser?.id) {
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          tg_id: tgUser.id,
          username: tgUser.username ?? null,
          first_name: tgUser.first_name ?? null,
        },
        { onConflict: "tg_id" },
      )
      .select("id")
      .single()
    if (!error && data) {
      localStorage.setItem(KEY, data.id)
      sessionStorage.setItem(TG_FLAG, "1")
    }
  }

  let initialPath: string | null = null
  const startParam = tg.initDataUnsafe?.start_param
  if (startParam?.startsWith("event_")) {
    initialPath = `/event/${startParam.slice(6)}`
  }
  return { isTelegram: true, initialPath }
}

export function isTelegramLaunch(): boolean {
  return sessionStorage.getItem(TG_FLAG) === "1"
}
