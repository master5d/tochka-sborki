# Companion Setup Implementation Plan (fb_82646a4b4d05)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) tracking.

**Goal:** Секция «Настрой ИИ-компаньона на весь курс» на `/character`: durable role-prompt (персонализ./generic) + табы 4 агентов с инструкцией «куда вставить в память» + copy.

**Architecture:** Два чистых билдера (`buildCompanionRolePrompt`, `AGENT_MEMORY`) + один client-компонент-аккордеон `CompanionSetup`, вшитый в `profile-client.tsx` под `CharterCard`. Переиспользует `profileToCharter` и clipboard-паттерн `CharterCard`.

**Tech Stack:** Next.js 16 static export, React client, inline-style токены, vitest env=node (тесты на чистые билдеры), Plausible.

**Spec:** `docs/superpowers/specs/2026-06-17-companion-setup-design.md`

---

### Task 1: `AGENT_MEMORY` метаданные (pure)

**Files:**
- Create: `LMS/tochka-sborki/web/lib/intake/agent-memory.ts`
- Test: `LMS/tochka-sborki/web/lib/intake/agent-memory.test.ts`

- [ ] **Step 1:** Failing test — `AGENT_MEMORY` length 4; keys chatgpt/claude/gemini/copilot; каждый `where.ru` и `where.en` непустые.
- [ ] **Step 2:** `vitest run lib/intake/agent-memory.test.ts` → FAIL.
- [ ] **Step 3:** Implement `AgentMemory` interface + `AGENT_MEMORY` (4 элемента из спека).
- [ ] **Step 4:** `vitest run` → PASS.

### Task 2: `buildCompanionRolePrompt` (pure)

**Files:**
- Create: `LMS/tochka-sborki/web/lib/intake/companion-role-prompt.ts`
- Test: `LMS/tochka-sborki/web/lib/intake/companion-role-prompt.test.ts`

- [ ] **Step 1:** Failing tests — профиль вшивает личность (через `profileToCharter`, проверить наличие мира/наставника); `null` → generic (нет имени мира, есть «Точка Сборки»); оба содержат memory-директиву (`/все.*сесси|across.*session|запомни|remember/i`) и co-thinking; RU+EN.
- [ ] **Step 2:** `vitest run` → FAIL (not exported).
- [ ] **Step 3:** Implement: залогинен → `profileToCharter` как identity-блок + standing-role-обёртка (course-wide, memory-директива, Learning Loop, co-thinking-закон); `null` → generic role. RU+EN.
- [ ] **Step 4:** `vitest run` → PASS.

### Task 3: `CompanionSetup` компонент

**Files:**
- Create: `LMS/tochka-sborki/web/components/intake/companion-setup.tsx`

- [ ] `<details>`-аккордеон (свёрнут); `<pre>` с role-prompt; «Скопировать роль» (clipboard, паттерн CharterCard); табы `AGENT_MEMORY` → активный показывает `where[locale]`; `plausible('companion_setup_copied',{props:{agent}})`. Props `{ profile:any; locale:Locale }`.

### Task 4: интеграция + гейты

**Files:**
- Modify: `LMS/tochka-sborki/web/app/character/profile-client.tsx`

- [ ] Render `<CompanionSetup profile={profile} locale={locale} />` под `<CharterCard>`.
- [ ] `vitest run` (full) green; web `tsc --noEmit` green; workers `tsc --noEmit` green (Gotcha 2); `wrangler deploy --dry-run` green (Gotcha 1).
- [ ] Commit (branch→ff-merge→push); `fb.mjs status fb_82646a4b4d05 done` + build; memory write-back.

## Self-review
- Spec coverage: role-prompt персонализ./generic ✓ (T2), per-agent memory ✓ (T1), accordion+copy+tabs ✓ (T3), integration ✓ (T4), tests ✓.
- Type consistency: `Locale` from `@/lib/intake/types`; `profileToCharter(profile, locale)` signature reused; `AgentMemory.where:{ru,en}`.
- YAGNI: no dashboard pointer, no embedded chat, no server store.
- ⚠ `companion-role-prompt.ts` imports `profileToCharter` from `./charter` — НЕ потребляется воркером (только profile-client/component), но держать относительные импорты на случай (Gotcha 2). Проверить workers tsc в T4.
