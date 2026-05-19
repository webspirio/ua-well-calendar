# Local Demo Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the calendar-app-tg repo into a runnable local demo: React 19 + Vite + Tailwind v4 + shadcn Mini App, local Supabase with seed data, persona-picker mock auth, three screens (list / detail / admin-new), and a parked grammY bot skeleton. Demo runs entirely on macOS with `supabase start` + `npm run dev`.

**Architecture:** Single-app repo (no monorepo). Root contains the Vite React app, with `supabase/`, `bot/`, and `scripts/` as sibling folders. React Query manages server state; persona ID lives in `localStorage` only. RLS is off in the demo migration — persona ID is passed to `rsvp_going(p_event_id, p_user_id)` directly. The parked `bot/` folder is standalone (its own `package.json`) and never runs during the demo.

**Tech Stack:** React 19, Vite 8, TypeScript, Tailwind CSS v4, shadcn/ui (style `base-nova`), `@tanstack/react-query`, `@supabase/supabase-js`, `react-router@7`, `react-hook-form`, `zod`, `sonner`, `date-fns`, Supabase CLI (local Docker), grammY (parked).

**Spec:** `docs/superpowers/specs/2026-05-19-local-demo-setup-design.md`

---

## File map

| File | Created in task |
|---|---|
| `package.json`, `package-lock.json` | T1 |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | T1 |
| `vite.config.ts` | T1 |
| `.gitignore`, `.env.example`, `.env.local` | T1 |
| `index.html` | T1 |
| `src/main.tsx`, `src/App.tsx`, `src/router.tsx`, `src/env.d.ts` | T1, T4 |
| `src/index.css` | T2 |
| `src/lib/utils.ts` | T2 |
| `components.json` | T2 |
| `src/components/ui/*.tsx` (shadcn primitives) | T3 |
| `supabase/config.toml`, `supabase/migrations/0001_init.sql`, `supabase/seed.sql` | T5 |
| `src/lib/supabase.ts`, `src/lib/persona.ts`, `src/lib/queries.ts` | T6 |
| `src/components/AppHeader.tsx`, `src/components/PersonaPicker.tsx`, `src/components/AppLayout.tsx` | T7 |
| `src/pages/EventList.tsx` | T8 |
| `src/pages/EventDetail.tsx` | T9 |
| `src/pages/AdminNew.tsx` | T10 |
| `bot/package.json`, `bot/tsconfig.json`, `bot/src/index.ts` | T11 |
| `vitest.config.ts`, `eslint.config.js` | T12 |
| `README.md` | T13 |

---

## Task 1: Initialize git, npm, TypeScript, Vite

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx` (placeholder)
- Create: `src/env.d.ts`
- Create: `.env.example`, `.env.local`

- [ ] **Step 1.1: git init**

Run from repo root:

```bash
git init
git config init.defaultBranch main 2>/dev/null || true
git branch -m main 2>/dev/null || true
```

Expected: `Initialized empty Git repository in …/calendar-app-tg/.git/` (or already initialized; either is fine).

- [ ] **Step 1.2: Create `.gitignore`**

Contents:

```
node_modules
dist
.DS_Store
.env.local
.env.*.local
supabase/.branches
supabase/.temp
*.log
```

- [ ] **Step 1.3: Create `package.json`**

Contents:

```json
{
  "name": "calendar-app-tg",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:status": "supabase status",
    "db:reset": "supabase db reset",
    "setup": "supabase start && supabase db reset"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@supabase/supabase-js": "^2.45.0",
    "@tailwindcss/vite": "^4.2.4",
    "@tanstack/react-query": "^5.100.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^1.14.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-hook-form": "^7.75.0",
    "react-router": "^7.14.2",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.2.4",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/node": "^24.12.2",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.2.1",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.5.0",
    "shadcn": "^4.7.0",
    "tsx": "^4.21.0",
    "typescript": "~6.0.2",
    "typescript-eslint": "^8.58.2",
    "vite": "^8.0.10",
    "vitest": "^4.1.5"
  }
}
```

- [ ] **Step 1.4: Create `tsconfig.json`**

Contents:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 1.5: Create `tsconfig.app.json`**

Contents:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 1.6: Create `tsconfig.node.json`**

Contents:

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 1.7: Create `vite.config.ts`**

Contents:

```ts
import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
})
```

- [ ] **Step 1.8: Create `index.html`**

Contents:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Calendar — demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 1.9: Create `src/env.d.ts`**

Contents:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 1.10: Create `src/main.tsx` placeholder**

Contents:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>calendar-app-tg — bootstrapping…</h1>
      <p>If you see this, Vite is running. Tailwind comes next.</p>
    </div>
  </StrictMode>,
)
```

- [ ] **Step 1.11: Create `.env.example`**

Contents:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 1.12: Create `.env.local`**

Contents:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=
```

(Anon key gets filled in during Task 5 after `supabase start`. `.env.local` is gitignored.)

- [ ] **Step 1.13: `npm install`**

Run:

```bash
npm install
```

Expected: lockfile generated, `node_modules/` populated, no error exits.

- [ ] **Step 1.14: Verify Vite boots**

Run in one terminal:

```bash
npm run dev
```

Expected: prints `Local: http://localhost:5173/`. Visit the URL — the placeholder `<h1>` should render. Stop with Ctrl-C.

- [ ] **Step 1.15: Commit**

```bash
git add -A
git commit -m "chore: initialize npm + Vite + TypeScript scaffold

Includes the design spec at docs/superpowers/specs/ and the
implementation plan at docs/superpowers/plans/."
```

---

## Task 2: Tailwind v4 + shadcn baseline

**Files:**
- Create: `src/index.css`
- Create: `src/lib/utils.ts`
- Create: `components.json`
- Modify: `src/main.tsx`

- [ ] **Step 2.1: Create `src/index.css`**

Tailwind v4 uses CSS-based theme, no `tailwind.config.js`. Contents:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  }
}
```

- [ ] **Step 2.2: Install `tw-animate-css`**

```bash
npm install tw-animate-css
```

(Needed for the `@import "tw-animate-css";` line above — provides animation utilities shadcn primitives rely on.)

- [ ] **Step 2.3: Create `src/lib/utils.ts`**

Contents:

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2.4: Create `components.json`**

Contents (matching travel-crm):

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
```

- [ ] **Step 2.5: Wire the CSS into `src/main.tsx`**

Replace the file with:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="p-6">
      <h1 className="text-2xl font-semibold">calendar-app-tg — bootstrapping…</h1>
      <p className="text-muted-foreground mt-2">
        Tailwind v4 is wired up. Routes and screens come next.
      </p>
    </div>
  </StrictMode>,
)
```

- [ ] **Step 2.6: Verify Tailwind works**

```bash
npm run dev
```

Expected: the placeholder renders with proper typography and a muted secondary line. Stop with Ctrl-C.

- [ ] **Step 2.7: Commit**

```bash
git add -A
git commit -m "feat: wire Tailwind v4 + shadcn config (base-nova)"
```

---

## Task 3: Add shadcn primitives

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/sonner.tsx`
- Create: `src/components/ui/form.tsx`

- [ ] **Step 3.1: Add all primitives in one command**

```bash
npx shadcn add button card input label textarea badge select sonner form --yes --overwrite
```

Notes:
- We use `npx shadcn` (no `@latest`) so the locked devDep `shadcn@^4.7.0` is used — same version travel-crm uses.
- `--overwrite` lets shadcn replace any pre-existing `components/ui/*` files (we have none yet); it does **not** rewrite `components.json` or `index.css` because those are unrelated targets.
- If the CLI surfaces a registry style fallback (e.g. `base-nova` not found), accept the fallback to `new-york` — the visual diff is small and we can tighten later.

Expected output: nine files created under `src/components/ui/`, plus `@radix-ui/*` packages added to `package.json` automatically.

- [ ] **Step 3.2: Verify TypeScript compiles**

```bash
npx tsc -b
```

Expected: exits 0 with no output (no errors).

- [ ] **Step 3.3: Verify build works**

```bash
npm run build
```

Expected: `dist/` is created, no errors.

- [ ] **Step 3.4: Commit**

```bash
git add -A
git commit -m "feat: add shadcn primitives (button, card, form, input, label, textarea, badge, select, sonner)"
```

---

## Task 4: App shell — main, App, router, layout (no pages yet)

**Files:**
- Modify: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/router.tsx`
- Create: `src/components/AppLayout.tsx` (placeholder; finalized in Task 7)

- [ ] **Step 4.1: Rewrite `src/main.tsx`**

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 4.2: Create `src/App.tsx`**

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import { router } from "./router"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  )
}
```

- [ ] **Step 4.3: Create `src/components/AppLayout.tsx` (temporary)**

```tsx
import { Outlet } from "react-router"

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3">
        <h1 className="text-lg font-semibold">Calendar — demo</h1>
      </header>
      <main className="flex-1 px-6 py-4">
        <Outlet />
      </main>
    </div>
  )
}
```

(The persona picker gets added to the header in Task 7.)

- [ ] **Step 4.4: Create `src/router.tsx`**

```tsx
import { createBrowserRouter } from "react-router"
import { AppLayout } from "@/components/AppLayout"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <div>Event list goes here</div> },
      { path: "event/:id", element: <div>Event detail goes here</div> },
      { path: "admin/new", element: <div>Admin new goes here</div> },
    ],
  },
])
```

- [ ] **Step 4.5: Verify boot**

```bash
npm run dev
```

Expected: visit `http://localhost:5173/` → header with "Calendar — demo" + placeholder text. Visit `/event/123` → placeholder. Visit `/admin/new` → placeholder. Stop with Ctrl-C.

- [ ] **Step 4.6: Commit**

```bash
git add -A
git commit -m "feat: app shell with React Query + router + layout placeholders"
```

---

## Task 5: Supabase local — init, migrations, seed, anon key

**Files:**
- Create: `supabase/config.toml` (via `supabase init`)
- Create: `supabase/migrations/0001_init.sql`
- Create: `supabase/seed.sql`
- Modify: `.env.local`

- [ ] **Step 5.1: Verify Supabase CLI is installed**

```bash
supabase --version
```

Expected: prints a version string (e.g. `1.x.x`). If not installed, run `brew install supabase/tap/supabase` first.

- [ ] **Step 5.2: Initialize Supabase**

```bash
supabase init
```

Answer prompts:
- "Generate VS Code workspace settings?" → No (or default)
- "Generate IntelliJ Settings?" → No

Expected: `supabase/config.toml` created.

- [ ] **Step 5.3: Create `supabase/migrations/0001_init.sql`**

```sql
create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  tg_id bigint unique not null,
  username text,
  first_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create type event_type as enum ('meetup', 'workshop');

create table events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references users(id),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type event_type not null default 'meetup',
  capacity int not null check (capacity > 0),
  created_at timestamptz not null default now()
);

create index on events (starts_at);

create table rsvps (
  event_id uuid references events(id) on delete cascade,
  user_id  uuid references users(id),
  status   text not null check (status in ('going', 'cancelled')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- Demo mode: RLS OFF so the mock anon key can read/write.
-- Phase 1 real flips these on and adds policies.
-- alter table users   enable row level security;
-- alter table events  enable row level security;
-- alter table rsvps   enable row level security;

create or replace function rsvp_going(p_event_id uuid, p_user_id uuid)
returns rsvps language plpgsql as $$
declare
  v_capacity int;
  v_count    int;
  v_row      rsvps;
begin
  select capacity into v_capacity
    from events where id = p_event_id for update;
  if v_capacity is null then raise exception 'event not found'; end if;

  if exists (select 1 from rsvps
             where event_id = p_event_id and user_id = p_user_id
               and status = 'going') then
    select * into v_row from rsvps
      where event_id = p_event_id and user_id = p_user_id;
    return v_row;
  end if;

  select count(*) into v_count
    from rsvps where event_id = p_event_id and status = 'going';
  if v_count >= v_capacity then raise exception 'event full'; end if;

  insert into rsvps (event_id, user_id, status)
    values (p_event_id, p_user_id, 'going')
    on conflict (event_id, user_id)
    do update set status = 'going', created_at = now()
    returning * into v_row;
  return v_row;
end $$;
```

- [ ] **Step 5.4: Create `supabase/seed.sql`**

```sql
insert into users (id, tg_id, username, first_name, is_admin) values
  ('00000000-0000-0000-0000-000000000001', 111, 'alex_admin',   'Alex',  true),
  ('00000000-0000-0000-0000-000000000002', 222, 'maria_member', 'Maria', false),
  ('00000000-0000-0000-0000-000000000003', 333, 'pavlo_member', 'Pavlo', false);

insert into events (creator_id, title, description, location, starts_at, ends_at, type, capacity) values
  ('00000000-0000-0000-0000-000000000001',
   'Friday coffee chat',
   'Casual catch-up at the usual spot.',
   'Central café',
   now() + interval '3 days',
   now() + interval '3 days 2 hours',
   'meetup', 8),
  ('00000000-0000-0000-0000-000000000001',
   'React + Supabase workshop',
   'Hands-on: build a small CRUD.',
   'Coworking, Room B',
   now() + interval '10 days',
   now() + interval '10 days 3 hours',
   'workshop', 12);
```

- [ ] **Step 5.5: Boot Supabase**

```bash
supabase start
```

Expected (after ~3 min on first run, downloading images):

```
API URL:   http://127.0.0.1:54321
DB URL:    postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio:    http://127.0.0.1:54323
anon key:  eyJ...
```

**Copy the anon key** — paste it into the next step.

- [ ] **Step 5.6: Update `.env.local` with the anon key**

Edit `.env.local`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<paste the anon key here>
```

- [ ] **Step 5.7: Apply migrations + seed**

```bash
supabase db reset
```

Expected: drops the DB, re-runs `0001_init.sql`, then applies `seed.sql`. Final lines should say "Finished supabase db reset".

- [ ] **Step 5.8: Verify in Studio**

Open `http://127.0.0.1:54323` → Table editor.

Expected:
- `users` has 3 rows (Alex/Maria/Pavlo, `tg_id` 111/222/333, `is_admin` true/false/false).
- `events` has 2 rows ("Friday coffee chat" and "React + Supabase workshop").
- `rsvps` is empty.

- [ ] **Step 5.9: Verify the RPC works**

In Studio → SQL editor, run:

```sql
select * from rsvp_going(
  (select id from events where title = 'Friday coffee chat'),
  '00000000-0000-0000-0000-000000000002'
);
```

Expected: returns one row with `status = 'going'`. Run it again — same result, no duplicate row.

- [ ] **Step 5.10: Commit**

```bash
git add -A
git commit -m "feat: supabase migration, seed, and rsvp_going RPC"
```

---

## Task 6: Supabase client, persona lib, query factories

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/persona.ts`
- Create: `src/lib/queries.ts`

- [ ] **Step 6.1: Create `src/lib/supabase.ts`**

```ts
import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

- [ ] **Step 6.2: Create `src/lib/persona.ts`**

```ts
const KEY = "demo.user_id"

export type Persona = {
  id: string
  label: string
  isAdmin: boolean
}

export const PERSONAS: readonly Persona[] = [
  { id: "00000000-0000-0000-0000-000000000001", label: "Alex (admin)",   isAdmin: true  },
  { id: "00000000-0000-0000-0000-000000000002", label: "Maria",          isAdmin: false },
  { id: "00000000-0000-0000-0000-000000000003", label: "Pavlo",          isAdmin: false },
] as const

export function currentUserId(): string {
  return localStorage.getItem(KEY) ?? PERSONAS[0].id
}

export function setCurrentUserId(id: string) {
  localStorage.setItem(KEY, id)
  location.reload()
}
```

- [ ] **Step 6.3: Create `src/lib/queries.ts`**

```ts
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
```

- [ ] **Step 6.4: Type-check**

```bash
npx tsc -b
```

Expected: exits 0.

- [ ] **Step 6.5: Commit**

```bash
git add -A
git commit -m "feat: supabase client, persona helper, query factories"
```

---

## Task 7: AppHeader + PersonaPicker + AppLayout

**Files:**
- Create: `src/components/PersonaPicker.tsx`
- Create: `src/components/AppHeader.tsx`
- Modify: `src/components/AppLayout.tsx`

- [ ] **Step 7.1: Create `src/components/PersonaPicker.tsx`**

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { currentUserId, PERSONAS, setCurrentUserId } from "@/lib/persona"

export function PersonaPicker() {
  const value = currentUserId()
  return (
    <Select value={value} onValueChange={setCurrentUserId}>
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERSONAS.map((p) => (
          <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 7.2: Create `src/components/AppHeader.tsx`**

```tsx
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { PersonaPicker } from "./PersonaPicker"
import { currentUserId } from "@/lib/persona"
import { meQuery } from "@/lib/queries"

export function AppHeader() {
  const { data: me } = useQuery(meQuery(currentUserId()))
  return (
    <header className="border-b px-6 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link to="/" className="text-lg font-semibold">Calendar — demo</Link>
        {me?.is_admin && <Badge variant="secondary">Admin</Badge>}
      </div>
      <PersonaPicker />
    </header>
  )
}
```

- [ ] **Step 7.3: Rewrite `src/components/AppLayout.tsx`**

```tsx
import { Outlet } from "react-router"
import { AppHeader } from "./AppHeader"

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-6 py-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 7.4: Verify in browser**

```bash
npm run dev
```

Expected: header shows "Calendar — demo", "Admin" badge (because default persona is Alex), and a persona dropdown. Switch to Maria → page reloads, badge disappears. Switch back to Alex → badge returns. Stop with Ctrl-C.

- [ ] **Step 7.5: Commit**

```bash
git add -A
git commit -m "feat: persona picker + app header with admin badge"
```

---

## Task 8: Event list page

**Files:**
- Create: `src/pages/EventList.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 8.1: Create `src/pages/EventList.tsx`**

```tsx
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { currentUserId } from "@/lib/persona"
import { eventsQuery, meQuery, rsvpsQuery } from "@/lib/queries"

export function EventList() {
  const { data: me } = useQuery(meQuery(currentUserId()))
  const { data: events, isLoading } = useQuery(eventsQuery())

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!events?.length) return <p className="text-muted-foreground">No upcoming events.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Upcoming events</h2>
        {me?.is_admin && (
          <Button asChild>
            <Link to="/admin/new">+ New event</Link>
          </Button>
        )}
      </div>
      <ul className="space-y-3">
        {events.map((ev) => (
          <li key={ev.id}>
            <Link to={`/event/${ev.id}`}>
              <EventCard event={ev} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EventCard({ event }: { event: { id: string; title: string; starts_at: string; location: string | null; capacity: number } }) {
  const { data: rsvps } = useQuery(rsvpsQuery(event.id))
  const going = rsvps?.filter((r) => r.status === "going").length ?? 0
  return (
    <Card className="hover:bg-accent/40 transition-colors">
      <CardHeader>
        <CardTitle className="text-base">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1">
        <div>{format(new Date(event.starts_at), "EEE d MMM, HH:mm")}</div>
        {event.location && <div>{event.location}</div>}
        <Badge variant="secondary">{going} / {event.capacity} going</Badge>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 8.2: Wire route in `src/router.tsx`**

Replace contents:

```tsx
import { createBrowserRouter } from "react-router"
import { AppLayout } from "@/components/AppLayout"
import { EventList } from "@/pages/EventList"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <EventList /> },
      { path: "event/:id", element: <div>Event detail goes here</div> },
      { path: "admin/new", element: <div>Admin new goes here</div> },
    ],
  },
])
```

- [ ] **Step 8.3: Verify in browser**

```bash
npm run dev
```

Expected:
- As Alex: see "+ New event" button + two event cards ("Friday coffee chat", "React + Supabase workshop") with date, location, "0 / 8 going" and "0 / 12 going" badges.
- Switch to Maria: "+ New event" button is hidden.

Stop with Ctrl-C.

- [ ] **Step 8.4: Commit**

```bash
git add -A
git commit -m "feat: event list page with admin-gated 'new event' button"
```

---

## Task 9: Event detail page

**Files:**
- Create: `src/pages/EventDetail.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 9.1: Create `src/pages/EventDetail.tsx`**

```tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router"
import { format } from "date-fns"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { currentUserId } from "@/lib/persona"
import { eventQuery, rsvpsQuery } from "@/lib/queries"

export function EventDetail() {
  const { id = "" } = useParams()
  const userId = currentUserId()
  const queryClient = useQueryClient()
  const { data: event, isLoading } = useQuery(eventQuery(id))
  const { data: rsvps } = useQuery(rsvpsQuery(id))

  const going = rsvps?.filter((r) => r.status === "going").length ?? 0
  const myRow = rsvps?.find((r) => r.user_id === userId)
  const isGoing = myRow?.status === "going"

  const goingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("rsvp_going", { p_event_id: id, p_user_id: userId })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rsvps", id] }),
    onError: (e: Error) => {
      if (e.message.includes("event full")) toast.error("Event is full")
      else toast.error(e.message)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rsvps")
        .update({ status: "cancelled" })
        .eq("event_id", id)
        .eq("user_id", userId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rsvps", id] }),
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!event) return <p className="text-muted-foreground">Event not found.</p>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{event.title}</CardTitle>
          <Badge variant="outline">{event.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="text-muted-foreground">
          {format(new Date(event.starts_at), "EEE d MMM yyyy, HH:mm")}
          {" – "}
          {format(new Date(event.ends_at), "HH:mm")}
        </div>
        {event.location && <div>{event.location}</div>}
        {event.description && <p className="text-foreground/80">{event.description}</p>}
        <div>
          <Badge variant="secondary">{going} / {event.capacity} going</Badge>
        </div>
        <div className="flex gap-2 pt-2">
          {!isGoing ? (
            <Button onClick={() => goingMutation.mutate()} disabled={goingMutation.isPending}>
              {goingMutation.isPending ? "…" : "Going"}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "…" : "Cancel RSVP"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 9.2: Wire route in `src/router.tsx`**

```tsx
import { createBrowserRouter } from "react-router"
import { AppLayout } from "@/components/AppLayout"
import { EventList } from "@/pages/EventList"
import { EventDetail } from "@/pages/EventDetail"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <EventList /> },
      { path: "event/:id", element: <EventDetail /> },
      { path: "admin/new", element: <div>Admin new goes here</div> },
    ],
  },
])
```

- [ ] **Step 9.3: Verify Going flow**

Run `npm run dev`. As Maria, open the Friday coffee chat → tap "Going" → button changes to "Cancel RSVP", badge shows "1 / 8 going". Refresh the page → state persists. Tap "Cancel RSVP" → badge goes back to "0 / 8 going".

- [ ] **Step 9.4: Verify capacity error**

In Studio SQL editor, set the workshop capacity to 1:

```sql
update events set capacity = 1 where title = 'React + Supabase workshop';
```

As Maria, RSVP to the workshop → succeeds. Switch persona to Pavlo, open the same event, tap "Going" → toast appears: "Event is full". Reset capacity:

```sql
update events set capacity = 12 where title = 'React + Supabase workshop';
delete from rsvps where event_id = (select id from events where title = 'React + Supabase workshop');
```

Stop dev server with Ctrl-C.

- [ ] **Step 9.5: Commit**

```bash
git add -A
git commit -m "feat: event detail page with RSVP + capacity-aware error toast"
```

---

## Task 10: Admin create-event page

**Files:**
- Create: `src/pages/AdminNew.tsx`
- Modify: `src/router.tsx`

- [ ] **Step 10.1: Create `src/pages/AdminNew.tsx`**

```tsx
import { useMutation, useQuery } from "@tanstack/react-query"
import { Navigate, useNavigate } from "react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { currentUserId } from "@/lib/persona"
import { meQuery } from "@/lib/queries"

const schema = z
  .object({
    title: z.string().min(3).max(80),
    description: z.string().max(2000).optional(),
    location: z.string().max(200).optional(),
    starts_at: z.string().min(1, "required"),
    ends_at: z.string().min(1, "required"),
    capacity: z.coerce.number().int().min(1).max(500),
    type: z.enum(["meetup", "workshop"]),
  })
  .refine((d) => new Date(d.ends_at) > new Date(d.starts_at), {
    message: "End must be after start",
    path: ["ends_at"],
  })

type FormValues = z.infer<typeof schema>

export function AdminNew() {
  const userId = currentUserId()
  const { data: me, isLoading } = useQuery(meQuery(userId))
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", location: "", starts_at: "", ends_at: "", capacity: 10, type: "meetup" },
  })

  const create = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data, error } = await supabase
        .from("events")
        .insert({
          creator_id: userId,
          title: values.title,
          description: values.description || null,
          location: values.location || null,
          starts_at: new Date(values.starts_at).toISOString(),
          ends_at: new Date(values.ends_at).toISOString(),
          capacity: values.capacity,
          type: values.type,
        })
        .select("id")
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (row) => {
      toast.success("Event created")
      navigate(`/event/${row.id}`)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>
  if (!me?.is_admin) return <Navigate to="/" replace />

  return (
    <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4 max-w-lg">
      <h2 className="text-xl font-semibold">New event</h2>

      <Field label="Title" error={form.formState.errors.title?.message}>
        <Input {...form.register("title")} />
      </Field>

      <Field label="Description" error={form.formState.errors.description?.message}>
        <Textarea rows={3} {...form.register("description")} />
      </Field>

      <Field label="Location" error={form.formState.errors.location?.message}>
        <Input {...form.register("location")} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Starts" error={form.formState.errors.starts_at?.message}>
          <Input type="datetime-local" {...form.register("starts_at")} />
        </Field>
        <Field label="Ends" error={form.formState.errors.ends_at?.message}>
          <Input type="datetime-local" {...form.register("ends_at")} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Capacity" error={form.formState.errors.capacity?.message}>
          <Input type="number" min={1} max={500} {...form.register("capacity")} />
        </Field>
        <Field label="Type" error={form.formState.errors.type?.message}>
          <Select
            defaultValue="meetup"
            onValueChange={(v) => form.setValue("type", v as "meetup" | "workshop")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meetup">meetup</SelectItem>
              <SelectItem value="workshop">workshop</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? "Creating…" : "Create event"}
      </Button>
    </form>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 10.2: Wire route in `src/router.tsx`**

```tsx
import { createBrowserRouter } from "react-router"
import { AppLayout } from "@/components/AppLayout"
import { EventList } from "@/pages/EventList"
import { EventDetail } from "@/pages/EventDetail"
import { AdminNew } from "@/pages/AdminNew"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <EventList /> },
      { path: "event/:id", element: <EventDetail /> },
      { path: "admin/new", element: <AdminNew /> },
    ],
  },
])
```

- [ ] **Step 10.3: Verify admin gate**

`npm run dev`. As Maria (non-admin), visit `/admin/new` → redirected to `/`. Switch to Alex, visit `/admin/new` → form renders.

- [ ] **Step 10.4: Verify create flow**

As Alex: fill the form (title "Demo dinner", description "Test", location "Home", starts in a few days, ends 2 hours later, capacity 5, type meetup) → submit. Expected: toast "Event created", redirect to the event detail page. Open `/` → the new event appears in the list. Stop dev server.

- [ ] **Step 10.5: Commit**

```bash
git add -A
git commit -m "feat: admin create-event form with react-hook-form + zod"
```

---

## Task 11: Parked bot skeleton

**Files:**
- Create: `bot/package.json`
- Create: `bot/tsconfig.json`
- Create: `bot/src/index.ts`

- [ ] **Step 11.1: Create `bot/package.json`**

```json
{
  "name": "bot",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "grammy": "^1.30.0"
  },
  "devDependencies": {
    "tsx": "^4.21.0",
    "typescript": "~6.0.2",
    "@types/node": "^24.12.2"
  }
}
```

- [ ] **Step 11.2: Create `bot/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 11.3: Create `bot/src/index.ts`**

```ts
import { Bot } from "grammy"

// Skeleton — not wired up for the demo.
// Phase 1 turns this into the announcement worker that posts events
// into the community's forum topics via webhook (grammY + Hono).
const bot = new Bot(process.env.BOT_TOKEN ?? "dummy")
bot.command("start", (ctx) =>
  ctx.reply("Calendar bot. Open the Mini App from the menu."),
)
console.log("Bot skeleton — not started in demo mode.")
```

- [ ] **Step 11.4: Install bot deps**

```bash
cd bot && npm install && cd ..
```

Expected: `bot/node_modules` populated. Both `node_modules` directories exist (root and `bot/`).

- [ ] **Step 11.5: Verify bot skeleton runs**

```bash
cd bot && npx tsx src/index.ts
```

Expected: prints `Bot skeleton — not started in demo mode.` and exits. (Note: grammY may emit a warning about the dummy token — that's fine, the process exits.)

Return to repo root: `cd ..`.

- [ ] **Step 11.6: Confirm root install is clean**

Make sure the root `package.json` does **not** mention `grammy`, `tsx-watch`, or any bot-only dep:

```bash
grep -E "(grammy|grammY)" package.json && echo "FAIL: bot dep leaked" || echo "OK: root deps clean"
```

Expected: `OK: root deps clean`.

- [ ] **Step 11.7: Add `bot/node_modules` to `.gitignore`**

Append to root `.gitignore`:

```
bot/node_modules
```

- [ ] **Step 11.8: Commit**

```bash
git add -A
git commit -m "feat: parked grammY bot skeleton (does not run in demo)"
```

---

## Task 12: ESLint + Vitest scaffold

**Files:**
- Create: `eslint.config.js`
- Create: `vitest.config.ts`

- [ ] **Step 12.1: Create `eslint.config.js`**

```js
import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist", "bot/dist", "bot/node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
)
```

- [ ] **Step 12.2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
})
```

- [ ] **Step 12.3: Verify lint runs**

```bash
npm run lint
```

Expected: exits 0, no errors. (Warnings about `react-refresh/only-export-components` may appear on shadcn primitives — ignore them, they're warnings not errors.)

- [ ] **Step 12.4: Verify vitest runs (no tests)**

```bash
npm run test
```

Expected: `No test files found, exiting with code 0` or similar — exits cleanly.

- [ ] **Step 12.5: Verify production build**

```bash
npm run build
```

Expected: `dist/` regenerated, no errors.

- [ ] **Step 12.6: Commit**

```bash
git add -A
git commit -m "feat: eslint config + vitest scaffold (no tests yet)"
```

---

## Task 13: README + demo runbook

**Files:**
- Create: `README.md`

- [ ] **Step 13.1: Create `README.md`**

```markdown
# calendar-app-tg — local demo

Telegram bot + Mini App calendar for a ~100-person community.
This repo is currently in **local-demo-only** mode: a runnable React Mini App
on macOS that demos the event/RSVP flow at a meeting. No VPS, no real Telegram.

For the long-term roadmap see `PHASE_0_AND_1.md`.
For the design behind this demo see `docs/superpowers/specs/2026-05-19-local-demo-setup-design.md`.

---

## Quick start (fresh clone)

Prereqs on macOS: Node ≥ 20, Docker Desktop running, Supabase CLI (`brew install supabase/tap/supabase`).

```bash
npm install
cp .env.example .env.local
supabase start
# Copy the printed anon key into .env.local as VITE_SUPABASE_ANON_KEY
supabase db reset    # applies migrations + seed
npm run dev          # http://localhost:5173
```

Supabase Studio for poking at the DB: <http://127.0.0.1:54323>.

---

## Demo script

1. Open as Alex (admin) → two seeded events.
2. Click **+ New event** → fill the form → submit → it appears in the list.
3. Switch persona to Maria → open an event → tap **Going** → capacity ticks up.
4. Switch to Pavlo → same event → **Going** → ticks up again.
5. In Studio, drop capacity to 1 (`update events set capacity = 1 where …`) → a third RSVP shows `Event is full`.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | tsc + Vite production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (no tests yet) |
| `npm run db:start` / `db:stop` / `db:reset` | Supabase local lifecycle |

---

## What's in this repo

- `src/` — Mini App (React 19 + Vite + Tailwind v4 + shadcn)
- `supabase/` — local migration + seed
- `bot/` — parked grammY skeleton (does not run during the demo)
- `docs/superpowers/` — design specs and implementation plans
```

- [ ] **Step 13.2: Commit**

```bash
git add -A
git commit -m "docs: add README with quick start and demo script"
```

---

## Task 14: Full acceptance walk-through (no commit)

**Files:** none modified — this task is verification only.

- [ ] **Step 14.1: Start the stack**

```bash
supabase start     # if not already running
npm run dev
```

- [ ] **Step 14.2: Walk every acceptance criterion**

Open <http://localhost:5173/> and verify each line from the spec's §6:

| Check | How to verify |
|---|---|
| Mini App opens at localhost:5173 | The home page renders |
| Persona picker switches identity | Pick Maria → page reloads, Admin badge gone |
| Admin badge visible only for Alex | Switch between personas |
| "+ New event" only visible to Alex | Same as above |
| Creating an event puts a row in `public.events` | Studio → `events` table grows after submit |
| Event shows in the list | Navigate back to `/` |
| Going writes an `rsvps` row, count updates | Tap Going → Studio shows row, badge updates |
| Capacity raises `event full` | Set capacity to 1, second Going → toast "Event is full" |
| `npm run lint` passes | Run from another terminal |
| `npm run build` succeeds | Run from another terminal |

- [ ] **Step 14.3: Reset for next demo (optional)**

```bash
supabase db reset
```

Restores the seeded state.

- [ ] **Step 14.4: Stop services**

```
Ctrl-C the dev server.
supabase stop
```

- [ ] **Step 14.5: Final verification — no uncommitted changes**

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

---

## Done.

When all 14 tasks are complete, the demo is shippable. Next step (Phase 1 real, separate plan): turn on RLS, replace the persona picker with `tg-auth` Edge Function + real Telegram `initData`, wire up the bot for forum-topic announcements.
