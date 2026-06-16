# Замена CRM (Notion+n8n → D1 + Resend) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вывести нестабильный n8n→Notion CRM; лиды (уже в D1 `users`) показывать в owner-gated `/admin/leads` (+CSV) и пушить в Resend Audiences на signup (`fb_984b54a51615`).

**Architecture:** Worker-хендлеры читают D1 + бьют в Resend API; LMS admin-панель (static export) фетчит их под `requireOwner`. Надёжность: Resend-вызов через `ctx.waitUntil`.

**Tech Stack:** Cloudflare Worker (TS), D1, Resend Audiences API, Next.js static export, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-15-crm-migration-design.md`

**Пути:** Worker — от `workers/`. LMS — от `LMS/tochka-sborki/web/`.
**Тесты Worker:** из `workers/` → `npx vitest run <path>`. **Typecheck:** `npx tsc --noEmit`.

---

## API-контракт (Track A ↔ Track B)
- `GET /api/admin/leads?q=&limit=` → `200` JSON `Array<{ id, email, created_at:number, language, source, telegram_handle }>` (owner-gated).
- `POST /api/admin/leads/sync-audience` → `200` JSON `{ synced:number, failed:number, total:number }` (owner-gated).

---

## Track A — Worker backend

### Task 1: crm.ts + Env (RESEND_AUDIENCE_ID)

**Files:** Create `workers/src/lib/crm.ts`, `workers/src/lib/crm.test.ts`; Modify `workers/src/lib/types.ts`

- [ ] **Step 1: Env — добавить поле.** В `src/lib/types.ts`, в `interface Env` добавить:
```ts
  RESEND_AUDIENCE_ID: string
```

- [ ] **Step 2: Падающий тест** `src/lib/crm.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { addContactToAudience } from './crm'

const baseEnv = { RESEND_API_KEY: 'rk_test', RESEND_AUDIENCE_ID: 'aud_1' } as any

afterEach(() => vi.restoreAllMocks())

describe('addContactToAudience', () => {
  it('POSTs to the audience contacts endpoint with bearer + body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await addContactToAudience(baseEnv, { email: 'a@b.com', language: 'ru', source: 'site' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/audiences/aud_1/contacts')
    expect((init as any).method).toBe('POST')
    expect((init as any).headers.Authorization).toBe('Bearer rk_test')
    expect(JSON.parse((init as any).body)).toMatchObject({ email: 'a@b.com', unsubscribed: false })
  })
  it('no-ops when RESEND_AUDIENCE_ID is empty', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    await addContactToAudience({ ...baseEnv, RESEND_AUDIENCE_ID: '' }, { email: 'a@b.com' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('does not throw when fetch rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))
    await expect(addContactToAudience(baseEnv, { email: 'a@b.com' })).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 3: Запустить — упадёт.** Run: `npx vitest run src/lib/crm.test.ts` → FAIL (модуль нет).

- [ ] **Step 4: Реализовать** `src/lib/crm.ts`:
```ts
import type { Env } from './types'

const strip = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

export async function addContactToAudience(
  env: Env,
  lead: { email: string; language?: string; source?: string },
): Promise<void> {
  const audienceId = strip(env.RESEND_AUDIENCE_ID)
  if (!audienceId) return
  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${strip(env.RESEND_API_KEY)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: lead.email, unsubscribed: false }),
    })
    if (!res.ok) console.error('Resend audience add non-OK', res.status, await res.text())
  } catch (e) {
    console.error('Resend audience add failed', e)
  }
}
```

- [ ] **Step 5: Зелёный.** Run: `npx vitest run src/lib/crm.test.ts` → PASS (3).

- [ ] **Step 6: Commit**
```bash
git add workers/src/lib/crm.ts workers/src/lib/crm.test.ts workers/src/lib/types.ts
git commit -m "feat(crm): addContactToAudience + RESEND_AUDIENCE_ID env (fb_984b54a51615)"
```

### Task 2: leads.ts — listLeads

**Files:** Create `workers/src/handlers/leads.ts`, `workers/src/handlers/leads.test.ts`

- [ ] **Step 1: Падающий тест** `src/handlers/leads.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { listLeads } from './leads'

function fakeDb(rows: any[] = []) {
  const calls: { sql: string; binds: any[] }[] = []
  const make = (sql: string) => ({
    bind(...binds: any[]) { calls.push({ sql, binds }); return { all: async () => ({ results: rows }) } },
    all: async () => ({ results: rows }),
  })
  return { calls, prepare(sql: string) { return make(sql) } } as any
}

describe('listLeads', () => {
  it('selects lead fields ordered by created_at desc', async () => {
    const db = fakeDb([{ id: 'u1', email: 'a@b.com', created_at: 2, language: 'ru', source: 'site', telegram_handle: null }])
    const res = await listLeads(db, {})
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].email).toBe('a@b.com')
    expect(db.calls[0].sql).toMatch(/ORDER BY created_at DESC/)
    expect(db.calls[0].sql).toMatch(/FROM users/)
  })
  it('adds an email LIKE filter when q is given', async () => {
    const db = fakeDb([])
    await listLeads(db, { q: 'bob' })
    expect(db.calls[0].sql).toMatch(/email LIKE/)
    expect(db.calls[0].binds).toContain('%bob%')
  })
})
```

- [ ] **Step 2: Упадёт.** Run: `npx vitest run src/handlers/leads.test.ts` → FAIL.

- [ ] **Step 3: Реализовать** `src/handlers/leads.ts`:
```ts
import type { Env } from '../lib/types'
import { addContactToAudience } from '../lib/crm'

export async function listLeads(
  db: D1Database,
  opts: { q?: string; limit?: number; offset?: number },
): Promise<Response> {
  const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 2000) : 500
  const offset = opts.offset && opts.offset > 0 ? opts.offset : 0
  const cols = 'id, email, created_at, language, source, telegram_handle'
  const stmt = opts.q
    ? db.prepare(`SELECT ${cols} FROM users WHERE email LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(`%${opts.q}%`, limit, offset)
    : db.prepare(`SELECT ${cols} FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(limit, offset)
  const rows = (await stmt.all()).results ?? []
  return Response.json(rows)
}
```

- [ ] **Step 4: Зелёный.** Run: `npx vitest run src/handlers/leads.test.ts` → PASS (2).

- [ ] **Step 5: Commit**
```bash
git add workers/src/handlers/leads.ts workers/src/handlers/leads.test.ts
git commit -m "feat(crm): listLeads handler over D1 users (fb_984b54a51615)"
```

### Task 3: leads.ts — syncAudience (backfill)

**Files:** Modify `workers/src/handlers/leads.ts`, `workers/src/handlers/leads.test.ts`

- [ ] **Step 1: Доп. тест** в `leads.test.ts` (новый describe):
```ts
import { syncAudience } from './leads'
import { vi, afterEach } from 'vitest'
afterEach(() => vi.restoreAllMocks())

describe('syncAudience', () => {
  it('pushes every user to Resend and returns counts', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const env = { DB: fakeDb([{ email: 'a@b.com' }, { email: 'c@d.com' }]), RESEND_API_KEY: 'rk', RESEND_AUDIENCE_ID: 'aud' } as any
    const res = await syncAudience(env)
    const body = await res.json()
    expect(body.total).toBe(2)
    expect(body.synced).toBe(2)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
```
(`fakeDb` уже в файле — переиспользуем; `.all()` вернёт rows для `SELECT email…`.)

- [ ] **Step 2: Упадёт.** Run: `npx vitest run src/handlers/leads.test.ts` → FAIL (нет `syncAudience`).

- [ ] **Step 3: Добавить в `leads.ts`:**
```ts
export async function syncAudience(env: Env): Promise<Response> {
  const rows = (await env.DB.prepare('SELECT email, language, source FROM users').all()).results ?? []
  let ok = 0, failed = 0
  for (const r of rows as any[]) {
    try { await addContactToAudience(env, { email: r.email, language: r.language, source: r.source }); ok++ }
    catch { failed++ }
  }
  return Response.json({ synced: ok, failed, total: rows.length })
}
```

- [ ] **Step 4: Зелёный.** Run: `npx vitest run src/handlers/leads.test.ts` → PASS (3).

- [ ] **Step 5: Commit**
```bash
git add workers/src/handlers/leads.ts workers/src/handlers/leads.test.ts
git commit -m "feat(crm): syncAudience backfill handler (fb_984b54a51615)"
```

### Task 4: auth.ts — ctx threading + replace n8n webhook; retire N8N_CRM_*

**Files:** Modify `workers/src/handlers/auth.ts`, `workers/src/lib/types.ts`, `workers/src/handlers/auth.test.ts`

- [ ] **Step 1: Сигнатура `handleSendLink`.** В `auth.ts`:
```ts
export async function handleSendLink(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
```

- [ ] **Step 2: Импорт + замена CRM-блока.** Вверху `auth.ts` добавить:
```ts
import { addContactToAudience } from '../lib/crm'
```
Заменить весь блок n8n-CRM-webhook (от комментария `// fire-and-forget CRM webhook…` до закрывающего `}` блока `if (crmUrl) {…}`) на:
```ts
    // добавить лид в Resend Audience; waitUntil — чтобы рантайм не оборвал запрос после ответа
    ctx.waitUntil(
      addContactToAudience(env, { email, language, source })
        .catch(e => console.error('Resend audience add failed', e))
    )
```

- [ ] **Step 3: Env — убрать n8n CRM.** В `src/lib/types.ts` удалить строки `N8N_CRM_WEBHOOK_URL: string` и `N8N_CRM_SECRET: string`.

- [ ] **Step 4: Обновить `auth.test.ts`** — все вызовы `handleSendLink(req, env)` → `handleSendLink(req, env, { waitUntil: (p: Promise<any>) => p } as any)`. Удалить ассерты, завязанные на n8n-CRM-вебхук (если есть). Прогнать:

Run: `npx vitest run src/handlers/auth.test.ts`
Expected: PASS (после правки call-sites).

- [ ] **Step 5: Commit**
```bash
git add workers/src/handlers/auth.ts workers/src/lib/types.ts workers/src/handlers/auth.test.ts
git commit -m "feat(crm): Resend на signup via ctx.waitUntil; retire n8n CRM env (fb_984b54a51615)"
```

### Task 5: index.ts — роуты + ctx в handleSendLink

**Files:** Modify `workers/src/index.ts`

- [ ] **Step 1: Импорт хендлеров.** Добавить:
```ts
import { listLeads, syncAudience } from './handlers/leads'
```

- [ ] **Step 2: Прокинуть ctx в send-link.** Заменить `response = await handleSendLink(request, env)` на:
```ts
        response = await handleSendLink(request, env, ctx)
```

- [ ] **Step 3: Добавить admin-роуты** (рядом с блоком `/api/admin/content-demand/...`):
```ts
      } else if (path === '/api/admin/leads' && method === 'GET') {
        const auth = await requireOwner(request, env)
        response = auth instanceof Response ? auth
          : await listLeads(env.DB, {
              q: url.searchParams.get('q') ?? undefined,
              limit: Number(url.searchParams.get('limit')) || undefined,
            })
      } else if (path === '/api/admin/leads/sync-audience' && method === 'POST') {
        const auth = await requireOwner(request, env)
        response = auth instanceof Response ? auth : await syncAudience(env)
```

- [ ] **Step 4: Typecheck + сьюта.**

Run: `cd workers && npx tsc --noEmit` → exit 0 (нет ссылок на удалённые `N8N_CRM_*`).
Run: `npx vitest run` → вся сьюта зелёная.

- [ ] **Step 5: Commit**
```bash
git add workers/src/index.ts
git commit -m "feat(crm): admin /leads + /sync-audience routes, ctx в send-link (fb_984b54a51615)"
```

---

## Track B — LMS admin-панель `/admin/leads`

> Зеркалит `app/admin/content-demand/`. Кодируется против API-контракта выше.

### Task 6: страница + клиент

**Files:** Create `web/app/admin/leads/page.tsx`, `web/app/admin/leads/leads-client.tsx`

- [ ] **Step 1: `page.tsx`:**
```tsx
import { LeadsClient } from './leads-client'

export default function Page() {
  return <LeadsClient />
}
```

- [ ] **Step 2: `leads-client.tsx`:**
```tsx
'use client'
import { useEffect, useMemo, useState } from 'react'

interface Lead {
  id: string
  email: string
  created_at: number
  language: string | null
  source: string | null
  telegram_handle: string | null
}

export function LeadsClient() {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/leads?limit=2000', { credentials: 'include' })
      .then(r => {
        if (r.status === 401 || r.status === 403) { setError('Доступ только для владельца.'); return null }
        return r.ok ? r.json() : null
      })
      .then(d => { if (d) setLeads(d) })
      .catch(() => setError('Не удалось загрузить.'))
  }, [])

  const filtered = useMemo(
    () => (leads ?? []).filter(l => l.email.toLowerCase().includes(q.toLowerCase())),
    [leads, q],
  )

  function exportCsv() {
    const head = ['email', 'created_at', 'language', 'source', 'telegram_handle']
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [head.join(',')].concat(
      filtered.map(l => [l.email, new Date(l.created_at * 1000).toISOString(), l.language, l.source, l.telegram_handle].map(esc).join(',')),
    )
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  async function syncAll() {
    setSyncMsg('Синхронизация…')
    try {
      const r = await fetch('/api/admin/leads/sync-audience', { method: 'POST', credentials: 'include' })
      const d = await r.json()
      setSyncMsg(`Готово: ${d.synced}/${d.total} в Resend (ошибок: ${d.failed}).`)
    } catch { setSyncMsg('Не удалось синхронизировать.') }
  }

  const wrap = { maxWidth: 980, margin: '0 auto', padding: '3rem 1.5rem' } as const
  if (error) return <main style={wrap}>{error}</main>
  if (!leads) return <main style={wrap}>Загрузка…</main>

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Лиды ({leads.length})</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="поиск по email…"
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
        <button onClick={exportCsv} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}>Экспорт CSV</button>
        <button onClick={syncAll} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--text-accent)', background: 'var(--text-accent)', color: 'var(--text-on-accent)', cursor: 'pointer', fontWeight: 700 }}>Sync all to Resend</button>
      </div>
      {syncMsg && <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{syncMsg}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '6px 8px' }}>email</th><th style={{ padding: '6px 8px' }}>дата</th>
              <th style={{ padding: '6px 8px' }}>source</th><th style={{ padding: '6px 8px' }}>telegram</th><th style={{ padding: '6px 8px' }}>язык</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '6px 8px' }}>{l.email}</td>
                <td style={{ padding: '6px 8px' }}>{new Date(l.created_at * 1000).toLocaleDateString()}</td>
                <td style={{ padding: '6px 8px' }}>{l.source ?? '—'}</td>
                <td style={{ padding: '6px 8px' }}>{l.telegram_handle ?? '—'}</td>
                <td style={{ padding: '6px 8px' }}>{l.language ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Typecheck LMS.** Run: `cd LMS/tochka-sborki/web && npx tsc --noEmit` → exit 0.

- [ ] **Step 4: Commit**
```bash
git add LMS/tochka-sborki/web/app/admin/leads/page.tsx LMS/tochka-sborki/web/app/admin/leads/leads-client.tsx
git commit -m "feat(crm): /admin/leads витрина — таблица, CSV, sync-кнопка (fb_984b54a51615)"
```

---

## Task 7: Интеграционная верификация + write-back (оркестратор)

- [ ] **Step 1: Worker сьюта + typecheck.** `cd workers && npx vitest run && npx tsc --noEmit` → всё зелёное, exit 0.
- [ ] **Step 2: LMS сьюта + typecheck.** `cd LMS/tochka-sborki/web && npx vitest run && npx tsc --noEmit` → зелёное.
- [ ] **Step 3: Grep на остатки n8n CRM.** `grep -rn "N8N_CRM" workers/src` → пусто.
- [ ] **Step 4: Write-back.**
```bash
node feedback/scripts/fb.mjs status fb_984b54a51615 done
git add feedback/feedback.jsonl feedback/board.canvas
git commit -m "chore(feedback): fb_984b54a51615 done — CRM migration"
```

## Ручной чеклист cutover (не код — автор)
- [ ] Resend dashboard → создать Audience → `wrangler secret put RESEND_AUDIENCE_ID` (в `workers/`).
- [ ] Проверить, что `RESEND_API_KEY` имеет доступ к Audiences.
- [ ] Дождаться деплоя Worker (CI) → `/admin/leads` → «Sync all to Resend» (backfill).
- [ ] Остановить n8n `mds-crm`; `wrangler secret delete N8N_CRM_WEBHOOK_URL` и `N8N_CRM_SECRET`; заархивировать Notion CRM DB.
- [ ] Обновить `CLAUDE.md` секцию «CRM pipeline» под новый поток (Worker → Resend Audiences).

## Самопроверка плана
- **Покрытие спеки:** crm.ts+Env (T1) ✓ · listLeads (T2) ✓ · syncAudience backfill (T3) ✓ · auth ctx.waitUntil + retire N8N_CRM_* (T4) ✓ · routes (T5) ✓ · витрина+CSV+sync-кнопка (T6) ✓ · verify+writeback (T7) ✓ · ручной cutover ✓.
- **Плейсхолдеров нет:** весь код финальный.
- **Консистентность:** контракт `GET /api/admin/leads` → `{id,email,created_at,language,source,telegram_handle}[]` совпадает в listLeads (T2) и Lead-интерфейсе клиента (T6); `syncAudience` → `{synced,failed,total}` совпадает в T3 и кнопке T6; `handleSendLink(req,env,ctx)` — сигнатура (T4) и call-site (T5) согласованы; `addContactToAudience(env,{email,language,source})` — T1/T3/T4.
