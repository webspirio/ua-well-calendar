const KEY = "demo.user_id"

export type Persona = {
  id: string
  label: string
  isAdmin: boolean
}

export const PERSONAS: readonly Persona[] = [
  { id: "00000000-0000-0000-0000-000000000001", label: "Олександр (адмін)", isAdmin: true },
  { id: "00000000-0000-0000-0000-000000000002", label: "Марія",              isAdmin: false },
  { id: "00000000-0000-0000-0000-000000000003", label: "Павло",              isAdmin: false },
] as const

export function currentUserId(): string {
  return localStorage.getItem(KEY) ?? PERSONAS[0].id
}

export function setCurrentUserId(id: string) {
  localStorage.setItem(KEY, id)
  location.reload()
}
