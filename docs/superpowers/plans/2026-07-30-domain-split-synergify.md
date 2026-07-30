# Domain Split → synergify.com Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Executor note:** этот план исполняет Codex CLI (zero-context). План = источник истины; где помечено «READ & adapt» — прочитай реальный модуль и адаптируй, сохранив описанное поведение.

**Goal:** Развести домены: `mamaev.coach` = личное (лендинг+блог+mentor+events); Точка Сборки → `ai.synergify.com`; академия S.A.S.H.A → `academy.synergify.com`; зонтик-лендинг с двумя входами → `synergify.com`.

**Architecture:** Монорепо не трогаем. (1) LMS: флип `COURSE.domain` + контент-ссылки. (2) Worker: additive route + origins + URL-билдеры. (3) Зонтик: расширение существующего worker'а `synergify/`. (4) Академия: новый мини-апп `academy/` (зеркало `mentor/`), порт из hub; из hub академия удаляется. (5) Кросс-ссылки + CI.

**Tech Stack:** Next.js 16 static export, CF Workers, vitest, GitHub Actions → CF Pages.

**Spec:** `docs/superpowers/specs/2026-07-30-domain-split-synergify-design.md`

## Global Constraints

- **НЕ коммитить и не пушить** — изменения остаются в working tree, коммитит контроллер.
- **НЕ трогать**: `mentor/`, `hub/app/events/`, `blog/lib/posts.ts` структуру (только URL-строки), D1/миграции, чекаут-логику, `.superpowers/`.
- Workers импортит LMS-исходники относительными путями — после любых правок в `LMS/tochka-sborki/web/lib/` прогонять `cd workers && npx tsc --noEmit`.
- Новые домены (точные значения): `https://synergify.com`, `https://ai.synergify.com`, `https://academy.synergify.com`.
- Тон копи — de-hustle: без scarcity/countdown/vanity-метрик/обещаний профита. RU основной, EN зеркало.
- Отправители писем `noreply@mamaev.coach` **НЕ менять** (SES identity — отдельный owner-слайс).
- Если реальный блокер — STOP и репорт, не изобретать обходы.

---

### Task 1: LMS — флип домена курса

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/course.ts` (строка `domain:`)
- Modify: `LMS/tochka-sborki/web/lib/sitemap.test.ts` (ожидания домена — READ & adapt)
- Modify: `LMS/tochka-sborki/web/content/ru/02-setup-guide/u2-install.mdx`
- Modify: `LMS/tochka-sborki/web/content/en/02-setup-guide/u2-install.mdx`
- Modify: `LMS/tochka-sborki/web/content/ru/03-stack-selection/u3-behind-gfw.mdx`
- Modify: `LMS/tochka-sborki/web/content/en/03-stack-selection/u3-behind-gfw.mdx`
- Modify: `LMS/tochka-sborki/02-setup-guide.md`, `LMS/tochka-sborki/README.md`
- Modify (сверить grep'ом): `LMS/tochka-sborki/web/lib/course/certificate.ts`, `lib/course/office-hours.ts`, `lib/course/showcase.ts`, `components/footer.tsx`, `components/pages/certificate-page.tsx` + их тесты

**Interfaces:**
- Produces: `COURSE.domain === 'https://ai.synergify.com'` — его читают sitemap/robots/manifest и тесты.

- [ ] **Step 1:** В `lib/course.ts` заменить `domain: 'https://ai.mamaev.coach'` → `domain: 'https://ai.synergify.com'`.
- [ ] **Step 2:** `grep -rn "ai\.mamaev\.coach" LMS/tochka-sborki --include="*.ts" --include="*.tsx" --include="*.mdx" --include="*.md" | grep -v node_modules` — каждое вхождение заменить на `ai.synergify.com` (install one-liner'ы `curl -fsSL https://ai.synergify.com/install.sh | bash` и `irm`-варианты; ссылки в office-hours/showcase/footer/certificate; ожидания в тестах). Ссылки на `mentor.mamaev.coach`, `mamaev.coach` (hub) и `listmonk.mamaev.coach` НЕ трогать — уезжает только `ai.*`.
- [ ] **Step 3:** `cd LMS/tochka-sborki/web && npx vitest run` — зелёный.
- [ ] **Step 4:** `cd LMS/tochka-sborki/web && npx tsc --noEmit` — чисто.
- [ ] **Step 5:** Повторить grep из Step 2 — 0 вхождений `ai.mamaev.coach`.

### Task 2: Workers — routes, origins, URL-билдеры

**Files:**
- Modify: `workers/wrangler.toml`, `workers/src/index.ts:21-23`
- Modify: `workers/src/lib/checkout.ts:17`, `workers/src/lib/course-order.ts:21-34`, `workers/src/lib/welcome-email.ts:19`, `workers/src/handlers/auth.ts:84`
- Modify: тесты workers с доменными ожиданиями (`grep -rln "ai\.mamaev\.coach" workers/src` — READ & adapt)

**Interfaces:**
- Produces: worker отвечает на `ai.synergify.com/api/*`; CORS пускает 3 новых origin; все исходящие ссылки/письма ведут на `ai.synergify.com`.

- [ ] **Step 1:** В `workers/wrangler.toml` после существующих `[[routes]]` добавить:

```toml
[[routes]]
pattern = "ai.synergify.com/api/*"
zone_name = "synergify.com"
```

- [ ] **Step 2:** В `workers/src/index.ts` в `ALLOWED_ORIGINS` добавить `'https://ai.synergify.com'`, `'https://synergify.com'`, `'https://academy.synergify.com'` (старые оставить).
- [ ] **Step 3:** Заменить `https://ai.mamaev.coach` → `https://ai.synergify.com` в: `lib/checkout.ts` (`const BASE`), `lib/course-order.ts` (все хелперы), `lib/welcome-email.ts` (`const base`), `handlers/auth.ts` (`verifyUrl`). From-адреса `noreply@mamaev.coach` НЕ трогать.
- [ ] **Step 4:** `grep -rn "ai\.mamaev\.coach" workers/src` — оставшиеся вхождения только в тестах → обновить ожидания на новый домен; затем grep = 0.
- [ ] **Step 5:** `cd workers && npx vitest run` — зелёный; `npx tsc --noEmit` — чисто; `npx wrangler deploy --dry-run` — собирается.

### Task 3: Registry — новые адреса академии и курса

**Files:**
- Modify: `LMS/registry.json`
- Modify: `LMS/tochka-sborki/web/lib/academy/registry.test.ts`, `workers/src/handlers/academy.test.ts` (READ & adapt ожидания)

**Interfaces:**
- Produces: `registry.academy.url === 'https://academy.synergify.com'`, `courses[0].url === 'https://ai.synergify.com'` — читают LMS drift-guard, workers academy handler, новый апп `academy/` (Task 5).

- [ ] **Step 1:** В `LMS/registry.json`: `academy.url` → `"https://academy.synergify.com"`, у курса `tochka-sborki` `url` → `"https://ai.synergify.com"`. Остальное (name/fullName/org) не менять.
- [ ] **Step 2:** `cd LMS/tochka-sborki/web && npx vitest run lib/academy` — обновить доменные ожидания, зелёный.
- [ ] **Step 3:** `cd workers && npx vitest run` — зелёный (обновить ожидания если тесты читают registry).

### Task 4: Зонтик synergify.com — два входа вместо pre-launch

**Files:**
- Modify: `synergify/src/page.ts` (PAGE_HTML)
- Modify: `synergify/src/index.test.ts` (READ & adapt — тесты рендера/подписки)

**Interfaces:**
- Consumes: `/api/subscribe` (без изменений).
- Produces: корень отдаёт зонтик-лендинг с двумя ссылками-входами + прежней формой подписки.

- [ ] **Step 1:** Переписать `PAGE_HTML` (self-contained, CSP-clean — стиль и скрипт inline, внешних ассетов нет; сохранить: honeypot `website`, hidden `lang=ru`, `?subscribed=…` обработку, form action `/api/subscribe`). Новая структура `<main>`:
  - `<h1>Synergify</h1>`, сабтайтл: `Экосистема обучения: открытый курс и закрытая академия.`
  - Карточка-вход 1 (ссылка на `https://ai.synergify.com`): заголовок `Точка Сборки`, текст `Открытый курс по agentic AI — для всех, бесплатно.`, CTA `Начать →`.
  - Карточка-вход 2 (ссылка на `https://academy.synergify.com`): заголовок `Академия S.A.S.H.A`, текст `Закрытая школа скрытых способностей. Вход открывается после прохождения «Точки Сборки».`, CTA `Узнать больше →`.
  - Форма подписки с подводкой `Новости экосистемы — без спама.` (та же механика).
  - EN-строка внизу: `Synergify — an open course (Tochka Sborki) and a gated academy (S.A.S.H.A). The academy opens after completing the course.`
  - `<meta name="description">`: `Synergify — открытый курс «Точка Сборки» и закрытая академия S.A.S.H.A.` `<title>Synergify</title>`.
  - Визуально: та же тёмная палитра (`--bg/#0b0d10`, `--accent/#7aa2f7`); карточки `border: 1px solid var(--border); border-radius: 0.8rem;` в колонку, на ≥560px — в два столбца. Акцент академии — золотой `#d9a95c` (бордер/CTA), связка с её лендингом.
  - CSP в `index.ts` разрешает только inline — внешние ссылки `<a href>` работают, ничего не менять в заголовках.
- [ ] **Step 2:** Обновить `index.test.ts`: рендер содержит `Точка Сборки`, `ai.synergify.com`, `academy.synergify.com`, форму подписки; существующие subscribe-тесты не трогать (логика не менялась).
- [ ] **Step 3:** `cd synergify && npx vitest run` — зелёный; `npx tsc --noEmit` — чисто.

### Task 5: Новый апп `academy/` → academy.synergify.com

**Files:**
- Create: `academy/package.json`, `academy/next.config.ts`, `academy/tsconfig.json` (копии из `mentor/` — READ & adapt: имя пакета `synergify-academy`; next.config identичен: `output:'export'`, `trailingSlash:true`, `images:{unoptimized:true}`)
- Create: `academy/app/layout.tsx`, `academy/app/globals.css`, `academy/app/page.tsx`, `academy/app/en/page.tsx`, `academy/app/not-found.tsx`
- Create: `academy/components/academy-page.tsx` (порт `hub/components/academy-page.tsx`)
- Create: `academy/lib/registry.ts` (порт `hub/lib/academy.ts`), `academy/lib/dictionaries.ts`
- Test: `academy/lib/registry.test.ts`

**Interfaces:**
- Consumes: `LMS/registry.json` через fs-read `join(process.cwd(), '..', 'LMS', 'registry.json')` (апп живёт в `academy/`, как hub — на глубине 1 от корня репо).
- Produces: статик-сайт в `academy/out` (RU `/`, EN `/en/`).

- [ ] **Step 1:** Скаффолд: скопировать из `mentor/` `package.json` (переименовать в `synergify-academy`), `next.config.ts`, `tsconfig.json`; `npm install` внутри `academy/` (если сеть недоступна — STOP и репорт).
- [ ] **Step 2:** `academy/lib/registry.ts` = копия `hub/lib/academy.ts` c локальным типом `Locale = 'ru' | 'en'` (НЕ импортить hub). Тест `registry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getAcademy, getCourses } from './registry'

describe('registry bridge', () => {
  it('reads academy info from LMS/registry.json', () => {
    const a = getAcademy()
    expect(a.name).toBe('S.A.S.H.A')
    expect(a.url).toBe('https://academy.synergify.com')
  })
  it('localizes courses and keeps registry order', () => {
    const ru = getCourses('ru')
    expect(ru[0].slug).toBe('tochka-sborki')
    expect(ru[0].url).toBe('https://ai.synergify.com')
    expect(ru[0].name).toBe('Точка Сборки')
  })
})
```

  (в `academy/` нужен vitest как devDependency + `vitest.config.ts` — зеркало любого соседа, READ & adapt из `synergify/vitest.config.ts`).
- [ ] **Step 3:** `academy/lib/dictionaries.ts`: перенести блок `academy` из `hub/lib/dictionaries.ts` (READ hub-словарь, взять RU+EN `academy`-ветки verbatim) + добавить в обе локали поле `gate`: RU `Вход в академию открывается после прохождения «Точки Сборки».` / EN `Admission opens after completing Tochka Sborki.` и поле `gateCta`: RU `Пройти Точку Сборки →` / EN `Take Tochka Sborki →`.
- [ ] **Step 4:** `academy/components/academy-page.tsx` = порт hub-версии (starfield hero, GOLD `#d9a95c`, карточки курсов) с дельтой: под `positioning` добавить gate-блок — `<p>{t.gate}</p>` + `<a href="https://ai.synergify.com">{t.gateCta}</a>` в золотой рамке. `var(--font-mono)`/`var(--font-display)` — объявить фолбэки в `globals.css` (у hub они из layout-шрифтов; здесь: `--font-display: Georgia, serif; --font-mono: ui-monospace, monospace;` или READ hub layout и повторить его подход, если дешевле).
- [ ] **Step 5:** `app/layout.tsx` — минимальный: `<html lang="ru">` (EN-страница ставит lang скриптом не надо — просто metadata per-page), metadata `{ title: 'S.A.S.H.A — Academy', description: t.metaDescription }`; `app/page.tsx` = `<AcademyPage locale="ru" />`, `app/en/page.tsx` = `<AcademyPage locale="en" />` (метаданные из словаря, зеркало hub/app/academy/page.tsx).
- [ ] **Step 6:** `cd academy && npx vitest run` — зелёный; `npm run build` — `out/` содержит `index.html` и `en/index.html`.

### Task 6: Hub — удалить академию, обновить ссылки

**Files:**
- Delete: `hub/app/academy/`, `hub/app/en/academy/`, `hub/components/academy-page.tsx`, `hub/lib/academy.ts`, `hub/lib/academy.test.ts`
- Modify: `hub/lib/dictionaries.ts` (блок `academy` удалить; ссылки на академию/курс → новые домены — READ & adapt)
- Modify: `hub/components/home-page.tsx`, `hub/components/site-header.tsx`, `hub/lib/site.ts`, `hub/app/llms.txt/route.ts`, `hub/app/en/llms.txt/route.ts`, `hub/app/sitemap.ts` (упоминания `/academy` и `ai.mamaev.coach` — READ & adapt)

- [ ] **Step 1:** Удалить файлы академии из hub. `grep -rn "academy" hub --include="*.ts" --include="*.tsx" -l | grep -v node_modules` — каждое оставшееся упоминание: либо ссылка → `https://academy.synergify.com`, либо удалить маршрут из sitemap/llms.
- [ ] **Step 2:** `grep -rn "ai\.mamaev\.coach" hub | grep -v node_modules` → все на `https://ai.synergify.com` (включая llms.txt и тесты).
- [ ] **Step 3:** `cd hub && npx vitest run` — зелёный; `npm run build` — собирается, в `out/` НЕТ `academy/`.

### Task 7: Blog + mentor — ссылки на новый домен курса

**Files:**
- Modify: `blog/lib/dictionaries.ts`, `blog/lib/posts.ts` и blog-посты со ссылками (grep), их тесты
- Modify: `mentor/lib/dictionaries.ts`, `mentor/components/home-page.tsx`

- [ ] **Step 1:** `grep -rn "ai\.mamaev\.coach" blog mentor | grep -v node_modules` → все вхождения на `https://ai.synergify.com`; упоминания `mamaev.coach/academy` → `https://academy.synergify.com`. URL самого блога (`mamaev.coach/blog`) НЕ трогать.
- [ ] **Step 2:** `cd blog && npx vitest run && npm run build`; `cd mentor && npm run build` — зелёные.

### Task 8: CI — job deploy-academy

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1:** READ файл; добавить в `on.push.paths`-фильтры (если они есть per-job — READ & adapt по образцу mentor) путь `academy/**`; добавить job `deploy-academy` — точная копия job `deploy-mentor` с заменами: `working-directory: academy`, `cache-dependency-path: academy/package-lock.json`, project `synergify-academy`, deploy `academy/out`.
- [ ] **Step 2:** Проверить дифф глазами: job — точное зеркало `deploy-mentor`, отступы YAML целы. Линтеров не гонять — CI провалидирует при пуше.

### Task 9: Финальная верификация (весь репо)

- [ ] **Step 1:** `grep -rn "ai\.mamaev\.coach\|mamaev\.coach/academy" --include="*.ts" --include="*.tsx" --include="*.mdx" --include="*.md" --include="*.json" --include="*.toml" LMS hub blog mentor workers synergify academy .github | grep -v node_modules | grep -v docs/superpowers` → 0 строк.
- [ ] **Step 2:** Все сьюты: `LMS/tochka-sborki/web`, `workers` (+tsc, +wrangler dry-run), `synergify`, `academy`, `hub`, `blog` — vitest/build зелёные.
- [ ] **Step 3:** Итоговый репорт: список изменённых/созданных/удалённых файлов + статус каждого гейта. НЕ коммитить.

---

## Owner-чеклист (вне кода — после мержа)

1. DNS + CF Pages custom domains: `ai.synergify.com` → проект `tochka-sborki`; `academy.synergify.com` → новый проект `synergify-academy`.
2. CF Bulk Redirects: `ai.mamaev.coach/*` → `https://ai.synergify.com/$1` (301); `mamaev.coach/academy/*` → `https://academy.synergify.com/` (301).
3. Google OAuth redirect URI нового домена в Google Console.
4. Telegram: re-run `workers/scripts/telegram-go-live.ps1` с новым menu-URL.
5. SES identity `synergify.com` → отдельный слайс переключения From-адресов.
6. Smoke: magic-link, подписка на зонтике, 301-редиректы, `curl -fsSL https://ai.synergify.com/install.sh | head`.
