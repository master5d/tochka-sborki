# Global Light/Dark/System theme → hub + mentor (+ blog)

**Дата:** 2026-05-31
**Статус:** на ревью
**Источник:** тема уже построена в `web/` (PR #15). Раскатываем тот же приём на `hub/`
(mamaev.coach + блог) и `mentor/` (mentor.mamaev.coach), которые сейчас дарк-онли.

## Цель

3-состояльный глобальный выбор темы (Светлая / Тёмная / Система) с system-автодетектом и
персистом, как в web. Один бренд (model-kit, неон-по-чёрному / тёплая бумага), та же
WCAG-выверенная палитра, что и в web. Тоггл в новом мини-хедере (на hub/mentor нет навигации).

## Архитектура (зеркалит web; строка `model-kit` нигде в компонентах не используется)

### 1. Унификация токенов
Заменить дарк-онли `[data-theme="model-kit"]` в `hub/themes/model-kit.css` и
`mentor/themes/model-kit.css` на блок из `web/themes/model-kit.css` дословно:
`:root` (агностик: шрифты, radius, scale) + `[data-theme="dark"]` + `[data-theme="light"]`.
Имя файла сохраняется (импортится из `globals.css`). Суперсет токенов — добавляет
`--text-on-accent`, `--crit`, `--phase-1..4`, `--number-size`, `--accent-line`; ничего не ломает.

### 2. Рантайм темы (дублируется в каждое приложение — общего пакета нет, файлы крошечные)
- `lib/theme-pref.ts` — копия web 1:1 (`ThemePref`, `THEME_KEY='theme-pref'`, detect/read/store/resolve).
- `components/theme-provider.tsx` — копия web (mount-гидрация + pref-keyed matchMedia live-follow; `setPref` ставит `data-theme`).
- `components/theme-toggle.tsx` — упрощённая копия: 3-сегментный radiogroup [☀️][🌙][🖥️], **без** зависимости от `dictionaries` — инлайн RU-лейблы (`Светлая` / `Тёмная` / `Система`), mounted-gate.
- `app/layout.tsx`: добавить `themeScript` IIFE в `<head>` (читает `localStorage['theme-pref']`; только явный 'light'/'dark' побеждает, иначе `prefers-color-scheme`), `suppressHydrationWarning` на `<html>`/`<head>`/`<body>`, обёртка `<ThemeProvider>`. Убрать `data-theme="model-kit"`.

### 3. Мини-хедер
Новый `components/site-header.tsx` в каждом приложении: тонкая полоса (`border-bottom`,
mono, бренд-токены) — слева вордмарк-ссылка домой (hub: «mamaev.coach»; mentor: «Mamaev ·
Agent Engineering»), справа `<ThemeToggle>`. Рендерится в root-layout под `LangSuggestBanner`,
статичный (не sticky — чтобы не конфликтовать с «← Блог» в постах). Виден на всех страницах,
включая `/blog/*`.

### 4. Цвет-аудит hub/mentor компонентов
Пройти `home-page.tsx` и прочие компоненты на хардкод-хексы, ломающиеся в light (чёрный текст
на акценте → `--text-on-accent`; литеральные `#ff…` ошибки → `--crit`; тёмные литералы →
токены). Пролог/горизонты/blog-* уже на `var()` — им light достаётся бесплатно.

## Файлы

**hub:** `themes/model-kit.css` (replace), `lib/theme-pref.ts` (new), `components/theme-provider.tsx`
(new), `components/theme-toggle.tsx` (new), `components/site-header.tsx` (new),
`app/layout.tsx` (edit), + аудит-правки компонентов.
**mentor:** те же, кроме блога.

## Верификация

- `npm run build` в hub и mentor — чисто.
- Живые скрины в ОБЕИХ темах: hub `/`, `/blog/prologue`, `/blog/horizons`; mentor `/`.
- Нет FOUC при перезагрузке в light (head-скрипт красит до отрисовки).
- Персист: выбор сохраняется между перезагрузками; «Система» следует за OS вживую.
- Контраст AA — палитра уже выверена в web; проверить, что аудит не оставил хардкодов.

## Вне рамок

- `web/` — уже сделан (PR #15).
- EN-лейблы тоггла (инлайн RU; сайты RU-primary, но `aria-label` на RU ок).
- Изменения в самой палитре (берём web как есть).

## Процесс

Одна спека, реализация hub → mentor, одной рукой. Деплой в конце (CI path-фильтры поднимут
hub-job и mentor-job).
