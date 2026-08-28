---
desops: contract/v1
status: draft
descriptor: 'Model kit в читательском регистре: тот же чертёж, но длинная колонка
  эссе — воздух вместо плотности, акцент только на связках.'
dials: {variance: null, motion: null, density: null}
palette:
  dark: {bg: '#0a0a0f', surface: '#16161f', text: '#f0f0f5', muted: '#8e8ea0', accent: '#00d1ff',
    border: '#242433'}
  light: {bg: '#f4f1ea', surface: '#fbf9f4', text: '#15151a', muted: '#5a5a6a', accent: '#0063ab',
    border: '#d8d2c6'}
tokens: inherit
---
# blog — DESIGN.md

## Что это за интерфейс

Model kit в читательском регистре: тот же чертёж, но длинная колонка эссе — воздух вместо плотности, акцент только на связках.

## Решения

- 2026-08-28: палитра и дескриптор перенесены из фактического источника проекта — `themes/model-kit.css`; прежнее значение поставила миграция по частоте hex, и оно было неверным
- 2026-08-27: контракт заведён миграцией (спек 2026-08-27-design-consolidation); dials НЕ выставлены — status draft, выставить при первом касании

## Не делать

- TODO(owner): перенести сюда проектные антипаттерны из legacy — `design/notes/legacy-DESIGN.md`
- (общелабораторное, не про этот проект) hex в разметке мимо токенов (`lint-design.ps1`)

## Доктрина

- `C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\doctrine\INDEX.md`

## Legacy

Прежний DESIGN.md целиком: `design/notes/legacy-DESIGN.md` (ничего не потеряно).
