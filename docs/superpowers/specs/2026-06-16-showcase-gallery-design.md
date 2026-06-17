# Витрина возможностей на входе LMS (showcase gallery)

**Тикет:** `fb_b2a67b22be2c` (severity: medium, impact 8 × urgency 6, area: hub→lms, cat: feature)
**Дата:** 2026-06-16

## Проблема

Новичок не знает спектра возможностей agentic AI — нет ясности «о чём вообще мечтать» и мотивации «пахать ради этого» до входа в курс/анкету. Нужна витрина реальных кейсов + engaging видео-демо «на входе».

Существующая `<DreamScenarios>` на LMS home-page — текстовая «о чём мечтать»; витрина дополняет её **визуальным** слоем (видео + конкретные кейсы-образцы).

## Решение

Новая секция «Возможности» на LMS home-page (`components/pages/home-page.tsx`, первое, что видит новичок на ai.mamaev.coach), **после `<DreamScenarios>`** — текстовая мечта → визуальное доказательство → program/старт анкеты. Контент в data-файле с плейсхолдерами (структура + слоты; автор наполняет видео/кейсы позже без кода). Bilingual RU+EN.

## Единицы

### 1. `lib/showcase.ts` — данные + чистые хелперы

```ts
import type { Locale } from '@/lib/intake/types'

export interface ShowcaseCase {
  id: string
  icon: string                 // emoji
  title: { ru: string; en: string }
  blurb: { ru: string; en: string }
  tag: { ru: string; en: string }
  href?: string                // опц. ссылка на кейс/демо
}
export interface ShowcaseVM {
  label: string
  heading: string
  videoUrl: string | null      // null → постер-заглушка
  videoCaption: string
  cases: { id: string; icon: string; title: string; blurb: string; tag: string; href?: string }[]
  cta: string
}

export function getShowcase(locale: Locale): ShowcaseVM
// videoUrl: watch-URL YouTube/Vimeo → embed; null passthrough
export function videoEmbedUrl(url: string | null): string | null
```

- Внутренние bilingual-константы: `LABEL`, `HEADING`, `CTA`, `VIDEO` (`{ url: null, caption: {ru,en} }`), `CASES` (массив `ShowcaseCase`).
- **`CASES`** — 4 плейсхолдера вдохновляющих возможностей (финальные тексты, не «TODO»): напр. «AI-ассистент под твою нишу», «продукт за выходные», «автоматизация рутины», «свой агент-напарник». Каждый с icon/title/blurb/tag RU+EN.
- **`VIDEO.url = null`** по умолчанию → компонент рисует постер-заглушку. Автор позже впишет YouTube/Vimeo watch-URL.
- **`getShowcase(locale)`** — резолвит bilingual в плоский VM под локаль (как `getDictionary`-паттерн).
- **`videoEmbedUrl(url)`**:
  - `null` → `null`
  - YouTube (`youtube.com/watch?v=ID`, `youtu.be/ID`) → `https://www.youtube-nocookie.com/embed/ID`
  - Vimeo (`vimeo.com/ID`) → `https://player.vimeo.com/video/ID`
  - иначе → возвращает исходный URL как есть (доверенный embed)

### 2. `components/showcase-gallery.tsx` — секция (зеркало стиля `dream-scenarios.tsx`)

```tsx
'use client'  // только если нужен; иначе server-компонент как dream-scenarios
```
(dream-scenarios — server-компонент; showcase тоже server, без интерактива — iframe статичен.)

- Обёртка `<section className="home-section">` (стиль как dream-scenarios: padding `var(--section-gap)`, `var(--bg-secondary)`, верхний бордер).
- Заголовок: `label` (моно, uppercase, `--text-secondary`) + `heading` (`<h2>`).
- **Video-слот**: контейнер 16:9 (`aspect-ratio: 16/9`, скруглённый, `var(--bg-surface)`, бордер).
  - `videoEmbedUrl(vm.videoUrl)` ≠ null → `<iframe src=embed allow="...; picture-in-picture" allowFullScreen>` (16:9).
  - null → постер-заглушка: центр — иконка ▶ + `vm.videoCaption` («engaging ролик скоро»).
- **Сетка кейсов**: responsive grid (`repeat(auto-fit, minmax(220px, 1fr))`, gap). Карточка: icon · `<h3>`title · blurb (`--text-secondary`) · tag-чип. Если `href` — карточка-ссылка (`<a>`), иначе `<div>`.
- **CTA**: `<a href={локаль==='en'?'/en/quest-intake/':'/quest-intake/'}>` — `vm.cta` («Начать свой путь →»), стиль primary.
- Все тексты из `getShowcase(locale)`.

### 3. Вставка в `home-page.tsx`

Импорт `ShowcaseGallery`; вставить `<ShowcaseGallery locale={locale} />` сразу ПОСЛЕ `<DreamScenarios locale={locale} />` (≈строка 259).

## Тесты (vitest, env node)

`lib/showcase.test.ts`:
- `getShowcase('ru')` и `getShowcase('en')`: ≥4 кейса; у каждого непустые `title/blurb/tag/icon`; `cta`/`heading`/`label` непусты; локали дают разный текст где ожидается.
- `videoEmbedUrl`: `null`→`null`; `https://youtu.be/abc123`→`youtube-nocookie.com/embed/abc123`; `https://www.youtube.com/watch?v=XYZ`→`embed/XYZ`; `https://vimeo.com/12345`→`player.vimeo.com/video/12345`; неизвестный URL → passthrough.

## i18n

RU (основной) + EN. Маршрут `/en/` уже рендерит `HomePage locale="en"` — секция получит `locale` и отдаст EN-тексты. Новых UI-строк в хардкоде нет — всё в `lib/showcase.ts`.

## Вне scope (YAGNI)

- Производство самого ролика и реальные кейс-тексты (плейсхолдеры; автор наполняет `lib/showcase.ts`).
- CMS/админка кейсов (статичный data-файл).
- Дубль витрины на hub-лендинге (выбран LMS).
- Аналитика кликов/просмотров видео (можно добавить позже).

## Критерий готовности

Новичок на ai.mamaev.coach до анкеты видит секцию «Возможности»: video-слот (заглушка при `url=null`, либо embed) + сетка из ≥4 кейсов + CTA на `/quest-intake`. Bilingual RU+EN. Тесты зелёные, tsc чист. Слоты готовы под наполнение (вписать `VIDEO.url` + заменить плейсхолдер-кейсы).
