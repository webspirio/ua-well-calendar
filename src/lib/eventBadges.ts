export type Hotness = "almost-full" | "full" | null

export function hotness(going: number, capacity: number, past: boolean): Hotness {
  if (past) return null
  const ratio = going / capacity
  if (ratio >= 1) return "full"
  if (ratio >= 0.75) return "almost-full"
  return null
}
