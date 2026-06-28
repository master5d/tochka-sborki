# Admin learner counter — Design

**Ticket:** owner request (split from `fb_fb9fc1f8da31` at its design gate): a student/learner
counter for the owner's own accountability/reporting.

**Date:** 2026-06-28

## Goal

Give the owner an authoritative, live learner count in the owner-gated admin — total registered,
learners who actually started the course, and intake-completed — so the course's reach is visible
for reporting, without any public-facing vanity number.

## Decisions (owner, at the visual-refresh design gate)

- **Placement: owner-gated `/admin`, NOT the public footer.** The "nonprofit reporting" framing the
  owner mentioned is blocked publicly — the brand is sole-proprietor and the nonprofit is not
  registered (deferred to `fb_3dc7f76`). So the counter is internal-only; no public copy.
- **Source: a live worker endpoint** reading D1 (the hub is a static export; the count lives in D1
  `users`/`progress`). This is why the slice is separate from the hub visual refresh (different
  apps: `workers/` + LMS `web/`, different CI jobs).

## Scope (carved by honest triage)

The existing `/admin/leads` already shows `Лиды ({leads.length})` — but that is the count of *fetched*
rows (capped at `limit=2000`) of ALL `users` (including pure capture-form leads and Telegram-only
rows), not an authoritative learner total for reporting. The honest delta:

- **In scope:** an owner-gated `GET /api/admin/stats` returning authoritative D1 counts, displayed as
  a small stat strip on the existing `/admin/leads` page.
- **Out of scope (carved):**
  - A public footer counter (framing blocked) — none.
  - A nonprofit label anywhere (sole-prop until `fb_3dc7f76`).
  - Trend charts / cohort analytics / completed-lessons funnels.
  - A separate `/admin/stats` route (the strip on `/admin/leads` suffices — reuses its gating).
  - Any migration (the `users`, `progress`, `intake_profiles` tables already exist).

## Architecture

A pure-ish worker handler runs three D1 `COUNT` queries and returns JSON; the router exposes it
behind `requireOwner` (mirroring `/api/admin/leads`); the LMS admin page fetches it and renders a
stat strip. No new table, no migration.

**"Student" definition:** the headline **learners** = users who actually started the course
(`COUNT(DISTINCT user_id) FROM progress`), which is more honest for reporting than "all users"
(those include pure leads). **total** (all registered) and **intakeCompleted** are shown alongside
as context.

## Component

### `workers/src/handlers/stats.ts` (new)

```ts
import type { Env } from '../lib/types'

export async function getStats(db: D1Database): Promise<Response> {
  const count = async (sql: string): Promise<number> =>
    (await db.prepare(sql).first<{ c: number }>())?.c ?? 0

  const total = await count('SELECT COUNT(*) AS c FROM users')
  const learners = await count('SELECT COUNT(DISTINCT user_id) AS c FROM progress')
  const intakeCompleted = await count('SELECT COUNT(*) AS c FROM intake_profiles')

  return Response.json({ total, learners, intakeCompleted })
}
```

(No `.bind()` — fixed COUNT queries; `.first()` is read directly. Missing rows coerce to `0`.)

### `workers/src/handlers/stats.test.ts` (new)

Mirrors the existing handler-test fake-D1 style (`demand.test.ts`), but maps each COUNT query to a
distinct count:

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

### `workers/src/index.ts` (modified)

Add the import alongside the other handler imports:

```ts
import { getStats } from './handlers/stats'
```

Add the route branch next to the other `/api/admin/*` branches (owner-gated):

```ts
      } else if (path === '/api/admin/stats' && method === 'GET') {
        const auth = await requireOwner(request, env)
        response = auth instanceof Response ? auth : await getStats(env.DB)
```

### `LMS/tochka-sborki/web/app/admin/leads/leads-client.tsx` (modified)

Add a `stats` state + a second fetch + a stat strip rendered above the `Лиды (N)` heading
(graceful: if the fetch fails or returns null, the strip is simply not shown — the page still works).

- State + fetch:

```tsx
  const [stats, setStats] = useState<{ total: number; learners: number; intakeCompleted: number } | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
  }, [])
```

- Strip JSX, inserted at the top of the returned `<main>` (before the `<h1>Лиды …</h1>`):

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

## Data flow

`GET /api/admin/stats` → `requireOwner` (session JWT, `email === OWNER_EMAIL`, else 403) → three
D1 counts → `{ total, learners, intakeCompleted }`. The admin page fetches it `credentials:
'include'` and renders the strip. No new state persistence.

## Authenticity (binding)

- Owner-gated and internal-only; NO public-facing counter, NO nonprofit label (sole-prop until
  `fb_3dc7f76`).
- Honest, authoritative counts straight from D1 (not the capped lead-list length, not a decorative
  or inflated number); "learners" is the truthful "started the course" figure, with total + intake
  shown transparently alongside.

## Testing

- `workers/src/handlers/stats.test.ts`: shape + values from mapped D1 counts; missing-row → 0; the
  learners query uses `COUNT(DISTINCT user_id) FROM progress`.
- The route + strip validated by `cd workers && npx vitest run` (handler) and `cd LMS/tochka-sborki/web
  && npm run build` (admin page compiles with the strip). Owner-gating is the existing
  `requireOwner` (unchanged), reused by the new route.

Run: `cd workers && npx vitest run` ; `cd LMS/tochka-sborki/web && npm run build`.

## Global constraints

- Worker files under `workers/`; the admin display under `LMS/tochka-sborki/web/`.
- The endpoint is owner-gated via the existing `requireOwner` middleware (same as `/api/admin/leads`).
- No migration (existing `users`, `progress`, `intake_profiles` tables).
- Additive: existing handlers, routes, and the leads page's lead table stay byte-identical apart from
  the listed insertions.
- Deploy is via CI (worker code is not an additive D1 migration — the cloudflare-api MCP `/query`
  path does not apply here).

## Files

| File | Responsibility |
|---|---|
| `workers/src/handlers/stats.ts` | `getStats(db)` — three D1 counts → `{ total, learners, intakeCompleted }` |
| `workers/src/handlers/stats.test.ts` | shape + values + missing→0 + DISTINCT-progress guard |
| `workers/src/index.ts` | register owner-gated `GET /api/admin/stats` |
| `LMS/tochka-sborki/web/app/admin/leads/leads-client.tsx` | stat strip (fetch + render, graceful) |

## Out of scope

- Public footer counter; nonprofit label; trend/cohort analytics; separate `/admin/stats` route;
  any migration.
