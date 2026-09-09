---
desops: contract/v1
status: ok
descriptor: 'Model kit: конструктивистский чертёж — гигантский гротеск-заголовок,
  mono-микролейблы, резкие 4px-углы, cyan-акцент; двухтемный (тёмная база + тёплая
  «модельная бумага»).'
dials: {variance: 4, motion: 3, density: 3}
palette:
  dark: {bg: '#0a0a0f', surface: '#16161f', text: '#f0f0f5', muted: '#8e8ea0', accent: '#00d1ff',
    border: '#242433'}
  light: {bg: '#f4f1ea', surface: '#fbf9f4', text: '#15151a', muted: '#5a5a6a', accent: '#0070c0',
    border: '#d8d2c6'}
tokens: inherit
rationale: 'Снято с фактической ДНК (themes/model-kit.css), а не назначено сверху.
  variance 4 — палитра узкая, но phase-ряд и градиент-токены дают вариативность акцента.
  motion 2 — анимаций почти нет, только hover и hero-glow; с 2026-09-08 motion 3 — тема quest: sticky-сцены с петлями и reveal 400 мс. density 3 — лендинг намеренно
  воздушный: section-gap 5rem, короткие блоки, много поля вокруг текста; это подтверждено
  живым замером в design-audit 2026-08-02. Акцент dark совпадает с глобальным seed
  #00D1FF; light-акцент затемнён до #0070c0 ради WCAG-AA (граничный #0077cc не проходил
  на тёплой бумаге).'
---
# hub — DESIGN.md

## Что это за интерфейс

Model kit: конструктивистский чертёж — гигантский гротеск-заголовок, mono-микролейблы, резкие 4px-углы, cyan-акцент; двухтемный (тёмная база + тёплая «модельная бумага»).

## Решения

- 2026-08-27: контракт заведён миграцией (спек 2026-08-27-design-consolidation); dials выставлены из design/identity.json
- 2026-09-08: тема quest (скроллителлинг главной по Adweek×Twitch, спек 2026-09-08-quest-home-design): тинты глав поверх model-kit, sticky-сцены с петлями, reveal 400 мс; motion 2 → 3

## Не делать

- TODO(owner): перенести сюда проектные антипаттерны из legacy — `design/notes/legacy-DESIGN.md`
- (общелабораторное, не про этот проект) hex в разметке мимо токенов (`lint-design.ps1`)

## Доктрина

- `C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\doctrine\INDEX.md`

## Legacy

Прежний DESIGN.md целиком: `design/notes/legacy-DESIGN.md` (ничего не потеряно).
