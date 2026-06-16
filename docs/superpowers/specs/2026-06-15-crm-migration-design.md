# Замена email CRM: Notion+n8n → D1-витрина + Resend Audiences

**Тикет:** `fb_984b54a51615` (severity: medium, impact 7 × urgency 7, area: infra, cat: feature)
**Дата:** 2026-06-15

## Проблема

CRM-пайплайн лидов: новый юзер → Worker fire-and-forget `N8N_CRM_WEBHOOK_URL` (n8n workflow `mds-crm`) → строка в Notion. Workflow нестабилен → лиды не доезжают до Notion-витрины. Нужна стабильная замена, без Notion и без n8n.

**Ключевой факт:** лиды **уже** персистятся в D1 `users` (email, created_at, language, source, telegram_handle) — это происходит ДО CRM-вебхука и не зависит от него (`workers/src/handlers/auth.ts`). Источник правды цел; падает только вторичное зеркало n8n→Notion. Значит мигрируем **витрину/воркфлоу**, а не данные.

## Решение

Две части, обе = «CRM-замена»:
1. **Витрина на D1** — owner-gated админ-панель `/admin/leads`, читающая `users` напрямую (+CSV-экспорт). Зеркалит существующий `/admin/content-demand`.
2. **Рассылка** — на signup пушим контакт в **Resend Audiences** прямо из Worker (Resend уже оплачен и используется для magic-link). n8n как middleman и Notion — ретайрятся.

## Архитектура / единицы

### Часть 1 — Витрина лидов

**`workers/src/handlers/leads.ts`** (новый)
- `listLeads(db: D1Database, opts: { q?: string; limit?: number; offset?: number }): Promise<Response>`
  - База: `SELECT id, email, created_at, language, source, telegram_handle FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`
  - При `q`: добавить `WHERE email LIKE ?` (`%q%`), bind-параметр.
  - `limit` по умолчанию 500, `offset` 0.
  - Возврат `Response.json(rows ?? [])` (паттерн `listSignals`).

**`workers/src/index.ts`** — роут (рядом с content-demand-блоком):
```ts
} else if (path === '/api/admin/leads' && method === 'GET') {
  const auth = await requireOwner(request, env)
  response = auth instanceof Response ? auth
    : await listLeads(env.DB, { q: url.searchParams.get('q') ?? undefined,
        limit: Number(url.searchParams.get('limit')) || undefined })
}
```

**LMS `app/admin/leads/page.tsx` + `leads-client.tsx`** (зеркало `app/admin/content-demand/`):
- `'use client'`, fetch `/api/admin/leads` с `credentials: 'include'` (cookie-JWT → `requireOwner`).
- Таблица: email · дата (из `created_at` epoch→локаль) · source · telegram_handle · language.
- Клиентский поиск (фильтр по email на загруженном наборе).
- Кнопка **«Экспорт CSV»**: строит CSV из загруженных строк, скачивает через `Blob` + `URL.createObjectURL` (клиентский, без эндпоинта).
- Кнопка **«Sync all to Resend»** → `POST /api/admin/leads/sync-audience` (см. backfill).

**Тест `workers/src/handlers/leads.test.ts`** (паттерн `demand.test.ts`, мок D1): `listLeads` без `q` сортирует по created_at desc и селектит нужные поля; с `q` добавляет email-фильтр.

### Часть 2 — Resend Audiences push

**`workers/src/lib/crm.ts`** (новый)
- `addContactToAudience(env: Env, lead: { email: string; language?: string; source?: string }): Promise<void>`
  - `POST https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`
  - Headers: `Authorization: Bearer ${env.RESEND_API_KEY}` (с BOM/whitespace-strip как у существующих секретов), `Content-Type: application/json`.
  - Body: `{ email, unsubscribed: false }`.
  - No-op, если `RESEND_AUDIENCE_ID` пуст (graceful).
  - Ошибки логируются, НЕ бросаются (вызов fire-and-forget у вызывающего).

**`workers/src/handlers/auth.ts`** — целевое улучшение надёжности (прямо служит цели тикета): нынешний CRM-вызов — «голый» промис после возврата `Response`; Worker-рантайм может оборвать незавершённую работу → ещё одна причина «лиды не доезжают». Чиним правильно через `ctx.waitUntil`:
- Изменить сигнатуру `handleSendLink(request, env)` → `handleSendLink(request, env, ctx: ExecutionContext)`.
- В `index.ts` на вызове `handleSendLink(...)` прокинуть `ctx` (он уже доступен в роутере — используется в `ctx.waitUntil(runDemandRadar(...))`).
- В блоке `isNewUser` **заменить** n8n-CRM-webhook (строки ~47–62) на:
```ts
// добавить лид в Resend Audience; waitUntil — чтобы рантайм не оборвал запрос после ответа
ctx.waitUntil(
  addContactToAudience(env, { email, language, source })
    .catch(e => console.error('Resend audience add failed', e))
)
```
(`addContactToAudience` сам не throw'ит; `.catch` — пояс безопасности. Сбой Resend не блокирует и не валит magic link.)

**`workers/src/lib/types.ts`** — `Env`:
- Добавить `RESEND_AUDIENCE_ID: string`.
- **Удалить** `N8N_CRM_WEBHOOK_URL` и `N8N_CRM_SECRET` (ретайр n8n CRM). `N8N_WEBHOOK_URL`/`N8N_WEBHOOK_SECRET` — НЕ трогать (другой вебхук).

**Тест `workers/src/lib/crm.test.ts`**: мок `globalThis.fetch` — `addContactToAudience` бьёт в `/audiences/{id}/contacts` с верным Bearer и body `{email, unsubscribed:false}`; при отсутствии `RESEND_AUDIENCE_ID` — fetch не вызывается; rejected fetch не пробрасывает исключение.

### Backfill — owner-gated sync-эндпоинт

**`workers/src/index.ts`** роут:
```ts
} else if (path === '/api/admin/leads/sync-audience' && method === 'POST') {
  const auth = await requireOwner(request, env)
  response = auth instanceof Response ? auth : await syncAudience(env)
}
```
**`workers/src/handlers/leads.ts`** → `syncAudience(env): Promise<Response>`:
- `SELECT email, language, source FROM users`.
- Для каждого — `await addContactToAudience(env, ...)` (Resend дедупит по email → идемпотентно). Собрать `{ total, ok, failed }`.
- Возврат `Response.json({ synced: ok, failed, total })`.
- Кнопка в `leads-client` зовёт его, показывает результат.

**Тест:** `syncAudience` итерирует всех users и зовёт Resend на каждого (мок).

## Ручные шаги (не код — для автора, в плане как чеклист)

1. Resend dashboard → создать Audience → скопировать `audience_id`.
2. `wrangler secret put RESEND_AUDIENCE_ID` (в `workers/`); убедиться, что `RESEND_API_KEY` имеет scope Audiences.
3. Деплой Worker (CI по push) → нажать «Sync all to Resend» на `/admin/leads` (backfill).
4. Cutover: остановить n8n `mds-crm`; `wrangler secret delete N8N_CRM_WEBHOOK_URL` и `N8N_CRM_SECRET`; заархивировать Notion CRM DB.
5. Обновить `CLAUDE.md` секцию «CRM pipeline» под новый поток.

## Тестирование

- Vitest в `workers/` (есть своя сьюта). Новые: `leads.test.ts`, `crm.test.ts`. Существующие — без регрессий.
- `auth.test.ts`: обновить — call-sites `handleSendLink` теперь принимают 3-й арг `ctx` (передать мок `{ waitUntil: (p) => p }`); убрать ожидания n8n-CRM-вебхука; проверить, что magic-link флоу не ломается при сбое Resend.
- Typecheck: `Env` без `N8N_CRM_*` — убедиться, что нигде больше не используются (grep).

## Безопасность

- `/api/admin/leads*` — все под `requireOwner` (проверка `OWNER_EMAIL` == auth.email), как content-demand.
- `RESEND_AUDIENCE_ID` — секрет через `wrangler secret put`, не в коде. BOM-strip как у прочих секретов.
- CSV-экспорт — клиентский, данные не уходят на третью сторону.

## Вне scope (YAGNI)

- Pipeline/стадии/kanban (комфорт Notion; лиды линейны — не нужно).
- Джойн progress/intake в витрину (MVP = список лидов).
- Двусторонняя синхронизация D1 ↔ Resend.

## Критерий готовности

Новый юзер → строка в D1 `users` + контакт в Resend Audience (без n8n/Notion). Автор видит/ищет/экспортит лидов на `/admin/leads`, может прогнать backfill кнопкой. `Env` очищен от `N8N_CRM_*`. Все тесты `workers/` зелёные, typecheck чист. Ручной чеклист cutover задокументирован.
