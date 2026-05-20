// Demo mode: the announce edge function isn't reachable. Pretend it succeeded
// so the admin UI flow looks complete in a walk-through.

export type AnnounceResult = { ok: true } | { ok: false; error: string }

export async function announceEvent(_eventId: string, _adminUserId: string): Promise<AnnounceResult> {
  return { ok: true }
}
