# Domain split: mamaev.coach (личное) ↔ synergify.com (Точка Сборки + академия)

**Дата:** 2026-07-30 · **Статус:** approved by owner

## Задача

Развести два продукта по доменам. `mamaev.coach` остаётся личным брендом
(лендинг + блог + mentor + events). Учебная экосистема уезжает на
`synergify.com`: Точка Сборки — универсальная учебка agentic AI для всех;
академия S.A.S.H.A — закрытая школа («виртуальный Хогвартс») для желающих
вскрыть скрытые способности. Это **два разных продукта с воронкой**: попасть
в академию невозможно, не пройдя Точку Сборки (механика уже есть —
server-verified `/api/academy/admission` по 9 модулям).

Монорепо mc_hub **остаётся один** — меняются домены, деплой-цели и ссылки.
Раскол репо, mentor, events, blog, чекаут-движок, D1-данные — не трогаем.

## Целевая карта доменов

| Поверхность | Адрес | Роль |
|---|---|---|
| Личная страница + блог | `mamaev.coach` (+`mentor.*`, `/events/`) | как есть, минус `/academy/` |
| Зонтик Synergify | `synergify.com` | лендинг с двумя входами + подписка |
| Точка Сборки (LMS) | `ai.synergify.com` | универсальная учебка, публичная |
| Академия S.A.S.H.A | `academy.synergify.com` | закрытая школа, вход после курса |
| Worker API | `ai.synergify.com/api/*` (+ старые роуты остаются) | additive route |

## Архитектура

### 1. Зонтик synergify.com — эволюция существующего worker'а
`synergify/src/page.ts` (pre-launch + подписка → listmonk, RU/EN, тесты)
расширяется до зонтика: два входа — «Точка Сборки — для всех» →
`ai.synergify.com` и дверь академии «вход открывается после курса» →
`academy.synergify.com`. Подписка остаётся. Роут `synergify.com/*` уже живёт —
без нового CI-джоба и Pages-проекта.

### 2. Академия — новый мини-апп `academy/`
Next static export (зеркало `mentor/`), CF Pages проект → `academy.synergify.com`.
Порт `hub/app/academy` (+ `hub/lib/academy.ts` fs-bridge к `LMS/registry.json`,
starfield hero). В этом эпике — лёгкий рефрейминг «закрытая школа, вход через
Точку Сборки». Полный эзотерик-ребрендинг копи — **отдельный контент-эпик**
(sovereign prompt-emitter, манифест голосом владельца), сюда не входит.
Из hub маршрут `/academy/` (+`/en/academy/`) удаляется.

### 3. LMS-переезд ai.mamaev.coach → ai.synergify.com
Тот же CF Pages проект `tochka-sborki`, добавляется custom domain.
Код-изменения:
- `LMS/tochka-sborki/web/lib/course.ts` `COURSE.domain` → `https://ai.synergify.com`
  (sitemap/robots/manifest подтянутся из COURSE — хардкодов не осталось после
  scaffold-эпика).
- Контент: install one-liner'ы `ai.mamaev.coach/install*` → `ai.synergify.com/install*`
  в `content/{ru,en}/02-setup-guide/u2-install.mdx`, `content/{ru,en}/03-stack-selection/u3-behind-gfw.mdx`,
  `LMS/tochka-sborki/02-setup-guide.md`, `LMS/tochka-sborki/README.md`.
- Footer/сертификат и прочие поверхности, читающие COURSE — сверить grep'ом,
  ничего не должно остаться на старом домене.

### 4. Worker (`workers/`)
- `wrangler.toml`: + route `ai.synergify.com/api/*` (zone `synergify.com`).
  Старые роуты (`ai.mamaev.coach/api/*`, `mamaev.coach/api/*`) остаются —
  hub events-форма живёт на `mamaev.coach/api/*`; старый LMS-домен редиректится.
- `src/index.ts` `ALLOWED_ORIGINS` += `https://ai.synergify.com`,
  `https://synergify.com`, `https://academy.synergify.com`.
- URL-билдеры → `ai.synergify.com`: `lib/checkout.ts BASE`,
  `lib/course-order.ts` (3 хелпера), `lib/welcome-email.ts base`,
  `handlers/auth.ts verifyUrl`.
- Отправитель писем `noreply@mamaev.coach` → `noreply@synergify.com`
  **только если** SES identity `synergify.com` верифицирована (проверить);
  иначе оставить как есть и вынести отдельным слайсом.

### 5. Registry + кросс-ссылки
- `LMS/registry.json`: `academy.url` → `https://academy.synergify.com`,
  курс `url` → `https://ai.synergify.com`.
- hub: `lib/dictionaries.ts`, `components/home-page.tsx`, `site-header.tsx`,
  `lib/site.ts`, `app/{,en/}llms.txt` — ссылки на курс/академию → новые домены.
- blog: `lib/dictionaries.ts`, `lib/posts.ts`, deep-dive посты со ссылками
  на `ai.mamaev.coach` → новый домен.
- mentor: `lib/dictionaries.ts`, `components/home-page.tsx` — то же.
- Тесты, зашитые на домены (`sitemap.test`, `academy.test`, workers `*.test.ts`,
  `registry.test.ts`, `site.test.ts`) — обновить ожидания.

### 6. Redirects / SEO
CF Bulk Redirects (через cloudflare-api MCP или dashboard, owner-gated):
- `ai.mamaev.coach/*` → `ai.synergify.com/$1` (301, preserve path+query).
- `mamaev.coach/academy/*` → `academy.synergify.com` (301).
`curl -fsSL` следует за 301 — старые install-ссылки в дикой природе живы.

### 7. Auth / известные последствия
- Cookies host-scoped → активные сессии на старом домене умрут; ре-логин
  по magic-link. Приемлемо, юзеров мало.
- Google OAuth: owner добавляет redirect URI нового домена в Google Console
  (фича dark до секретов — не блокер).
- Telegram Mini App / menu button указывает на старый домен — owner
  перезапускает `workers/scripts/telegram-go-live.ps1` с новым URL.

## Owner-чеклист (вне кода, собрать в плане отдельной секцией)
1. DNS: `ai.synergify.com`, `academy.synergify.com` (CF zone уже есть).
2. CF Pages: custom domain `ai.synergify.com` → проект `tochka-sborki`;
   новый Pages-проект под `academy/` + домен `academy.synergify.com`.
3. Bulk Redirects (п.6).
4. Google OAuth redirect URI.
5. Telegram menu-button re-run.
6. SES identity `synergify.com` → переключение From-адресов.
7. GitHub Actions: секреты/имя нового Pages-проекта для job `deploy-academy`.

## Тестирование
- Существующие vitest-сьюты (web/hub/blog/mentor/workers/synergify) зелёные
  с обновлёнными доменными ожиданиями.
- `cd workers && npx tsc --noEmit` + `npx wrangler deploy --dry-run`
  (Gotcha: workers импортит LMS-исходники).
- `next build` всех аппов, включая новый `academy/`.
- Smoke post-deploy: magic-link с нового домена, POST подписки на зонтике,
  301-редиректы, install one-liner с нового домена.

## Вне скоупа
Раскол репо · эзотерик-ребрендинг академии (контент-эпик) · gated-вход в
материалы академии (admission UI) · перенос mentor/events · listmonk/SES
инфраструктура (живёт, только From-адрес при верифицированной identity).
