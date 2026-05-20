import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { t } from "@/lib/strings"

type Props = { eventId: string }

function buildShareUrl(eventId: string): string {
  const botUsername = import.meta.env.VITE_BOT_USERNAME
  if (botUsername) {
    return `https://t.me/${botUsername}/calendar?startapp=event_${eventId}`
  }
  return `${window.location.origin}${window.location.pathname}#/event/${eventId}`
}

export function ShareButton({ eventId }: Props) {
  async function onClick() {
    const url = buildShareUrl(eventId)
    try {
      await navigator.clipboard.writeText(url)
      toast.success(t.toast.linkCopied)
    } catch {
      toast.error(t.toast.linkCopyFailed)
    }
  }
  return (
    <Button type="button" variant="outline" onClick={onClick}>
      {t.detail.share}
    </Button>
  )
}
