# Admin Learner Counter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the owner an authoritative, live learner count in the owner-gated admin — total registered, learners who started the course, and intake-completed — via a worker endpoint + a stat strip on `/admin/leads`, with no public counter.

**Architecture:** A worker handler runs three D1 `COUNT` queries and returns JSON; the router exposes it behind the existing `requireOwner` middleware (mirroring `/api/admin/leads`); the LMS admin page fetches it and renders a stat strip. No new table, no migration.

**Tech Stack:** Cloudflare Worker (TypeScript, D1), Vitest; LMS Next.js (static export) admin client component.

## Global Constraints

- Worker files under `workers/` (tests: `cd workers && npx vitest run`); the admin display under `LMS/tochka-sborki/web/` (build: `cd LMS/tochka-sborki/web && npm run build`).
- The endpoint is owner-gated via the EXISTING `requireOwner` middleware (same as `/api/admin/leads`) — do not add new auth.
- "Student" headline = `COUNT(DISTINCT user_id) FROM progress` (started the course); `total` = `COUNT(*) FROM users`; `intakeCompleted` = `COUNT(*) FROM intake_profiles`.
- No migration (the `users`, `progress`, `intake_profiles` tables already exist).
- Additive: existing handlers, routes, and the leads page's lead table stay byte-identical apart from the listed insertions.
- Internal-only: no public counter, NO nonprofit label anywhere (sole-prop until `fb_3dc7f76`).
- Deploy is via CI (worker code, not an additive D1 migration).

---

### Task 1: stats worker handler + unit test

**Files:**
- Create: `workers/src/handlers/stats.ts`
- Test: `workers/src/handlers/stats.test.ts`

**Interfaces:**
- Consumes: `D1Database` (`.prepare(sql).first<{ c: number }>()`).
- Produces: `getStats(db: D1Database): Promise<Response>` returning JSON `{ total: number; learners: number; intakeCompleted: number }` (consumed by Task 2's router branch).

- [ ] **Step 1: Write the failing test**

Create `workers/src/handlers/stats.test.ts` (mirrors the fake-D1 style of `demand.test.ts`, but maps each COUNT query to a distinct count):

```ts
import { describe, it, expect } from 'vitest'
import { getStats } from './stats'

function fakeDb(counts: { users: number; progress: number; intake: number }) {
  return {
    prepare(sql: string) {
      return {
        first: async () => {
          if (sql.includes('FROM users')) return { c: counts.users }
          if (sql.includes('FROM progress')) return { c: counts.progress }
          if (sql.includes('FROM intake_profiles')) return { c: counts.intake }
          return { c: 0 }
        },
      }
    },
  } as any
}

describe('getStats', () => {
  it('returns total/learners/intakeCompleted from D1 counts', async () => {
    const res = await getStats(fakeDb({ users: 10, progress: 6, intake: 4 }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ total: 10, learners: 6, intakeCompleted: 4 })
  })

  it('coerces missing rows to 0', async () => {
    const db = { prepare: () => ({ first: async () => null }) } as any
    expect(await (await getStats(db)).json()).toEqual({ total: 0, learners: 0, intakeCompleted: 0 })
  })

  it('counts learners as DISTINCT progress users (true students)', async () => {
    const sqls: string[] = []
    const db = { prepare: (s: string) => { sqls.push(s); return { first: async () => ({ c: 1 }) } } } as any
    await getStats(db)
    expect(sqls.some(s => /COUNT\(DISTINCT user_id\)\s+AS c FROM progress/i.test(s))).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/handlers/stats.test.ts`
Expected: FAIL — `Cannot find module './stats'`.

- [ ] **Step 3: Write the handler**

Create `workers/src/handlers/stats.ts`:

```ts
import type { Env } from '../lib/types'

// Authoritative learner counts for the owner-gated admin. No bind() — fixed COUNT queries.
export async function getStats(db: D1Database): Promise<Response> {
  const count = async (sql: string): Promise<number> =>
    (await db.prepare(sql).first<{ c: number }>())?.c ?? 0

  const total = await count('SELECT COUNT(*) AS c FROM users')
  const learners = await count('SELECT COUNT(DISTINCT user_id) AS c FROM progress')
  const intakeCompleted = await count('SELECT COUNT(*) AS c FROM intake_profiles')

  return Response.json({ total, learners, intakeCompleted })
}
```

(The `Env` import matches the sibling handlers' convention even though only `db` is used — keeps the file consistent with `leads.ts`. If your linter flags the unused import, drop the `import type { Env }` line; it is not referenced.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/handlers/stats.test.ts`
Expected: PASS — all three tests green.

- [ ] **Step 5: Run the full worker suite (no regression)**

Run: `cd workers && npx vitest run`
Expected: PASS — full worker suite green.

- [ ] **Step 6: Commit**

```bash
git add workers/src/handlers/stats.ts workers/src/handlers/stats.test.ts
git commit -m "feat(workers): admin learner-stats handler (fb_fb9fc1f8da31 split)"
```

---

### Task 2: register the route + render the stat strip

**Files:**
- Modify: `workers/src/index.ts`
- Modify: `LMS/tochka-sborki/web/app/admin/leads/leads-client.tsx`

**Interfaces:**
- Consumes: `getStats` from `./handlers/stats` (Task 1); the existing `requireOwner` middleware; the `{ total, learners, intakeCompleted }` JSON shape.
- Produces: the `GET /api/admin/stats` route + the admin stat strip (build-validated; no new unit test).

- [ ] **Step 1: Register the owner-gated route**

In `workers/src/index.ts`, add the import next to the other handler imports (e.g. after the `listLeads, syncContacts` import line):

```ts
import { getStats } from './handlers/stats'
```

Add the route branch alongside the other `/api/admin/*` branches (e.g. immediately after the `/api/admin/leads/sync-resend` branch):

```ts
      } else if (path === '/api/admin/stats' && method === 'GET') {
        const auth = await requireOwner(request, env)
        response = auth instanceof Response ? auth : await getStats(env.DB)
```

- [ ] **Step 2: Typecheck the worker**

Run: `cd workers && npx vitest run`
Expected: PASS — suite still green (the new branch typechecks; `getStats` resolves).

- [ ] **Step 3: Add the stat strip to the admin page**

In `LMS/tochka-sborki/web/app/admin/leads/leads-client.tsx`:

(a) Add a `stats` state next to the existing `useState` calls (after the `syncMsg` state):

```tsx
  const [stats, setStats] = useState<{ total: number; learners: number; intakeCompleted: number } | null>(null)
```

(b) Add a second `useEffect` right after the existing leads-fetch `useEffect`:

```tsx
  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
  }, [])
```

(c) Render the strip at the top of the returned `<main>`, immediately before the `<h1 ...>Лиды ({leads.length})</h1>` line:

```tsx
      {stats && (
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {[
            { label: 'Студентов (начали курс)', value: stats.learners },
            { label: 'Всего зарегистрировано', value: stats.total },
            { label: 'Прошли интейк', value: stats.intakeCompleted },
          ].map(s => (
            <div key={s.label} style={{ padding: '1rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: 10, background: 'var(--bg-surface)', minWidth: 160 }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
```

(Leave the existing search/export/sync controls and the lead table byte-identical.)

- [ ] **Step 4: Build the LMS app**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — TypeScript accepts the `stats` state + strip; `/admin/leads` (static export) compiles with the strip.

- [ ] **Step 5: Run the LMS suite (no regression)**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full LMS suite green (no test targets the admin client; this confirms nothing else broke).

- [ ] **Step 6: Commit**

```bash
git add workers/src/index.ts LMS/tochka-sborki/web/app/admin/leads/leads-client.tsx
git commit -m "feat(admin): learner-stats strip on /admin/leads (fb_fb9fc1f8da31 split)"
```

---

## Self-Review

**Spec coverage:**
- `getStats` handler with three D1 counts (total / learners=DISTINCT progress / intakeCompleted) → Task 1 (Step 3). ✓
- Handler test: shape + values, missing→0, DISTINCT-progress guard → Task 1 (Step 1). ✓
- Owner-gated `GET /api/admin/stats` via `requireOwner` → Task 2 (Step 1). ✓
- Stat strip on `/admin/leads` (fetch + render, graceful hide) → Task 2 (Step 3). ✓
- Build-validated admin page → Task 2 (Step 4). ✓
- No migration; additive; internal-only (no public counter, no nonprofit label) → respected throughout. ✓
- Carve (no public footer / nonprofit label / trends / separate route / migration) → nothing added. ✓

**Placeholder scan:** none — every code step carries full content; exact SQL, JSON shape, and JSX inline.

**Type consistency:** `getStats(db: D1Database): Promise<Response>` returning `{ total, learners, intakeCompleted }` is defined in Task 1 and consumed identically in Task 2 (router branch + the `stats` state type + the strip's `stats.learners`/`stats.total`/`stats.intakeCompleted`). The route uses `requireOwner` + `env.DB` exactly as the sibling `/api/admin/leads` branch. The fetch path `/api/admin/stats` matches the registered route. ✓
