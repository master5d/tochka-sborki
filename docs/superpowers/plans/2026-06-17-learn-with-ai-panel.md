# «Учиться с ИИ» — правая панель / dock + deep-link prefill (fb_e60901c90115)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) tracking.

**Goal:** Закрыть тикет `fb_e60901c90115` — добавить persistent правую панель (floating dock) для «Учиться с ИИ» и сделать так, чтобы кнопки агентов реально несли контекст через `?q=` deep-link (компактный bootstrap), а не открывали пустой homepage.

**Architecture:** Уже есть `buildLearnPrompt` (полный system-промпт, Шаблон 1 спека) + inline-секция `LearnWithAI` в конце юнита. Достраиваем: (1) `buildBootstrapDeepLink` + `agentUrl` в `lib/learn-prompt.ts` — компактный bootstrap (Шаблон 2, ≤1500 симв.) для URL-префилла; (2) `LearnWithAI` получает deep-link на ChatGPT/Claude; (3) новый `LearnWithAIDock` — floating right-side pill, зеркало `blog/components/blog/read-with-ai-dock.tsx`, доступен в течение всего юнита; (4) wire dock в `unit-wizard.tsx`. Полный промпт по-прежнему идёт через clipboard (без лимита длины).

**Tech Stack:** Next.js 16 static export, React client components, inline-style токены (`var(--*)`), vitest env=node (тесты только на чистые билдеры), Plausible analytics.

**Spec:** `docs/superpowers/specs/2026-06-16-learn-with-ai-system-prompt-design.md`

---

### Task 1: `buildBootstrapDeepLink` + `agentUrl` (pure builders)

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/learn-prompt.ts`
- Test: `LMS/tochka-sborki/web/lib/learn-prompt.test.ts`

- [ ] **Step 1: Failing tests** — bootstrap compact RU+EN, ≤1500, mentions module + cycle; `agentUrl` builds chatgpt/claude `?q=`.
- [ ] **Step 2:** `vitest run lib/learn-prompt.test.ts` → FAIL (not exported).
- [ ] **Step 3:** Implement `buildBootstrapDeepLink(i)` (reuse `LearnPromptInput`; compact one-paragraph, cap inquiry/outcome, hard ≤1500 before encode) + `agentUrl(agent,prompt)` (mirror `blog/lib/ai-prompt.ts`).
- [ ] **Step 4:** `vitest run lib/learn-prompt.test.ts` → PASS.
- [ ] **Step 5:** Commit.

### Task 2: deep-link prefill in `LearnWithAI`

**Files:**
- Modify: `LMS/tochka-sborki/web/components/learn-with-ai.tsx`
- Modify: `LMS/tochka-sborki/web/components/unit-wizard.tsx` (pass `bootstrap`)

- [ ] ChatGPT/Claude `<a>` href = `agentUrl(key, bootstrap)`; Gemini/Copilot stay bare (no reliable `?q=`) + rely on copy. Add `bootstrap` prop. Track `{ agent, mode:'inline' }`.
- [ ] Build `learnBootstrap` in unit-wizard alongside `learnPrompt`; pass to `<LearnWithAI bootstrap=... />`.

### Task 3: `LearnWithAIDock` floating panel

**Files:**
- Create: `LMS/tochka-sborki/web/components/learn-with-ai-dock.tsx`

- [ ] Mirror `read-with-ai-dock.tsx`: fixed right/bottom pill «✨ Учиться с ИИ», dismissible (localStorage `lwai_dock_dismissed`), appears past 40% scroll. Expand → ChatGPT/Claude deep-links (`agentUrl(key,bootstrap)`) + «Скопировать устав» (full prompt → clipboard). Props `{ prompt, bootstrap, locale }`. Track `{ agent, mode:'dock' }`.

### Task 4: wire dock into unit + guards

**Files:**
- Modify: `LMS/tochka-sborki/web/components/unit-wizard.tsx`

- [ ] Render `<LearnWithAIDock prompt={learnPrompt} bootstrap={learnBootstrap} locale={locale} />` once at wizard root.
- [ ] `vitest run` (full) green; `npx tsc --noEmit` (web) green; `cd ../../../../workers && npx tsc --noEmit` green (Gotcha 2); `npx wrangler deploy --dry-run` green (Gotcha 1).
- [ ] Commit; `fb.mjs status fb_e60901c90115 done`; write-back.

## Self-review
- Spec coverage: copy=full charter ✓ (existing), deep-link=compact bootstrap ✓ (Task 1-2), dock delivery ✓ (Task 3-4), analytics `{agent,mode}` ✓, guardrails inherited from prompt ✓.
- Type consistency: reuse `LearnPromptInput`; `agentUrl` signature matches blog.
- YAGNI: no inquiry input field (spec allows fallback «над чем работаю по этому уроку» — UnitWizard already supplies module/unit context); embedded chat rejected.
