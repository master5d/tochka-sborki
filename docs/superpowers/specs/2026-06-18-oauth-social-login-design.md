# OAuth social login — design pass (NOT built)

**Тикет:** `fb_25d8fa04c141` (feature, area workers, impact 6) — OAuth-аутентификация для профилей студентов.
**Дата:** 2026-06-18
**Статус:** design-pass. **Заблокировано:** нужны OAuth-credentials владельца (Google/GitHub client_id+secret).

## Контекст / что уже есть
Auth = **magic-link** (`workers/src/handlers/auth.ts`): `users` (D1) + `magic_links` + JWT session-cookie (`session=…; HttpOnly; Secure; SameSite=Strict; 30d`). `handleMe` отдаёт профиль. Passwordless уже работает — OAuth это **доп. вход**, не замена.

## Решение (когда разблокируют)
Добавить OAuth **поверх** существующей сессии — переиспользуем JWT/cookie + `users`, меняется только способ установления личности.
- **Провайдеры:** Google + GitHub (Authorization Code flow + PKCE; secret хранится в `wrangler secret`).
- **Эндпоинты воркера:** `GET /api/auth/oauth/:provider/start` (redirect на провайдера, state в cookie) · `GET /api/auth/oauth/:provider/callback` (обмен code→token, fetch профиля, upsert user, выпуск той же JWT-session).
- **users:** `ALTER TABLE users ADD COLUMN oauth_provider TEXT, oauth_sub TEXT` (миграция 0005). Линковка по verified email (если email совпал с magic-link юзером — связать, не дублировать).
- **UI:** кнопки «Войти через Google/GitHub» на `/login` рядом с magic-link.

## Решения за владельцем (разблокировка)
1. **Какие провайдеры** — Google? GitHub? оба? (аудитория нон-кодеров → Google логичнее GitHub).
2. **OAuth app credentials** — зарегистрировать app(ы), дать `client_id` + `client_secret` (→ `wrangler secret put`), выставить redirect URI `https://ai.mamaev.coach/api/auth/oauth/<provider>/callback`.
3. **Зачем поверх magic-link** — соц-логин снижает трение (1 клик vs письмо), но magic-link уже passwordless. Подтвердить, что выигрыш стоит surface (или отложить).

## Guardrails / риски
- state+PKCE против CSRF на callback; secret только в `wrangler secret`, не в коде.
- Email-линковка только по **verified** email провайдера (иначе account-takeover).
- Gotcha 2: новый код в `workers/` — не тянуть web `@/` alias.

## Вне scope
- «Логин под Anthropic/OpenAI аккаунтом» — не существует (см. [[reference_byo_ai_account_oauth]]).
- SSO/enterprise, MFA.

## Готовность к build
Спек полон; как только владелец даёт провайдер(ы) + credentials → план (миграция 0005 → воркер-эндпоинты TDD → /login кнопки → workers tsc/wrangler гейты).
