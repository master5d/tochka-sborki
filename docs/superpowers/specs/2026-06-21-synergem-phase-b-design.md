# Synergem — Phase B Design Spec (alumni epic)

**Date:** 2026-06-21
**Epic:** `fb_7fdd9f891109` (post-course group effort + matching). Grounded in the owner's article
"Социальный Дизайн Будущего" (Notion), which reframes the feature as **синергемы**.

## Reframe

The post-course collective unit is a **синергема**: an autonomous cluster of learners forming
around a shared interest/effort, who amplify each other ("когнитивная интерференция"). Matching =
«синдицированная экономика, основанная на интересах» — people cluster by shared interest into
synergems. This replaces the flat "alumni directory" framing.

## Scope (owner-selected: split epic + bounded Phase B)

**Phase B (this spec, built):** reframe the existing niche-grouped opt-in directory as synergem
clusters + adopt the синергема vocabulary. No new migration (reuses Phase A's `alumni_*` columns).

- `lib/synergem.ts` (+test) — pure `clusterAlumni(entries)`: group by niche (null→'other'),
  sorted by count desc then key, 'other' last. Returns `{key, entries, count}[]`.
- `components/alumni-client.tsx` — uses `clusterAlumni`; vocabulary "Выпускники/Alumni" →
  "Синергемы/Synergems"; per-cluster header shows `⬡ <label> · N` + an invite line
  ("N building nearby — reach out and gather"); opt-in/blurb copy reframed to "gather a synergem".
- `app/alumni/page.tsx` + `app/en/alumni/page.tsx` — metadata titles → Synergems (still noindex).

**Gate (unchanged owner step):** the feature is DORMANT until migration `0007_alumni_optin.sql` is
applied to prod D1 (`wrangler d1 execute tochka-sborki-db --remote --file`), and the nav link is
intentionally withheld until then. So `fb_7fdd9f891109` stays **pending** (built, not live).

## Split-off follow-on tickets (epic)

- `fb_bfbdbcf0c2b4` — structured interest/effort matching field (синдицированная экономика; Phase C)
- `fb_c3a3d02458df` — synthetic mentor (AI mentor per synergem)
- `fb_daa79c74eff9` — built-in acceleration program
- `fb_c5d771f00e9a` — ИГИ (Игра в Групповой Инсайт) group-formation ritual
- `fb_029568403443` — Web3/DAO governance + synergem economy (far horizon)

## Testing

vitest (env=node) on `clusterAlumni`: grouping + counts, null→other, sort order with other-last,
empty input. No React render test (not in stack).
