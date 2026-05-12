# Design: mamaev.coach — LMS Phase 2

**Date:** 2026-05-12
**Project:** Точка Сборки → mamaev.coach
**Scope:** Phase 2 — Auth (magic link), Progress Tracking, Feedback Webhook

---

## 1. Цели Phase 2

Превратить статический docs-сайт в минимальный LMS:
- Студенты входят через magic link (email → Resend → JWT cookie)
- Прогресс по урокам сохраняется в CF D1 (viewed + completed)
- Feedback форма реально отправляет данные в n8n на SOVERN

**Вне Phase 2 scope:** платный доступ, AI self-update pipeline, quiz, дополнительные темы.

---

## 2. Архитектура

Сайт остаётся статическим Next.js export на CF Pages. Весь backend — отдельные Cloudflare Workers, роутящиеся через `mamaev.coach/api/*`.

```
mamaev.coach
├── /*, /lessons/*, /dashboard, /login, /auth/verify   ← CF Pages (Next.js статика)
└── /api/*                                              ← CF Workers
    ├── /api/feedback          ← Worker: прокси → n8n
    ├── /api/auth/send-link    ← Worker: генерация magic link → Resend
    ├── /api/auth/verify       ← Worker: валидация токена → JWT cookie
    ├── /api/auth/me           ← Worker: текущий пользователь
    ├── /api/auth/logout       ← Worker: clear cookie
    ├── /api/progress/view     ← Worker: отметить "просмотрен"
    ├── /api/progress/complete ← Worker: отметить "завершён"
    └── /api/progress/list     ← Worker: прогресс текущего студента
```

**Структура репо:**

```
master5d/tochka-sborki/
├── web/                    ← Next.js (без изменений кроме новых страниц и компонентов)
└── workers/                ← НОВАЯ папка
    ├── wrangler.toml       ← CF Workers конфиг + D1 binding + routes
    ├── src/
    │   ├── auth.ts         ← send-link, verify, me, logout
    │   ├── progress.ts     ← view, complete, list
    │   ├── feedback.ts     ← прокси → n8n
    │   ├── middleware.ts   ← JWT валидация (shared)
    │   └── index.ts        ← router (itty-router или ручной switch)
    └── package.json
```

**Routing:** CF Pages `_routes.json` — все `/api/*` запросы уходят в Worker, остальное обслуживает Pages.

---

## 3. База данных (CF D1)

База: `tochka-sborki-db`

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,          -- nanoid()
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL   -- unix timestamp
);

CREATE TABLE magic_links (
  token TEXT PRIMARY KEY,       -- 32 байта hex random
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,  -- now + 15 минут
  used_at INTEGER               -- NULL пока не использован
);

CREATE TABLE progress (
  user_id TEXT NOT NULL,
  lesson_slug TEXT NOT NULL,
  viewed_at INTEGER NOT NULL,
  completed_at INTEGER,         -- NULL пока не завершён
  PRIMARY KEY (user_id, lesson_slug)
);
```

Миграции через `wrangler d1 execute` из `workers/migrations/`.

---

## 4. Auth: Magic Link

### 4.1 Flow

```
1. Студент → /login → вводит email → POST /api/auth/send-link
2. Worker:
   - Ищет user по email, создаёт если не существует (nanoid id)
   - Генерирует token = hex(crypto.getRandomValues(new Uint8Array(32)))  // Web Crypto API
   - Сохраняет в magic_links(token, user_id, expires_at=now+900s)
   - Resend.send({ to: email, subject: "Войти в Точку Сборки",
                   html: `<a href="https://mamaev.coach/auth/verify?token=${token}">Войти →</a>` })
   - Возвращает 200 { ok: true }
3. Студент кликает ссылку → /auth/verify?token=xxx (статичная страница Next.js)
   - Страница на mount: POST /api/auth/verify { token }
4. Worker:
   - Проверяет token в D1: exists, not used, expires_at > now
   - Помечает used_at = now
   - Создаёт JWT: { sub: user_id, email, iat, exp: iat+2592000 }
   - Подписывает WORKER_JWT_SECRET (HS256)
   - Set-Cookie: session=<JWT>; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000
   - Возвращает 200 { ok: true, email }
5. Frontend редиректит на /dashboard
```

### 4.2 JWT валидация (middleware)

Все защищённые endpoints (`/api/progress/*`, `/api/auth/me`) вызывают `requireAuth(request, env)`:
```typescript
function requireAuth(request, env): { userId: string; email: string } | Response
```
Читает cookie `session`, верифицирует JWT через `WORKER_JWT_SECRET`. Если невалидный — возвращает `Response(401)`.

### 4.3 Logout

`POST /api/auth/logout` → Set-Cookie: session=; Max-Age=0 → 200.

---

## 5. Progress Tracking

### 5.1 API

**POST /api/progress/view** (требует auth)
```json
{ "lesson_slug": "01-introduction" }
```
`INSERT OR IGNORE INTO progress(user_id, lesson_slug, viewed_at) VALUES(?, ?, ?)`

**POST /api/progress/complete** (требует auth)
```json
{ "lesson_slug": "01-introduction" }
```
`INSERT INTO progress ... ON CONFLICT UPDATE SET completed_at = ?`

**GET /api/progress/list** (требует auth)
```json
[{ "lesson_slug": "01-introduction", "viewed_at": 1234, "completed_at": 1235 }]
```

### 5.2 Frontend

Новые компоненты в `web/components/`:

**`progress-provider.tsx`** — React context:
```typescript
type ProgressState = 'none' | 'viewed' | 'completed'
interface ProgressContext {
  getState(slug: string): ProgressState
  markViewed(slug: string): Promise<void>
  markCompleted(slug: string): Promise<void>
}
```
При mount: `GET /api/progress/list` → заполняет Map. Если 401 — Map пустой (гость).

**`lesson-layout.tsx`** — изменения:
- На mount: `markViewed(meta.slug)`
- Внизу урока: кнопка "✓ Урок пройден" → `markCompleted(meta.slug)` → кнопка меняется на "✓ Завершён"

**`sidebar.tsx`** — иконки прогресса:
- `○` — `'none'`
- `◐` — `'viewed'` (текст серый)
- `●` — `'completed'` (neon green, `var(--text-accent)`)

### 5.3 Новые страницы

**`/login`** — email input + submit → POST `/api/auth/send-link` → "Проверь почту ✓"

**`/auth/verify`** — на mount POST `/api/auth/verify` с токеном из URL params → redirect `/dashboard`

**`/dashboard`** — защищённая страница:
- Приветствие с email
- "X из 7 уроков завершены" (progress bar)
- Список всех уроков с ProgressState иконками
- Кнопка "Выйти"

Если пользователь не залогинен и заходит на `/dashboard` — редирект на `/login` (client-side через `useEffect + /api/auth/me`).

---

## 6. Feedback Webhook

### 6.1 Worker

**POST /api/feedback** (публичный, auth не требуется):
```typescript
// Валидация
if (!body.lesson || !body.recommend || !body.impact || !body.apply) {
  return Response.json({ error: 'missing fields' }, { status: 400 })
}
// Forward
await fetch(env.N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': env.N8N_WEBHOOK_SECRET,
  },
  body: JSON.stringify(body),
})
return Response.json({ ok: true })
```

### 6.2 Frontend (`/feedback`)

Форма становится client-side:
- `onSubmit` → `fetch('/api/feedback', { method: 'POST', body: JSON.stringify(fields) })`
- Success state: скрыть форму, показать "Спасибо! Фидбек отправлен ✓"
- Error state: показать "Что-то пошло не так, попробуй снова"

### 6.3 n8n (SOVERN)

Добавить HTTP Trigger node в существующий workflow:
- Метод: POST
- Проверять заголовок `X-Webhook-Secret`

---

## 7. CF Workers конфигурация

```toml
# workers/wrangler.toml
name = "tochka-sborki-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "tochka-sborki-db"
database_id = "<id после wrangler d1 create>"

[vars]
# Secrets через: wrangler secret put WORKER_JWT_SECRET
# wrangler secret put RESEND_API_KEY
# wrangler secret put N8N_WEBHOOK_URL
# wrangler secret put N8N_WEBHOOK_SECRET

[[routes]]
pattern = "mamaev.coach/api/*"
zone_name = "mamaev.coach"
```

**Secrets (через `wrangler secret put`):**
- `WORKER_JWT_SECRET` — случайная строка 64+ символов
- `RESEND_API_KEY` — из Resend dashboard
- `N8N_WEBHOOK_URL` — полный URL n8n trigger через CF Tunnel
- `N8N_WEBHOOK_SECRET` — случайная строка для верификации

---

## 8. CI/CD

GitHub Actions (`.github/workflows/deploy.yml`) — добавить job для workers:

```yaml
- name: Deploy Workers
  working-directory: workers
  run: |
    npm ci
    npx wrangler deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: 252b28b0ef2e1866c532e2622060c809
```

Workers деплоятся при изменениях в `workers/**`.

---

## 9. Порядок реализации

| Шаг | Что | Зависимости |
|-----|-----|-------------|
| 1 | CF D1 создать + миграции | — |
| 2 | Workers: router + feedback | — |
| 3 | Workers: auth (send-link, verify, me, logout) | D1, Resend |
| 4 | Workers: progress (view, complete, list) | D1, Auth middleware |
| 5 | Web: /login, /auth/verify страницы | Auth Workers |
| 6 | Web: ProgressProvider + sidebar иконки + кнопка | Progress Workers |
| 7 | Web: /dashboard | Auth + Progress Workers |
| 8 | Web: feedback форма → client-side fetch | Feedback Worker |
| 9 | CI/CD: добавить workers job | — |
| 10 | n8n: добавить HTTP trigger с secret | — |

---

## 10. Решения, принятые явно

- **Magic link, не пароль** — нет хранения паролей, проще UX, достаточно для бесплатного курса
- **Resend** — уже есть аккаунт, MIT-совместимый API, надёжная доставка
- **CF Worker как feedback прокси** — n8n не открывается публично, Worker добавляет secret и валидирует данные
- **itty-router** (или ручной switch) вместо Hono — минимальный overhead, нет magic
- **JWT в httpOnly cookie** — защита от XSS, SameSite=Strict защита от CSRF
- **Stateless JWT** (не хранить сессии в D1) — проще, достаточно для Phase 2; ревокация через Phase 3 если нужна
- **ProgressProvider на client** — сайт статический, нет SSR; прогресс загружается после гидратации
