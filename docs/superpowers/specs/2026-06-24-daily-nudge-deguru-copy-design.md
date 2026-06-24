# Daily-nudge de-guru copy rotation — Design

**Ticket:** `fb_1ad2f599423d` (Tochka Sborki drip schedule & daily-message copy) — carved to the
live-consumer delta only.

**Date:** 2026-06-24

## Goal

Replace the single static daily-nudge line with a deterministically rotated set of honest,
de-guru'd daily messages, sent by the live Telegram daily-nudge cron. Bilingual ru + en, with
an honest-builder voice — no fabricated open-rate stats, no scarcity, no covert
lead-manipulation framing.

## Scope (carved by honest triage)

The ticket bundles two things; only one has a live consumer today.

- **In scope (live-consumer delta):** the wording/voice of the daily nudges. Today
  `workers/src/handlers/nudge-cron.ts` sends one fixed line (`copy.nudgeIntro`) to every
  eligible learner. The delta is a small authored set of de-guru'd variants, selected
  deterministically so consecutive daily nudges vary instead of repeating one line.
- **Out of scope (deferred):**
  - Day-by-day drip-**unlock** calendar ("which lesson unlocks on which day") — a new gating
    mechanic that conflicts with the open / sovereign course ethos; the cron already targets
    `nextLesson(completed, viewed)`, which is the natural cadence. Not built.
  - Per-user nudge personalization (epoch-day rotation is enough).
  - Voice/audio nudges.

## Architecture

Data + a one-line wire-up, entirely within `workers/`. The nudge variants and a pure selector
live in `workers/src/lib/bot-copy.ts` (the bot's copy module); the cron handler swaps its
single `copy.nudgeIntro` reference for the selector. The selector is pure and seeded by the
`nowSec` value the cron already receives, so it is deterministic and unit-testable, and rotates
day to day (the nudge throttle is ~20h, so a learner gets at most ~1/day; an epoch-day index
makes consecutive nudges differ). No new dependency, no schema change, no new endpoint.

## Components

### `workers/src/lib/bot-copy.ts` (modified)

Add a bilingual variant set and a pure selector. Keep the existing `nudgeIntro` field
(legacy; only the cron consumes it) so nothing else breaks — `NUDGE_VARIANTS[locale][0]` is the
exact current `nudgeIntro` string for each locale.

```ts
export const NUDGE_VARIANTS: Record<BotLocale, string[]> = {
  ru: [
    'Привет! Не теряем темп — у тебя есть незаконченный модуль. Продолжим?', // === RU.nudgeIntro
    'Эй, пара минут найдётся? Следующий модуль ждёт — можно продолжить прямо сейчас.',
    'Без давления: когда будет настроение строить — твой курс на том же месте. Продолжим?',
    'Маленький шаг сегодня двигает дело. Открыть следующий модуль?',
    'Ты остановился на интересном. Готов вернуться к сборке?',
  ],
  en: [
    "Hey! Let's keep the momentum — you've got an unfinished module. Continue?", // === EN.nudgeIntro
    'Got a couple of minutes? Your next module is right where you left it — pick it up now?',
    'No pressure: whenever you feel like building, the course is in the same spot. Continue?',
    'A small step today moves the work. Open the next module?',
    'You stopped at a good part. Ready to get back to building?',
  ],
}

/** Deterministic daily rotation. seed = nowSec; epoch-day index keeps consecutive
 *  daily nudges different, and is stable for tests. */
export function pickNudge(locale: BotLocale, seed: number): string {
  const variants = NUDGE_VARIANTS[locale]
  const i = Math.floor(seed / 86400) % variants.length
  return variants[i]
}
```

The `BotCopy` interface, `botCopy`, `pickLocale`, and `ASK_PROMPTS` are unchanged. The
`nudgeIntro` field stays (and must remain equal to `NUDGE_VARIANTS[locale][0]`).

### `workers/src/handlers/nudge-cron.ts` (modified)

One change. Import `pickNudge` alongside `botCopy`/`pickLocale`, and at the send site replace
`copy.nudgeIntro` with `pickNudge(locale, nowSec)`:

```ts
await sendMessage(env, Number(c.telegram_id), pickNudge(locale, nowSec), { text: copy.nudgeLabel, url: lessonUrl(next.slug, locale) })
```

`copy` is still used for `copy.nudgeLabel` (the button), so the `botCopy(locale)` call stays.
The throttle, policy guard, `nextLesson` targeting, `last_nudge_at` stamping, and error
handling are untouched.

## Data flow

Pure. `runDailyNudge` already computes `locale` and receives `nowSec`; it now calls
`pickNudge(locale, nowSec)` to choose the message text. No storage, no fetch beyond the
existing `sendMessage`.

## Error handling

`pickNudge` is total over the closed `BotLocale` union and a non-empty variant array; the
modulo guarantees a valid index for any non-negative seed. No new failure modes. The cron's
existing per-learner try/catch (does not abort the batch on a send failure) is unchanged.

## Authenticity (binding)

- Honest-builder persona, NOT a guru. No fabricated open-rate stats, no scarcity, no
  countdown, no covert lead-manipulation framing.
- Short (Telegram), warm, no pressure. Each variant states the real situation (an unfinished
  module) and invites, never coerces.
- `NUDGE_VARIANTS[locale][0]` preserves the existing, already-reviewed line verbatim.

## Testing

- **`workers/src/lib/bot-copy.test.ts` (new):**
  - For `'ru'` and `'en'`: `NUDGE_VARIANTS[locale]` has ≥4 entries, all non-empty; the
    `nudgeIntro` of that locale equals `NUDGE_VARIANTS[locale][0]`.
  - `pickNudge(locale, seed)` returns a member of `NUDGE_VARIANTS[locale]` for both locales.
  - Determinism: `pickNudge(l, s) === pickNudge(l, s)` for a fixed seed.
  - Index correctness: `pickNudge(l, seed)` equals
    `NUDGE_VARIANTS[l][Math.floor(seed/86400) % len]` for sample seeds (e.g. `0`, `86400`,
    `86400 * (len)` wraps to index 0, and the cron's `NOW = 1_800_000_000`).
  - Rotation: two seeds exactly `86400` apart map to adjacent indices (differ unless len divides
    the gap) — assert the indices differ when `len > 1`.
  - ru and en variant sets differ (bilingual, not a copy).
- **`workers/src/handlers/nudge-cron.test.ts` (extended):** add one test — for an eligible
  ru learner, the sent `body.text` is a member of `NUDGE_VARIANTS['ru']`. The four existing
  tests (which assert the button url and sent count, not the text) stay green.

Run: `cd workers && npx vitest run src/lib/bot-copy.test.ts src/handlers/nudge-cron.test.ts`
and the full `npx vitest run`.

## Global constraints

- All files under `workers/`. CF Worker runtime (no DOM, no Node-specific APIs in the changed
  code).
- Bilingual ru + en in every authored nudge string.
- Additive only: do not change the button, the `lessonUrl` target, the throttle/policy,
  `last_nudge_at` stamping, `BotCopy`/`botCopy`/`pickLocale`/`ASK_PROMPTS`, or the existing
  `nudgeIntro` text — only add `NUDGE_VARIANTS` + `pickNudge` and swap the one send-site
  reference.
- `NUDGE_VARIANTS[locale][0]` must remain byte-identical to that locale's existing
  `nudgeIntro`.
- Deploy is the workers CI job (NOT frontend-only); copy reaches live Telegram learners via the
  daily cron. No migration, no secret change.

## Files

| File | Responsibility |
|---|---|
| `workers/src/lib/bot-copy.ts` | `NUDGE_VARIANTS` (bilingual) + pure `pickNudge` selector |
| `workers/src/lib/bot-copy.test.ts` | variant + selector tests |
| `workers/src/handlers/nudge-cron.ts` | swap send-site `copy.nudgeIntro` → `pickNudge(locale, nowSec)` |
| `workers/src/handlers/nudge-cron.test.ts` | assert sent text ∈ variants |

## Out of scope

- Day-by-day drip-unlock calendar / lesson gating.
- Per-user nudge personalization.
- Voice/audio nudges.
- Any change to throttle, policy, targeting, or the button.
