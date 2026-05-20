// Mock supabase-js client for local-demo mode.
// Operates on the in-memory store in mockData.ts. No network, no Docker, no
// Postgres. Mutations mutate the arrays in-place, so changes persist within
// the page session and React Query invalidations pick them up.

import { tables, type TableName } from "./mockData"
import type { CommentRow, EventRow, RsvpRow, UserRow } from "./queries"

type TableRow = {
  users: UserRow
  events: EventRow
  rsvps: RsvpRow
  comments: CommentRow
}

type Row = Record<string, unknown>
type Predicate = (row: Row) => boolean

type SbError = { message: string } | null
type SbResult<T> = { data: T; error: SbError; count?: number }

class SelectMany<T extends Row> implements PromiseLike<SbResult<T[]>> {
  rows: T[]
  predicates: Predicate[] = []
  orderBy: { col: string; asc: boolean } | null = null
  wantsCount: "exact" | null = null
  isHead = false

  constructor(rows: T[]) {
    this.rows = rows
  }

  select(_cols?: string, opts?: { count?: "exact"; head?: boolean }): SelectMany<T> {
    if (opts?.count) this.wantsCount = opts.count
    if (opts?.head) this.isHead = true
    return this
  }

  eq(col: string, val: unknown): SelectMany<T> {
    this.predicates.push((row) => row[col] === val)
    return this
  }

  in(col: string, vals: unknown[]): SelectMany<T> {
    const set = new Set(vals)
    this.predicates.push((row) => set.has(row[col]))
    return this
  }

  order(col: string, opts?: { ascending?: boolean }): SelectMany<T> {
    this.orderBy = { col, asc: opts?.ascending !== false }
    return this
  }

  single(): SelectOne<T> {
    return new SelectOne(this)
  }

  apply(): T[] {
    let result = this.rows
    for (const p of this.predicates) result = result.filter(p)
    if (this.orderBy) {
      const { col, asc } = this.orderBy
      result = [...result].sort((a, b) => {
        const av = a[col]
        const bv = b[col]
        if (av === bv) return 0
        if (av == null) return asc ? -1 : 1
        if (bv == null) return asc ? 1 : -1
        return (av < bv ? -1 : 1) * (asc ? 1 : -1)
      })
    }
    return result
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: SbResult<T[]>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    const rows = this.apply()
    const value: SbResult<T[]> = { data: rows, error: null }
    if (this.wantsCount === "exact") {
      value.count = rows.length
      if (this.isHead) value.data = [] as unknown as T[]
    }
    return Promise.resolve(value).then(onfulfilled, onrejected)
  }
}

class SelectOne<T extends Row> implements PromiseLike<SbResult<T | null>> {
  parent: SelectMany<T>

  constructor(parent: SelectMany<T>) {
    this.parent = parent
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: SbResult<T | null>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    const rows = this.parent.apply()
    if (rows.length === 0) {
      return Promise.resolve<SbResult<T | null>>({
        data: null,
        error: { message: "no rows returned" },
      }).then(onfulfilled, onrejected)
    }
    return Promise.resolve<SbResult<T | null>>({
      data: rows[0],
      error: null,
    }).then(onfulfilled, onrejected)
  }
}

class InsertMany<T extends Row> implements PromiseLike<SbResult<null>> {
  inserted: T[]

  constructor(store: T[], values: Partial<T> | Partial<T>[], tableName: TableName) {
    this.inserted = []
    const rows = Array.isArray(values) ? values : [values]
    for (const v of rows) {
      const row = withDefaults(tableName, v) as T
      store.push(row)
      this.inserted.push(row)
    }
  }

  select(_cols?: string): InsertManyReturning<T> {
    return new InsertManyReturning(this.inserted)
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: SbResult<null>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return Promise.resolve<SbResult<null>>({ data: null, error: null }).then(onfulfilled, onrejected)
  }
}

class InsertManyReturning<T extends Row> implements PromiseLike<SbResult<T[]>> {
  inserted: T[]

  constructor(inserted: T[]) {
    this.inserted = inserted
  }

  single(): InsertOneReturning<T> {
    return new InsertOneReturning(this.inserted[0])
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: SbResult<T[]>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return Promise.resolve<SbResult<T[]>>({ data: this.inserted, error: null }).then(onfulfilled, onrejected)
  }
}

class InsertOneReturning<T extends Row> implements PromiseLike<SbResult<T>> {
  row: T

  constructor(row: T) {
    this.row = row
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: SbResult<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return Promise.resolve<SbResult<T>>({ data: this.row, error: null }).then(onfulfilled, onrejected)
  }
}

class UpsertMany<T extends Row> implements PromiseLike<SbResult<null>> {
  upserted: T[]

  constructor(store: T[], values: Partial<T> | Partial<T>[], tableName: TableName, conflictCol: string) {
    this.upserted = []
    const rows = Array.isArray(values) ? values : [values]
    for (const v of rows) {
      const key = (v as Row)[conflictCol]
      const existing = store.find((row) => row[conflictCol] === key)
      if (existing) {
        Object.assign(existing, v)
        this.upserted.push(existing)
      } else {
        const row = withDefaults(tableName, v) as T
        store.push(row)
        this.upserted.push(row)
      }
    }
  }

  select(_cols?: string): InsertManyReturning<T> {
    return new InsertManyReturning(this.upserted)
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: SbResult<null>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return Promise.resolve<SbResult<null>>({ data: null, error: null }).then(onfulfilled, onrejected)
  }
}

class UpdateMany<T extends Row> implements PromiseLike<SbResult<null>> {
  store: T[]
  patch: Partial<T>
  predicates: Predicate[] = []

  constructor(store: T[], patch: Partial<T>) {
    this.store = store
    this.patch = patch
  }

  eq(col: string, val: unknown): UpdateMany<T> {
    this.predicates.push((row) => row[col] === val)
    return this
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: SbResult<null>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    for (const row of this.store) {
      if (this.predicates.every((p) => p(row))) {
        Object.assign(row, this.patch)
      }
    }
    return Promise.resolve<SbResult<null>>({ data: null, error: null }).then(onfulfilled, onrejected)
  }
}

class DeleteMany<T extends Row> implements PromiseLike<SbResult<null>> {
  store: T[]
  tableName: TableName
  predicates: Predicate[] = []

  constructor(store: T[], tableName: TableName) {
    this.store = store
    this.tableName = tableName
  }

  eq(col: string, val: unknown): DeleteMany<T> {
    this.predicates.push((row) => row[col] === val)
    return this
  }

  then<R1 = unknown, R2 = never>(
    onfulfilled?: ((value: SbResult<null>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    const removed: T[] = []
    for (let i = this.store.length - 1; i >= 0; i--) {
      const row = this.store[i]
      if (this.predicates.every((p) => p(row))) {
        removed.push(...this.store.splice(i, 1))
      }
    }
    if (this.tableName === "events" && removed.length > 0) {
      cascadeDeleteEvents(removed as unknown as EventRow[])
    }
    return Promise.resolve<SbResult<null>>({ data: null, error: null }).then(onfulfilled, onrejected)
  }
}

function cascadeDeleteEvents(removedEvents: EventRow[]) {
  const ids = new Set(removedEvents.map((e) => e.id))
  for (let i = tables.rsvps.length - 1; i >= 0; i--) {
    if (ids.has(tables.rsvps[i].event_id)) tables.rsvps.splice(i, 1)
  }
  for (let i = tables.comments.length - 1; i >= 0; i--) {
    if (ids.has(tables.comments[i].event_id)) tables.comments.splice(i, 1)
  }
}

function withDefaults(table: TableName, v: Row): Row {
  const row: Row = { ...v }
  if (table === "events") {
    row.id ??= crypto.randomUUID()
    row.created_at ??= new Date().toISOString()
    row.image_url ??= null
    row.tg_message_id ??= null
    row.tg_chat_id ??= null
    row.speaker_user_id ??= null
  }
  if (table === "comments") {
    row.id ??= crypto.randomUUID()
    row.created_at ??= new Date().toISOString()
  }
  if (table === "users") {
    row.id ??= crypto.randomUUID()
    row.created_at ??= new Date().toISOString()
    row.is_admin ??= false
  }
  if (table === "rsvps") {
    row.attended ??= null
  }
  return row
}

function rsvpGoing(p_event_id: string, p_user_id: string): SbResult<RsvpRow | null> {
  const ev = tables.events.find((e) => e.id === p_event_id)
  if (!ev) return { data: null, error: { message: "event not found" } }

  const existing = tables.rsvps.find(
    (r) => r.event_id === p_event_id && r.user_id === p_user_id,
  )
  if (existing?.status === "going") return { data: existing, error: null }

  const going = tables.rsvps.filter(
    (r) => r.event_id === p_event_id && r.status === "going",
  ).length
  if (going >= ev.capacity) return { data: null, error: { message: "event full" } }

  if (existing) {
    existing.status = "going"
    return { data: existing, error: null }
  }
  const row: RsvpRow = { event_id: p_event_id, user_id: p_user_id, status: "going", attended: null }
  tables.rsvps.push(row)
  return { data: row, error: null }
}

function tableHub<N extends TableName>(name: N) {
  type T = TableRow[N] & Row
  const store = tables[name] as unknown as T[]
  return {
    select: (cols?: string, opts?: { count?: "exact"; head?: boolean }) =>
      new SelectMany<T>(store).select(cols, opts),
    insert: (values: Partial<T> | Partial<T>[]) =>
      new InsertMany<T>(store, values, name),
    upsert: (values: Partial<T> | Partial<T>[], opts?: { onConflict?: string }) =>
      new UpsertMany<T>(store, values, name, opts?.onConflict ?? "id"),
    update: (patch: Partial<T>) => new UpdateMany<T>(store, patch),
    delete: () => new DeleteMany<T>(store, name),
  }
}

export const supabase = {
  from: tableHub,
  rpc: async (name: string, params: Record<string, unknown>) => {
    if (name === "rsvp_going") {
      return rsvpGoing(params.p_event_id as string, params.p_user_id as string)
    }
    return { data: null, error: { message: `unknown rpc: ${name}` } }
  },
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
  },
}

// Expose the underlying store for diagnostics if anyone wants to peek.
export { tables as _mockTables }
