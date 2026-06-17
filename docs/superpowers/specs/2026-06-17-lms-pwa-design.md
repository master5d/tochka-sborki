# LMS installable PWA + install prompt

**Тикеты:** `fb_dd0741bd4fb5` (PWA installable, sev medium) + `fb_d72b457c3b94` (install-инструкция/тултип, sev low, depends on первого)
**Дата:** 2026-06-17
**Стек:** Next.js 16 `output: 'export'`, deploy → Cloudflare Pages (ai.mamaev.coach).

## Назначение
Сделать LMS устанавливаемым приложением (десктоп Chrome/Edge install + мобильный «на экран Домой») и дать ненавязчивую install-подсказку, т.к. студенты не знают, что курс можно установить.

## Файлы

### 1. `app/manifest.ts` (Next metadata route → статичный `/manifest.webmanifest` при export)
`MetadataRoute.Manifest`: `name: 'Точка Сборки'`, `short_name: 'Точка Сборки'`, `description`, `start_url: '/'`, `display: 'standalone'`, `theme_color: '#0a0a0f'`, `background_color: '#0a0a0f'`, `lang: 'ru'`, `categories: ['education']`, `icons`: 192 (any), 512 (any), 512 (maskable).

### 2. PNG-иконки в `public/`
`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`. Генерация — `scripts/gen-pwa-icons.mjs` (sharp, из `app/icon.svg`). Maskable: гекс уменьшен в safe-zone (~80%) на заливке `#0a0a0f`. PNG коммитятся (скрипт повторяемый, не в build-pipeline).

### 3. `public/sw.js` — минимальный service worker
Нужен для install-критерия Chrome (fetch-handler). Стратегия: network-first с cache-fallback (без stale-контента на часто обновляемом курсе); precache offline-shell (`/`, offline fallback). Версионируемый `CACHE` name; `activate` чистит старые кеши; `skipWaiting`/`clients.claim`.

### 4. `components/pwa/pwa-register.tsx` ('use client')
Регистрирует `/sw.js` в `useEffect` после `window load`. Гард `'serviceWorker' in navigator`. Рендерит `null`. Монтируется в `layout.tsx`.

### 5. `components/pwa/install-prompt.tsx` ('use client') — закрывает `fb_d72b457c3b94`
- Слушает `beforeinstallprompt` (preventDefault, сохраняет event) → dismissible pill «⬇ Установить приложение» → `evt.prompt()`; по `appinstalled` или dismiss — прячет + localStorage `pwa_install_dismissed`.
- iOS Safari (нет события, `isIos() && !standalone`) → тултип-инструкция «Поделиться → На экран „Домой"».
- Не показывать если `isInStandaloneMode()` или dismissed.
- RU+EN через `dictionaries` (новый ключ `pwa`). Pattern зеркалит `LangSuggestBanner` (fixed, dismissible).

### 6. `lib/pwa.ts` — чистые хелперы + константы
`isIos(): boolean` (UA + iPad-on-iOS13 touch heuristic), `isInStandaloneMode(): boolean` (`matchMedia('(display-mode: standalone)')` + iOS `navigator.standalone`). Гарды на `undefined` window/navigator (SSR-safe).

## Линковка `app/layout.tsx`
- `metadata`: добавить `manifest: '/manifest.webmanifest'` (Next инжектит автоматически из manifest.ts, но явный ок), `appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Точка Сборки' }`.
- `viewport`/`themeColor` export (Next 16 `viewport` export): `themeColor: '#0a0a0f'`.
- В `<body>` рядом с `<LangSuggestBanner/>`: `<PwaRegister/>` + `<InstallPrompt/>`.

## i18n
Новый раздел `dictionaries.pwa`: `{ install, installing, iosHint, dismiss }` RU+EN. Интерфейс + оба объекта.

## Тесты (vitest env=node)
- `app/manifest.test.ts`: вызвать `manifest()`, проверить name, display==='standalone', start_url==='/', наличие иконок 192 и 512, maskable purpose.
- `lib/pwa.test.ts`: `isIos`/`isInStandaloneMode` через мок `navigator.userAgent`/`window.matchMedia`/`navigator.standalone`; SSR-гард (undefined window) → false.
- `public/sw.js` — content-guard-тест опционален; не рендерим.

## Гейты
vitest · web `tsc --noEmit` · workers `tsc --noEmit` (Gotcha 2) · `wrangler deploy --dry-run` (Gotcha 1) · `next build` → подтвердить `out/manifest.webmanifest` + `out/icon-*.png` + `out/sw.js` эмитятся.

## Вне scope
Push, background sync, полноценный offline-курс (только shell), per-skin иконки, кастомный install-UI сложнее pill+тултип.

## Критерий готовности
LMS проходит install-критерий (manifest + иконки + SW с fetch); install-pill на десктопе, iOS-инструкция на iPhone; не мозолит после установки/закрытия. Билдеры/хелперы покрыты; все гейты зелёные; артефакты в `out/`.
