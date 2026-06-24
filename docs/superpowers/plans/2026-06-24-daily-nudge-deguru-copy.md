# Daily-nudge de-guru Copy Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single static daily-nudge line with a deterministically rotated set of honest, de-guru'd bilingual messages in the live Telegram daily-nudge cron.

**Architecture:** Data + one-line wire-up, entirely within `workers/`. A bilingual `NUDGE_VARIANTS` set and a pure `pickNudge` selector live in `workers/src/lib/bot-copy.ts`; the cron handler (`workers/src/handlers/nudge-cron.ts`) swaps its single `copy.nudgeIntro` reference for `pickNudge(locale, nowSec)`. The selector is pure and seeded by the `nowSec` the cron already receives — deterministic, unit-testable, rotates day to day.

**Tech Stack:** Cloudflare Worker (TypeScript), Vitest.

## Global Constraints

- All files under `workers/`. CF Worker runtime (no DOM / Node-specific APIs in changed code).
- Bilingual ru + en in every authored nudge string.
- Additive only: do not change the button, the `lessonUrl` target, the throttle/policy, `last_nudge_at` stamping, `BotCopy`/`botCopy`/`pickLocale`/`ASK_PROMPTS`, or the existing `nudgeIntro` text — only add `NUDGE_VARIANTS` + `pickNudge` and swap the one send-site reference.
- `NUDGE_VARIANTS[locale][0]` MUST remain byte-identical to that locale's existing `nudgeIntro` string.
- Authenticity: honest-builder voice, NOT a guru. No fabricated open-rate stats, no scarcity/countdown, no covert lead-manipulation. Short, warm, no pressure.
- Run tests from `workers/`: `npx vitest run`.
- Deploy is the workers CI job (NOT frontend-only); copy reaches live Telegram learners via the daily cron.

---

### Task 1: NUDGE_VARIANTS data + pure pickNudge selector

**Files:**
- Modify: `workers/src/lib/bot-copy.ts`
- Test: `workers/src/lib/bot-copy.test.ts` (new)

**Interfaces:**
- Consumes: existing `BotLocale`, `RU`/`EN` `nudgeIntro`, `botCopy` in `bot-copy.ts`.
- Produces (relied on by Task 2):
  - `export const NUDGE_VARIANTS: Record<BotLocale, string[]>` (≥4 per locale; `[0]` === that locale's `nudgeIntro`)
  - `export function pickNudge(locale: BotLocale, seed: number): string`

- [ ] **Step 1: Write the failing tests**

Create `workers/src/lib/bot-copy.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { NUDGE_VARIANTS, pickNudge, botCopy } from './bot-copy'

const LOCALES = ['ru', 'en'] as const

describe('NUDGE_VARIANTS', () => {
  for (const loc of LOCALES) {
    it(`${loc}: >=4 non-empty variants, [0] === nudgeIntro`, () => {
      const v = NUDGE_VARIANTS[loc]
      expect(v.length).toBeGreaterThanOrEqual(4)
      for (const s of v) expect(s.trim().length).toBeGreaterThan(0)
      expect(v[0]).toBe(botCopy(loc).nudgeIntro)
    })
  }
  it('ru and en variant sets differ (bilingual)', () => {
    expect(NUDGE_VARIANTS.ru.join('|')).not.toBe(NUDGE_VARIANTS.en.join('|'))
  })
})

describe('pickNudge', () => {
  for (const loc of LOCALES) {
    it(`${loc}: returns a member of the variant set`, () => {
      expect(NUDGE_VARIANTS[loc]).toContain(pickNudge(loc, 1_800_000_000))
    })
    it(`${loc}: deterministic for a fixed seed`, () => {
      expect(pickNudge(loc, 1_800_000_000)).toBe(pickNudge(loc, 1_800_000_000))
    })
    it(`${loc}: index = floor(seed/86400) % len`, () => {
      const v = NUDGE_VARIANTS[loc]
      for (const seed of [0, 86400, 86400 * v.length, 1_800_000_000]) {
        expect(pickNudge(loc, seed)).toBe(v[Math.floor(seed / 86400) % v.length])
      }
    })
    it(`${loc}: rotates — seeds one day apart give different variants`, () => {
      expect(pickNudge(loc, 0)).not.toBe(pickNudge(loc, 86400))
    })
  }
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd workers && npx vitest run src/lib/bot-copy.test.ts`
Expected: FAIL — `NUDGE_VARIANTS` and `pickNudge` are not exported.

- [ ] **Step 3: Add NUDGE_VARIANTS and pickNudge**

In `workers/src/lib/bot-copy.ts`, after the `botCopy` function (and after `pickLocale` is fine too — place it at the end of the file, before or after `pickLocale`), add:

```ts
export const NUDGE_VARIANTS: Record<BotLocale, string[]> = {
  ru: [
    'Привет! Не теряем темп — у тебя есть незаконченный модуль. Продолжим?',
    'Эй, пара минут найдётся? Следующий модуль ждёт — можно продолжить прямо сейчас.',
    'Без давления: когда будет настроение строить — твой курс на том же месте. Продолжим?',
    'Маленький шаг сегодня двигает дело. Открыть следующий модуль?',
    'Ты остановился на интересном. Готов вернуться к сборке?',
  ],
  en: [
    "Hey! Let's keep the momentum — you've got an unfinished module. Continue?",
    'Got a couple of minutes? Your next module is right where you left it — pick it up now?',
    'No pressure: whenever you feel like building, the course is in the same spot. Continue?',
    'A small step today moves the work. Open the next module?',
    'You stopped at a good part. Ready to get back to building?',
  ],
}

/** Deterministic daily rotation. seed = nowSec; the epoch-day index keeps consecutive
 *  daily nudges different and is stable for tests. */
export function pickNudge(locale: BotLocale, seed: number): string {
  const variants = NUDGE_VARIANTS[locale]
  const i = Math.floor(seed / 86400) % variants.length
  return variants[i]
}
```

The `ru[0]` and `en[0]` strings are byte-identical to the existing `RU.nudgeIntro` /
`EN.nudgeIntro` values (lines 30 and 49) — copy them verbatim. Do not change the `nudgeIntro`
fields themselves.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd workers && npx vitest run src/lib/bot-copy.test.ts`
Expected: PASS — all variant + selector tests green.

- [ ] **Step 5: Run the full worker suite to confirm no regression**

Run: `cd workers && npx vitest run`
Expected: PASS — full suite green (existing nudge-cron tests unaffected).

- [ ] **Step 6: Commit**

```bash
git add workers/src/lib/bot-copy.ts workers/src/lib/bot-copy.test.ts
git commit -m "feat(bot): de-guru daily-nudge variants + pickNudge selector (fb_1ad2f599423d)"
```

---

### Task 2: Wire pickNudge into the daily-nudge cron

**Files:**
- Modify: `workers/src/handlers/nudge-cron.ts`
- Test: `workers/src/handlers/nudge-cron.test.ts`

**Interfaces:**
- Consumes (from Task 1): `pickNudge`, `NUDGE_VARIANTS` from `../lib/bot-copy`.
- Produces: no new exports; `runDailyNudge` now sends `pickNudge(locale, nowSec)` as the message text.

- [ ] **Step 1: Write the failing test**

In `workers/src/handlers/nudge-cron.test.ts`, update the import on line 2-4 area to also import `NUDGE_VARIANTS`. Change the existing import block top of file by adding this import line after the existing imports:

```ts
import { NUDGE_VARIANTS } from '../lib/bot-copy'
```

Then append a new test inside the `describe('runDailyNudge', () => { ... })` block (before its closing `})`):

```ts
  it('sends one of the de-guru nudge variants as the message text', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const res = await runDailyNudge(
      makeEnv({ candidates: [candidate()], progress: [{ lesson_slug: '00-kickstart', viewed_at: NOW - TWO_DAYS, completed_at: NOW - TWO_DAYS }] }),
      NOW
    )
    expect(res.sent).toBe(1)
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(NUDGE_VARIANTS.ru).toContain(body.text)
  })
```

(`candidate()` defaults to `language: 'ru'`, so the sent text must be a ru variant.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/handlers/nudge-cron.test.ts`
Expected: FAIL — the cron still sends `copy.nudgeIntro`; while `nudgeIntro` IS `NUDGE_VARIANTS.ru[0]` so this specific assertion might pass by coincidence. To make the test genuinely drive the change, ALSO assert the text is selected by `pickNudge` for `NOW`:

Replace the last assertion line with:

```ts
    const { pickNudge } = await import('../lib/bot-copy')
    expect(body.text).toBe(pickNudge('ru', NOW))
    expect(NUDGE_VARIANTS.ru).toContain(body.text)
```

Now re-run: `cd workers && npx vitest run src/handlers/nudge-cron.test.ts`
Expected: FAIL — `pickNudge('ru', NOW)` is `NUDGE_VARIANTS.ru[Math.floor(NOW/86400) % len]` (index 3 for `NOW = 1_800_000_000`, len 5), but the cron sends `nudgeIntro` (= index 0). The assertion `body.text === pickNudge('ru', NOW)` fails until the wire-up changes.

- [ ] **Step 3: Wire pickNudge into the cron**

In `workers/src/handlers/nudge-cron.ts`:

Update the import on line 4 from:

```ts
import { botCopy, pickLocale } from '../lib/bot-copy'
```

to:

```ts
import { botCopy, pickLocale, pickNudge } from '../lib/bot-copy'
```

Then change the send line (line 50) from:

```ts
      await sendMessage(env, Number(c.telegram_id), copy.nudgeIntro, { text: copy.nudgeLabel, url: lessonUrl(next.slug, locale) })
```

to:

```ts
      await sendMessage(env, Number(c.telegram_id), pickNudge(locale, nowSec), { text: copy.nudgeLabel, url: lessonUrl(next.slug, locale) })
```

Leave the `const copy = botCopy(locale)` line on line 49 (still used for `copy.nudgeLabel`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/handlers/nudge-cron.test.ts`
Expected: PASS — `body.text === pickNudge('ru', NOW)` and is a member of `NUDGE_VARIANTS.ru`; the four existing tests stay green (they assert the button url and sent count, not the text).

- [ ] **Step 5: Run the full worker suite**

Run: `cd workers && npx vitest run`
Expected: PASS — full suite green.

- [ ] **Step 6: Commit**

```bash
git add workers/src/handlers/nudge-cron.ts workers/src/handlers/nudge-cron.test.ts
git commit -m "feat(nudge): rotate daily-nudge copy via pickNudge (fb_1ad2f599423d)"
```

---

## Self-Review

**Spec coverage:**
- `NUDGE_VARIANTS` bilingual ≥4, `[0]` === `nudgeIntro` → Task 1 (Steps 3, 1). ✓
- Pure `pickNudge(locale, seed)` epoch-day rotation → Task 1 (Steps 3, 1). ✓
- Selector determinism + index correctness + rotation + bilingual tests → Task 1 (Step 1). ✓
- Cron swaps `copy.nudgeIntro` → `pickNudge(locale, nowSec)`, keeps `copy.nudgeLabel` → Task 2 (Step 3). ✓
- Cron test asserts sent text === `pickNudge('ru', NOW)` ∈ variants; existing 4 stay green → Task 2 (Steps 1-2, 4). ✓
- Carve (no drip-unlock, no per-user, no voice) → respected; nothing added. ✓

**Placeholder scan:** none — all code complete and verbatim.

**Type consistency:** `NUDGE_VARIANTS: Record<BotLocale, string[]>` and `pickNudge(locale: BotLocale, seed: number): string` defined in Task 1 and consumed in Task 2 with the same names/signatures; `pickNudge('ru', nowSec)` matches `seed: number` (`nowSec` is `number`). `BotLocale` is the existing exported union. The cron's `locale` is `BotLocale` (from `pickLocale`). ✓
