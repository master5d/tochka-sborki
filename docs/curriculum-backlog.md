# Curriculum backlog — proposed modules & courses

Structured backlog of proposed course modules and standalone courses, captured from the
feedback board so nothing is lost. These are **roadmap'ed, not built** — each entry records the
source ticket, scope, and rough placement. Shape priority via the feedback board.

Status legend: 🔭 on the radar · 🧪 needs scoping · 💤 deferred (vertical, post-platform).

---

## A. Proposed modules inside «Точка Сборки»

Modules that extend the existing agentic-AI course.

| Module | Source | Scope | Status |
|---|---|---|---|
| **Vibe Hacking** | `fb_9f32d5648608` | Security-minded vibe coding: recon, dual-use tooling, responsible disclosure framing within the agentic workflow. | 🧪 |
| **NotebookLM — sources from notes** | `fb_e54f96f71700` | Working with your own notes/sources as grounded context; NotebookLM-style source-grounded Q&A and synthesis. | 🔭 |
| **Meta Notetaking — note-making playbook** | `fb_891a71e43477` | Playbook for note-making/PKM that feeds the agent (evergreen notes, capture→distill→link); pairs with NotebookLM module. | 🔭 |
| **Telegram management** | `fb_26c4558588a9` | Agentic channel/bot management — the managed-bot + ingest patterns already used in SOVERN, taught as a module. | 🔭 |
| **Media Production** | `fb_d71cdb099093` | Content creation with AI (audio/video/visual pipeline) — extends the existing audio-pipeline module. | 🧪 |
| **uncensored-models setup** | `fb_ee6e7564058a` | Setting up uncensored/open local models (aligns with the Sovereign stack in 03-stack-selection). | 🧪 |
| **Speed reading training** | `fb_0150af2c76f9` | Speed-reading training module (ref: shaleny-ravlyk.com/events). Adjacent skill, not core agentic — scope as optional elective. | 💤 |

## B. Standalone / vertical courses (LMS multi-course platform)

These are not modules but **separate courses** — they land naturally on the `LMS/` multi-course
platform once the engine/data extraction is done (`fb_8f1a05ce1150`) + the `LMS/_template/`
scaffold (`fb_31371f4dfd19`, done). Each becomes its own `LMS/<course>/`.

| Course | Source | Notes | Status |
|---|---|---|---|
| **Sleep** | `fb_2c38165f0cfd` | Standalone course on sleep. Off-topic from agentic AI → own course on the platform. | 💤 |
| **Vertical expansions** | `fb_2d1b203115fe` | coaching · astrology · psyops agentic building · remote viewing · crystal gridding · Sacred Geometry (Schauberger). Each = its own standalone course later, niche audiences. | 💤 |

---

## Already covered (closed, not backlog)

- **Restricted-geo agent stack** (`fb_7c1b0cfd1bf9`) — asked for two install variants (open-source vs proxy) for users behind the GFW. **Already shipped** in `03-stack-selection`: `u3-behind-gfw` (LiteLLM proxy + `install-gfw` scripts) + `u4-hermes-sovereign` (open-source/local Sovereign stack). Closed as covered.

## Deferred — RPG-layer / visual (need product+visual direction)

- **Burning Man World Map** (`fb_d4e6d92333f0`) — visual redesign of the existing `WorldMap`: geometric festival grounds, modules as camps, navigation via figures/pets. A larger visual effort needing the owner's art direction (palette, layout, asset style). Companion familiars (`skinCompanion`) shipped as the navigable "pets"; the festival-map visual is deferred until a visual direction is set. Promote via a design spec + the visual companion in brainstorming.

## Deferred — engagement flavor (need owner assets / direction)

These are low-priority engagement features blocked on the owner's assets or aesthetic direction,
not on engineering. Captured so they aren't lost; promote when assets/direction exist.

- **Memes** (`fb_864d2df1dd9e`) — populate units with memes from the author's collection. Blocked on the actual meme assets + rights; needs an MDX embed pattern (a `<Meme>` component) once images exist.
- **Background soundtrack** (`fb_bf076065b190`) — opt-in ambient audio. Blocked on the owner's track choice + licensing; UX must be opt-in (no autoplay), with a persisted toggle. Build is small once a track is chosen.
- **Micro-puzzle breaks** (`fb_282cf1c678f7`) — small puzzle games as breaks between units. Needs game design (which puzzles, win/lose, reward into Cognitive Shards?) + product direction before build.
- **Shipped infra** (`fb_d858ea413075`): seasonal/event easter eggs — `lib/easter-eggs.ts` (date-driven `activeEasterEgg`, surfaced via the nav brand glyph). Memes/soundtrack/puzzles can hang off the same date-driven pattern when assets land.

## How to promote a backlog item to "build"

1. Pick an entry; open a spec in `docs/superpowers/specs/` (brainstorming skill).
2. For in-course modules: add `content/{ru,en}/<NN-module>/` (see `LMS/_template/` shapes), wire `_meta.json`, mirror RU→EN.
3. For standalone courses: scaffold `LMS/<course>/` from `LMS/_template/`.
