# Agentic-AI refactor (variant C) — Plan

**Дата:** 2026-05-18
**Решение:** Полный variant C из обсуждения. Курс перестаёт быть «Claude Code only», концепции выносятся в ядро, для Behind-GFW и Sovereign-аудитории добавляется выбор стека.

---

## Strategic decisions (закреплено)

- **Полный scope variant C** (~2-3 дня работы)
- **Hermes** = отдельный hands-on sub-unit + один из 4 стеков
- **Audience «прагматик»**: матрица «твой контекст → твой стек», 4 варианта симметричны
- **Renumbering**: новый модуль вставляется как `03-stack-selection`. Текущие 03-07 сдвигаются → 04-08. Всего модулей становится **9** (0-8).

---

## 4 стека (фундамент нового модуля)

| Stack | Когда выбирать | Главные инструменты | Цена |
|---|---|---|---|
| **Claude Code (paid)** | Бюджет $20+/мес, нужна max capability | Claude Code CLI, Anthropic API, MCP | ~$20/мес min |
| **Sovereign (по SOVERN)** | Хочешь автономность, есть GPU/Mac M-series | Hermes (boss) + Aider/Cline + local Qwen3-Coder-30B | $0 + железо |
| **Cloud-OSS** | Низкий бюджет, нет железа | Cline + OpenRouter (Qwen, DeepSeek), Aider + free клауды | $0–5/мес |
| **Behind-GFW** | В Китае, без VPN | Cerebras free + Gemini Flash + local llama-server, Hermes orchestration | $0 |

---

## Module 03-stack-selection — структура

Следуем 4-phase pattern (Activation / Reflection / Concept / Practice). 5 unit-ов:

1. **u1-activation** — «Какие у тебя ограничения?» Quiz-вопросы про бюджет / страну / железо / приватность
2. **u2-stack-matrix** — Concept. Матрица 4 стеков, trade-offs, decision tree
3. **u3-behind-gfw** — Hands-on для китайской аудитории. Cerebras + Gemini Flash + local llama-server. Без VPN.
4. **u3.5 u4-hermes-sovereign** — Hands-on запуск Hermes на своей машине (SOVERN-вариант)
5. **u5-migrate** — Practice. Выбери стек → опиши план миграции своего workflow

---

## Components plan

**`web/components/agent-toggle.tsx`** (новый):
- 4 кнопки: 🤖 Claude Code | 🛡️ Sovereign | ☁️ Cloud-OSS | 🌏 Behind GFW
- Хранит в `localStorage.stack`
- Аналог OsToggle, но без перезагрузки страницы (можно с reload для простоты)

**`web/components/agent-block.tsx`** (новый):
- `<AgentBlock stack="claude">...</AgentBlock>`
- Аналог OsBlock с фильтрацией по `localStorage.stack`
- Возможные значения: `claude` | `sovereign` | `cloud-oss` | `behind-gfw`
- Без выбора — показывает всё

**`web/components/stack-matrix.tsx`** (новый):
- Большая визуальная матрица 4 стеков для модуля 03
- 4 карточки в grid 2×2 (desktop) / stack (mobile)
- На клик карточки — выставляет `localStorage.stack` и подсвечивает соответствующие блоки в дальнейших уроках

---

## File-level changes

### Создать
- `web/content/{ru,en}/03-stack-selection/_meta.json`
- `web/content/{ru,en}/03-stack-selection/u1-activation.mdx`
- `web/content/{ru,en}/03-stack-selection/u2-stack-matrix.mdx`
- `web/content/{ru,en}/03-stack-selection/u3-behind-gfw.mdx`
- `web/content/{ru,en}/03-stack-selection/u4-hermes-sovereign.mdx`
- `web/content/{ru,en}/03-stack-selection/u5-migrate.mdx`
- `web/components/agent-toggle.tsx`
- `web/components/agent-block.tsx`
- `web/components/stack-matrix.tsx`

### Переименовать (folders в content/ru и content/en, оба)
- `03-prompt-engineering` → `04-prompt-engineering`
- `04-context-memory` → `05-context-memory`
- `05-audio-pipeline` → `06-audio-pipeline`
- `06-tools` → `07-tools`
- `07-agent-engineering` → `08-agent-engineering`

В каждой `_meta.json` обновить поля `module` и `level` (по новой нумерации).

### Изменить копи
- `01-introduction/u2-four-shifts.mdx` — переименовать «Claude Code» → «agentic coding agents (Claude Code как пример)»
- `03-prompt-engineering` (новый номер 04) — концептуальные секции
- `04-context-memory` (новый 05) — концепты CLAUDE.md → agent context file (CLAUDE.md как реализация)
- `07-agent-engineering` (новый 08) — orchestration agnostic

### Добавить callouts в `06-audio-pipeline` (новый), `07-tools` (новый)
- Pipeline: «то же в Aider/Hermes через ...»
- Tools (MCP/Hooks/Skills): «MCP — единый протокол, поддерживается CC, Cline, Goose; Hermes использует свой router»

### Hero / Venn / Dictionaries
- `web/lib/dictionaries.ts`:
  - hero.stats: `['8', 'тем']` → `['9', 'тем']` + EN
  - venn.items: добавить 9-й пункт «Выбор стека: какой агентский фреймворк под твою ситуацию»
  - footer.tagline: «8 элективных тем» → «9 элективных тем» + EN
- Audit doc cheatsheet — ничего не трогаем

### Кросс-проектные файлы
- Корневой `ROADMAP.md` — обновить (там карта 7 уровней)
- Корневой `INDEX.md` — добавить модуль 03
- Корневой `README.md` — обновить структуру
- `CLAUDE.md` — обновить список модулей

---

## Acceptance criteria

- [ ] `npm run build` zelёный, 99→~108 страниц (+9-10 на 5 новых unit-ов × 2 локали = 10 + module landing × 2)
- [ ] Главная страница показывает 9 модулей в программе
- [ ] Hero stats: «9 тем» в обеих локалях
- [ ] AgentToggle работает: переключение фильтрует AgentBlock-секции
- [ ] StackMatrix кликабельная, выставляет stack
- [ ] Behind-GFW гайд содержит реальные шаги (Cerebras signup, llama-server install, базовая Hermes setup)
- [ ] Sidebar в lessons показывает новый модуль на правильной позиции

---

## Out of scope (не делаю в этой итерации)

- Перевод всех модулей на полностью agent-agnostic язык — только концептуальные секции
- Полная hands-on часть для cloud-OSS стека (Cline + OpenRouter) — описание есть, hands-on в следующей итерации
- Видео / скриншоты Hermes UI — текстовые гайды только

---

## Order of execution

1. ✅ PLAN.md (этот файл)
2. AgentToggle + AgentBlock components
3. StackMatrix component
4. Module 03-stack-selection — все 5 units RU
5. Module 03-stack-selection — EN translation
6. Renumbering folders 03-07 → 04-08
7. Update _meta.json files (module/level numbers)
8. Update dictionaries.ts (hero stats, venn, footer)
9. Update Claude→agentic в концепциях 01/04/05/08
10. Callouts в 06/07
11. Корневые .md файлы (ROADMAP/INDEX/README/CLAUDE.md)
12. Build + manual smoke test
