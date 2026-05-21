# Content Demand Radar — Design Spec

**Status:** Approved (design) · **Date:** 2026-05-21 · **Owner:** Alexander Mamaev (master5d)

RPG-flavored name: **«Кузница квестов» / Quest Forge** (the place where learner demand is forged
into new course content). Functional name in code: **Content Demand Radar**.

## Purpose

Turn unmet learner demand — surfaced in the intake questionnaire as free-text "what I want from AI"
answers — into structured **briefs** for a course architect. The architect is currently the human
owner (manual review); in the future the same brief API is read by a boss-agent. Detection must
distinguish three outcomes: the request is **already covered** by an existing module, it is a genuine
**content gap** worth building, or it is **not feasible** in an agentic-AI environment.

## Locked decisions (from brainstorming, 2026-05-21)

| # | Decision | Value |
|---|----------|-------|
| C1 | Trigger granularity | **Hybrid** — high-value signals raise a brief instantly; everything else accumulates and raises a brief only when a topic crosses a threshold |
| C2 | Detection engine | **Gemini classifier in the Worker** at submit time (flash model), grounded against the 9-module catalog |
| C3 | Delivery | **D1 tables + protected admin page** inside the platform; future boss-agent reads the same API |
| C4 | Brief depth | **Gemini drafts a solution proposal** (proposed type, title, objective, slot, agentic approach) — architect approves or edits |

## Architecture & data flow

Content Demand Radar runs as a **fire-and-forget tail** to `/api/intake/submit`, scheduled via
`ctx.waitUntil(...)` so it never blocks the learner's response (character-sheet redirect stays fast).

```
POST /api/intake/submit
   │  critical path (unchanged): validate → score → Gemini prose → write intake_profiles → 200 {redirect:'/character'}
   │
   └─ ctx.waitUntil( runDemandRadar(env, userId, answers) ):
        1. extractSignals(answers)          → DemandSignal[]   (F3, F2__other)
        2. classifyDemand(signals, catalog) → Gemini flash, per-signal classification + value_tier
        3. for each classification:
             INSERT content_demand_signals
        4. for each signal classified 'gap':
             if value_tier === 'high'                          → maybeRaiseBrief(force=true)
             else if COUNT(gap_topic_key, window) >= THRESHOLD → maybeRaiseBrief(force=false)
        5. maybeRaiseBrief: skip if an 'open' brief already exists for that gap_topic_key;
             else draftBrief() (Gemini pro) → INSERT content_demand_briefs, link signals.brief_id
```

**Constants:** `THRESHOLD = 5`, `WINDOW_MS = 90 * 24 * 60 * 60 * 1000` (90-day rolling window).

### Worker entry change

`src/index.ts` fetch handler signature gains the execution context:
`async fetch(request: Request, env: Env, ctx: ExecutionContext)`. The intake-submit branch passes
`ctx` into the handler so the radar can be scheduled with `ctx.waitUntil`. The critical-path response
is returned exactly as today; the radar runs after.

## Components (files)

| File | Responsibility |
|------|----------------|
| `workers/migrations/0004_content_demand.sql` | Create `content_demand_signals` + `content_demand_briefs` tables |
| `workers/src/lib/demand-signals.ts` | Pure: `extractSignals(answers)`, `valueTier(answers, signal)`, `normalizeTopicKey(s)`, `shouldRaiseBrief(valueTier, topicCount, hasOpenBrief)` |
| `workers/src/lib/demand-gemini.ts` | `classifyDemand(signals, catalog, key, fetchImpl)` (flash) + `draftBrief(topic, quotes, catalog, key, fetchImpl)` (pro), each with template fallback like `gemini.ts` |
| `workers/src/lib/course-catalog.ts` | The 9-module catalog: `{ slug, topic: {ru,en} }[]` — single source the classifier is grounded against |
| `workers/src/handlers/demand.ts` | `runDemandRadar(env, userId, answers)` orchestrator (steps 1–5) + admin handlers: `listBriefs`, `listSignals`, `decideBrief` |
| `workers/src/index.ts` | Add `ctx` to fetch; wire `ctx.waitUntil(runDemandRadar(...))` into submit; add `/api/admin/content-demand/*` routes behind owner check |
| `workers/src/middleware.ts` | Add `requireOwner(request, env)` — `requireAuth` + `auth.sub email === env.OWNER_EMAIL` |
| `web/app/admin/content-demand/page.tsx` + `*-client.tsx` | Client admin page: open briefs (with proposal), signal queue grouped by topic with counts, not-feasible tab, accept/reject buttons |

## Signal extraction

Demand signals are the free-text "what I want" answers:

- `F3` — "What one AI outcome would make you money / save time in the next 60 days?" (always free text)
- `F2__other` — the free-text companion when F2 (niche) = `other`

`extractSignals(answers): DemandSignal[]` returns one entry per non-empty source:
`{ source: 'F3' | 'F2_other', text: string }`. Empty/whitespace text is skipped. If no
signals, the radar exits before any Gemini call (no tokens spent).

> Note: the wizard stores "other" free text under the derived key `${id}__other`. The renderer only
> opens a free-text companion when an option's value is `other`, so `F2__other` exists but there is no
> `F5__other`. F5 is a yes/no question — its `yes` value is used only as a deterministic `value_tier`
> booster (see below), not as a text signal. Capturing F5's describe text would require extending the
> renderer to open a companion field for `yes`; that is out of scope here.

## Classification (Gemini flash)

`classifyDemand(signals, catalog, key, fetchImpl)` makes **one** Gemini `gemini-2.0-flash` call.
Prompt includes every signal and the catalog (slug + one-line topic per module). Returns a JSON array,
one object per input signal:

```json
{
  "classification": "covered" | "gap" | "not_feasible",
  "matched_module": "04-prompt-engineering" | null,
  "gap_topic_key": "telegram-intake-bot" | null,
  "gap_topic_label": { "ru": "...", "en": "..." } | null,
  "feasibility_note": "string | null",
  "value_tier": "high" | "normal"
}
```

- `gap_topic_key` is a short kebab slug; we further normalize via `normalizeTopicKey` (lowercase, trim,
  strip punctuation) to group signals.
- `value_tier`: Gemini rates it, but we **also** force `high` deterministically if `answers['F5'] === 'yes'`
  (explicit deadline) — `valueTier()` combines both: `high` if either Gemini says high OR F5=yes.
- On any Gemini failure: signals are stored with `classification = 'unclassified'` and `value_tier = 'normal'`
  for later reprocessing; submit is unaffected.

`not_feasible` signals are stored (with `feasibility_note`) but **never** generate briefs.

## Brief drafting (Gemini pro)

`draftBrief(topic, quotes, catalog, key, fetchImpl)` runs only on a brief-raising event (rare → token-cheap).
Uses `gemini-2.5-pro`. Input: `gap_topic_label`, all raw quote texts for that topic, the catalog, and the
platform's pedagogy rules (4-phase unit: Activation → Reflection → Concept → Practice; modules numbered
00–08). Returns strict JSON stored in `content_demand_briefs.proposal_json`:

```json
{
  "proposed_type": "module" | "unit",
  "title": { "ru": "...", "en": "..." },
  "learning_objective": "string",
  "slot": "unit inside 06-audio-pipeline" | "new module after 08-agent-engineering",
  "agentic_approach": "how this is built and taught using agentic AI",
  "unit_count_estimate": 2,
  "source_quotes": ["<signal text 1>", "<signal text 2>"]
}
```

On Gemini failure, a template fallback brief is written (proposal with the raw topic + quotes and
`proposed_type: 'unit'`), so a brief is never silently lost.

## Storage (migration 0004)

```sql
CREATE TABLE IF NOT EXISTS content_demand_signals (
  id            TEXT PRIMARY KEY,            -- crypto.randomUUID()
  user_id       TEXT NOT NULL,
  source_question TEXT NOT NULL,             -- 'F3' | 'F2_other'
  raw_text      TEXT NOT NULL,
  classification TEXT NOT NULL,              -- 'covered' | 'gap' | 'not_feasible' | 'unclassified'
  matched_module TEXT,
  gap_topic_key TEXT,
  gap_topic_label TEXT,                      -- JSON {ru,en}
  feasibility_note TEXT,
  value_tier    TEXT NOT NULL DEFAULT 'normal',
  brief_id      TEXT,                        -- FK -> content_demand_briefs.id (nullable)
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_demand_topic ON content_demand_signals (gap_topic_key, created_at);

CREATE TABLE IF NOT EXISTS content_demand_briefs (
  id            TEXT PRIMARY KEY,
  gap_topic_key TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open', -- 'open' | 'accepted' | 'rejected' | 'shipped'
  proposal_json TEXT NOT NULL,
  signal_count  INTEGER NOT NULL,
  created_at    INTEGER NOT NULL,
  decided_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_brief_status ON content_demand_briefs (status, created_at);
```

> Deployment note (from SP1): the prod CF API token lacks D1 migration permission (code 7403/10000).
> The migration SQL must be applied to remote D1 via the Cloudflare dashboard D1 console by the owner;
> the plan will surface the exact SQL for copy-paste.

## Admin surface & API

All under owner auth (`requireOwner`): `requireAuth` then assert `auth.sub`'s email equals `env.OWNER_EMAIL`.

| Method & path | Purpose |
|---------------|---------|
| `GET /api/admin/content-demand/briefs` | List briefs (filter by `?status=open`), parsed proposal_json |
| `GET /api/admin/content-demand/signals` | List signals grouped by `gap_topic_key` with counts; `?classification=` filter (incl. `not_feasible`) |
| `PATCH /api/admin/content-demand/briefs/:id` | `{ status }` → set accepted / rejected / shipped, stamp `decided_at` |

`web/app/admin/content-demand/` is a client page (static export) that calls these endpoints with
`credentials: 'include'`. Three views: **Open briefs** (proposal card + accept/reject), **Signal queue**
(topics with counts, drill into raw quotes), **Not feasible** (flagged, read-only). The identical
`GET .../briefs` endpoint is what a future boss-agent polls — one interface for human and agent.

## Error handling

- Radar runs in `ctx.waitUntil`; a thrown error there never affects the learner's submit response.
- `runDemandRadar` wraps the whole body in try/catch and logs to `console.error`; partial progress
  (signals already inserted) is retained.
- Gemini classify failure → `unclassified` signals (reprocessable). Gemini draft failure → template brief.
- `OWNER_EMAIL` missing → `requireOwner` returns 403 (fail closed).

## Testing

Pure functions in `demand-signals.ts`, unit-tested with vitest (no network):

- `extractSignals`: picks F3 / F2__other, skips empties, handles missing keys.
- `valueTier`: returns `high` when F5=yes OR Gemini high; `normal` otherwise.
- `normalizeTopicKey`: stable kebab slug; `"Telegram Intake Bot!"` → `"telegram-intake-bot"`.
- `shouldRaiseBrief`: true when `valueTier==='high'`; true when `count>=THRESHOLD && !hasOpenBrief`;
  false when an open brief exists; false below threshold.

Gemini wrappers (`demand-gemini.ts`) are tested via injected `fetchImpl` returning canned JSON, plus a
failure path asserting the template fallback (mirrors the existing `classifyFilmSkin` test pattern).

## Out of scope (YAGNI)

- No editing of the proposal text in the admin UI beyond accept/reject (architect edits land when the
  content is actually authored, not in this loop).
- No automatic module/unit scaffolding from an accepted brief — that is a future sub-project (the
  boss-agent-as-architect step). This spec stops at producing the brief and the decision.
- No notifications (Telegram/email); the admin page is pull-based. Can be added later.

## Program linkage

This is a standalone cross-cutting feature of the RPG roadmap program, not part of SP2's quest rendering.
Tracker: `docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`. It closes the loop from SP1's intake
back into course evolution.
