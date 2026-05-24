# UI/UX Improvements — Niche Slot-Word Fix + Help System — Design Spec

**Status:** Approved (design) · **Date:** 2026-05-24 · **Owner:** Alexander Mamaev (master5d)

Two bundled UI/UX improvements, both client-side:
1. **Niche slot-word fix** — `{niche}` slots render a readable niche word instead of the raw F2 enum (`coach` → `коучинге`/`coaching`).
2. **Help system** — a reusable tap-to-open `HelpTip` ("what · why · how") plus a one-time, re-openable per-page `IntroCard`, so the grown interface is easier to orient in.

## Origin & framing

The learner saw "Назови три задачи в **coach**" — `fillNicheSlots` (`web/lib/cs/applied-challenge.ts`) substitutes the raw F2 enum into `{niche}`. There is no niche-label map. Separately, the interface has grown (Quest Log, Daily Quests, Niche Dungeons, CS economy, Unit Wizard modes) with no in-product explanation, so newcomers can't tell what each surface is for.

## Locked decisions (from brainstorming, 2026-05-24)

| # | Decision | Value |
|---|----------|-------|
| Q1 | Help mechanism | **Hybrid**: reusable tap-popover `HelpTip` + one-time re-openable per-page `IntroCard` (no full coachmark tour) |
| Q2 | Tip trigger | **Tap/click to toggle** (mobile-first; same on touch + desktop; keyboard-accessible). Replaces the few hover-only native `title=` tips |
| Q3 | Coverage | Curated **9 `HelpTip`s** + **3 `IntroCard`s** (dashboard, unit, dungeon) — not exhaustive |
| Q4 | Intro card | **Auto-show first visit + re-openable** via a header `?` (localStorage `help_seen` flag per page) |
| Q5 | Content home | Dedicated **`web/lib/help/help-content.ts`** (`HELP_TIPS` + `INTRO_CARDS`, bilingual), mirrors the bank pattern |
| Q6 | Enum-leak scope | **Niche slot-word fix only** (client). The `legendary_title` "«slavic-myth»" leak is a separate Worker+D1-backfill follow-up (recorded below) |

## Part 1 — Niche slot-word fix

Add to `web/lib/rpg/niche-map.ts` a bilingual slot-word map (locative-optimized — `«в {niche}»` is the dominant template phrasing; minor genitive-case imperfection in `из/для/данных {niche}` spots is accepted, far better than the bare enum):

```ts
import type { Bi } from './types'

export const NICHE_SLOT: Record<string, Bi> = {
  coach:     { ru: 'коучинге',  en: 'coaching' },
  massage:   { ru: 'массаже',   en: 'massage' },
  astrology: { ru: 'астрологии', en: 'astrology' },
  content:   { ru: 'контенте',  en: 'content' },
  ecommerce: { ru: 'e-commerce', en: 'e-commerce' },
  service:   { ru: 'услугах',   en: 'services' },
  tech:      { ru: 'разработке', en: 'tech' },
  // `other` (and any unknown/null) intentionally absent → fillNicheSlots uses NICHE_FALLBACK.
}
```

`fillNicheSlots(text, niche, outcome, locale)` (in `web/lib/cs/applied-challenge.ts`) changes the `{niche}` substitution: map the cleaned raw niche through `NICHE_SLOT[niche]?.[locale]`, falling back to `NICHE_FALLBACK[locale]` when the niche is `other`/unknown/null. `{outcome}` substitution is unchanged. This fixes daily quests, dungeon stages + boss, and applied challenges at one site.

**Test ripple (must update):** tests that passed arbitrary niche strings and expected them echoed:
- `web/lib/cs/applied-challenge.test.ts` — the `fillNicheSlots` tests use `'legal'` (now → fallback `your field`) and the `getAppliedChallenge` slot-fill tests use `'юриспруденции'`/`'legal'`. Update to a **known niche enum** (e.g. `coach`) and assert the **slot word** (`коучинге`/`coaching`); keep one case asserting `other`/null → fallback word.
- `web/lib/quests/build-daily.test.ts` — the practice-body assertions use `niche: 'legal'`/`'design'` and expect `'legal'`/`'design'`. Update to `niche: 'coach'` expecting `'coaching'` (en) / `'коучинге'` (ru); the niche-absent/fallback case stays.
- `web/lib/dungeon/build-dungeon.test.ts` — uses `niche: 'coach'` and only asserts stage bodies are non-empty + boss contains the **outcome** — no raw-niche assertion, so no change needed (verify).

## Part 2 — Help system

All client-side, static-export safe, themed via skin accent. No third-party tooltip/positioning library.

| File | Responsibility |
|------|----------------|
| `web/lib/help/types.ts` | `HelpEntry { title: Bi; body: Bi }` |
| `web/lib/help/help-content.ts` | `HELP_TIPS: Record<string, HelpEntry>` (9) + `INTRO_CARDS: Record<string, HelpEntry>` (3) |
| `web/lib/help/use-help-seen.ts` | localStorage `help_seen` (`Record<string, boolean>`); `useHelpSeen(page)` → `{ seen, dismiss, ready }` (pure helpers + storage shell, mirrors `daily-store`) |
| `web/components/help/help-tip.tsx` | `<HelpTip id locale />` — `ⓘ` `<button>`, tap toggles an absolutely-positioned popover (title+body), closes on outside-click + Escape, `aria-expanded`/`aria-label` |
| `web/components/help/intro-card.tsx` | `<IntroCard page locale accent />` — auto-expanded when `!seen`, dismiss (`×`) collapses + writes flag, a header `?` re-opens; renders nothing until `ready` |

### Tip ids + intent (full bilingual copy authored at plan time)

- `shards` — 💎 Cognitive Shards: your score **and** spendable currency; earn by completing units & quests, spend in the Vault.
- `character` — your legendary title, class, level, and X/9 zones cleared.
- `world-map` — the course as a map; nodes are zones (current / done / locked).
- `daily` — Daily Quests scaled to your time budget; one "advance" + practice/retrieval; resets each day.
- `dungeon-card` — your Niche Dungeon: a domain-specific arc, unlocked by finishing your niche's core module.
- `vault` — spend Cognitive Shards to unlock alternate world themes.
- `wizard-phases` — the 4-phase loop (Activation → Reflection → Concept → Practice).
- `wizard-modes` — Commander / Co-Pilot / Archmage: less help = more shards; the hint hides on Archmage.
- `dungeon-stages` — stages escalate task → process → outcome; the boss is a synthesis challenge.

Intro cards: `dashboard`, `unit`, `dungeon` — each a 2–3 sentence "what is this page / how to use it (tap ⓘ for details)".

### Popover mechanics (minimal)
- A `position: relative` wrapper around the `ⓘ` button; the popover is `position: absolute`, opens below the button, `max-width` ~260px, right-aligned when near the viewport edge (a simple inline style based on a right-side flag prop, default left).
- Open state in component `useState`; a `document` `click` listener (added on open) closes on outside-click; `keydown` Escape closes. Listeners cleaned up on close/unmount.
- `<button type="button" aria-expanded={open} aria-label="…">`; popover has `role="dialog"`/`aria-label`. Decorative glyphs `aria-hidden`.

### Wiring (placement)
- **`dashboard-client.tsx`**: `<IntroCard page="dashboard" …>` at the top of `<main>`; `<HelpTip id="shards">` by ShardBalance, `character` by CharacterStrip, `world-map` by the WorldMap wrapper, `daily` passed into/near DailyPanel header, `dungeon-card` near DungeonCard, `vault` near Vault. (Where a tip belongs *inside* an existing component header — DailyPanel, Vault, DungeonCard — add an optional `helpId?` prop the component renders next to its title, rather than wrapping from outside.)
- **`unit-wizard.tsx`**: `<IntroCard page="unit">` near the breadcrumb; `wizard-phases` by the phase bar; `wizard-modes` in the ModeSelector heading (add an optional `helpId?`/slot to `ModeSelector`).
- **`dungeon-view.tsx`** (rendered by `/dungeon`): `<IntroCard page="dungeon">` at top; `dungeon-stages` by the stages heading.

## Testing

Pure logic (vitest):
- `fillNicheSlots` / `NICHE_SLOT`: known niche → slot word (e.g. `coach`→`coaching`); `other`/unknown/null → fallback word; `{outcome}` unchanged.
- `help-content`: every referenced tip id (the 9 above) exists in `HELP_TIPS` with both locales; every page id (`dashboard`/`unit`/`dungeon`) exists in `INTRO_CARDS` with both locales.
- `use-help-seen`: `dismiss(page)` marks seen + persists; defensive read tolerates malformed JSON; unseen page → `seen=false`.

Components (`HelpTip`, `IntroCard`) and all wiring are presentational — covered by `tsc --noEmit` + `next build`.

## Out of scope (YAGNI)

- Full coachmark/step-through tour overlay.
- The `legendary_title` "«slavic-myth»" leak (separate **follow-up**: fix the Worker intake title generation to use the skin display name + backfill existing `intake_profiles` rows in D1).
- Exhaustive per-element tips beyond the curated 9.
- Hover tooltips / animations / a tooltip library / portals / focus-trap.
- Per-template Russian-grammar perfection for every `{niche}` case (locative-optimized slot words; accepted).
- Server persistence of `help_seen` (client localStorage only).

## Program linkage

A standalone UX-hardening slice over the shipped RPG surface (SP1–SP3 + SP2a–d). Touches `web/lib/cs/applied-challenge.ts` (Part 1) and `web/lib/rpg/niche-map.ts`; adds `web/lib/help/*` + `web/components/help/*` and light wiring into `dashboard-client.tsx`, `unit-wizard.tsx`, `dungeon-view.tsx`. Independent of SP4. Records a follow-up for the `legendary_title` enum leak.
