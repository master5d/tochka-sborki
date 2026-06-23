# Handoff — LMS-embed Part 2 (Learn-mode walkthrough → course unit)

> **For the picking-up instance:** read this top-to-bottom before touching anything. The
> scaffold is **already built** — your job is the authoring + one real embed + verification,
> NOT re-building the component. Ticket: `fb_54dd5739f9ce`.

**Repo:** `mc_hub` (`C:\telo\Efforts\Ongoing\mc_hub`), branch `main`.
**Date authored:** 2026-06-23. **Originating project:** [[project_sovern_mindmap]] slice 7 (done).

---

## 1. Objective (one sentence)

Take the **Export Learn HTML** artifact from the sovern-mindmap app and land the **first real
walkthrough** inside a Точка Сборки course unit (RU + EN), proving the authoring-time embed flow
end-to-end.

## 2. Mental model (why two repos, no code link)

- **sovern-mindmap** (`C:\telo\Efforts\On\MindMapping\sovern-mindmap`, repo B) is a separate app.
  Its **Export Learn HTML** button bakes a Learn-mode step-through into ONE self-contained `.html`
  (cumulative node reveal + per-step narration + prev/next + keyboard; neutral hybrid background
  that reads on both light/dark; **zero external resources**).
- **mc_hub** (repo A, this repo) just **hosts that file as a static asset and iframes it**. There
  is **no code dependency** — if the mindmap app vanishes, the embedded file keeps working.
- Flow is **authoring-time, manual, one-shot** — like Photoshop → PNG → article. The course never
  calls the app at runtime.

## 3. What is ALREADY done (do NOT rebuild)

| Piece | Path | State |
|---|---|---|
| Embed component | `LMS/tochka-sborki/web/components/walkthrough.tsx` | ✅ Built (sandboxed `<iframe src="/walkthroughs/<slug>.html">`, `loading="lazy"`, `sandbox="allow-scripts"`, `minHeight` prop, optional `<figcaption>`) |
| MDX registration | `LMS/tochka-sborki/web/components/mdx-components.tsx:9,84` | ✅ `Walkthrough` imported + exposed to all MDX |
| Asset folder | `LMS/tochka-sborki/web/public/walkthroughs/` | ✅ Exists, holds only `README.md` (authoring instructions) — **no `.html` yet** |

MDX usage contract (already supported):
```mdx
<Walkthrough slug="my-diagram" title="Как собрать пайплайн" minHeight={480} />
```
→ renders `/walkthroughs/my-diagram.html` in the lazy sandboxed iframe.

## 4. What REMAINS (your actual task)

### Step 0 — Produce the walkthrough HTML (repo B, sovern-mindmap)

Two routes; pick one:

- **(A) Human one-shot (preferred, ~1 min):** ask Alexander to open the mindmap app, build a SMALL
  diagram (~5 nodes), click **Export Learn HTML**, and hand you the file. This is the intended
  "manual, one-shot" flow.
- **(B) Drive it yourself via the slice-7 smoke harness:** the app's Export Learn HTML was
  Playwright-smoke-tested. Seed a clean canvas by **importing a small `.drawio` fixture** (bogus
  `SOVERN_BOARD` → demo graph), then click **Export Learn HTML** (toolbar export buttons DO fire via
  evaluate-click; the AI **Generate** button does NOT — it's overlay-intercepted). Dev server:
  `SOVERN_LLM_GATEWAY=http://localhost:4000 VITE_LLM_MODEL=fast-pool npm run dev` (port 1420). See
  [[project_sovern_mindmap]] memory for the exact smoke pattern.

**Constraints on the diagram:**
- Keep it **SMALL (~5 nodes).** Cumulative inline-SVG frames get heavy — ~22 MB at 13 nodes. A
  5-node diagram is far lighter. This is a hard guardrail, not a preference.
- Narration language: the course is **bilingual**. Either (a) author one RU diagram + one EN diagram
  → two files `pipeline-ru.html` / `pipeline-en.html`, or (b) keep node text minimal/visual and reuse
  one file for both locales. Decide with the author; default to **two files** for a polished result.

### Step 1 — Drop the file(s) into the asset folder

```
LMS/tochka-sborki/web/public/walkthroughs/pipeline-ru.html
LMS/tochka-sborki/web/public/walkthroughs/pipeline-en.html   # if doing bilingual files
```
Slug = filename without `.html`.

### Step 2 — Embed in the recommended first unit (RU + EN)

**Recommended target: Module 06 "audio-pipeline", unit 2 (pipeline theory)** — it literally teaches a
"scrape → analyze → insights" conveyor, the exact case the walkthrough README example uses.

- RU: `LMS/tochka-sborki/web/content/ru/06-audio-pipeline/u2-pipeline-theory.mdx`
- EN: `LMS/tochka-sborki/web/content/en/06-audio-pipeline/u2-pipeline-theory.mdx`

Add the component at a natural spot in the lesson body (after the theory prose, before the reflection
`<Phase>`). RU file uses the RU slug, EN file uses the EN slug:
```mdx
<Walkthrough slug="pipeline-ru" title="Как собирается пайплайн: шаг за шагом" minHeight={520} />
```
```mdx
<Walkthrough slug="pipeline-en" title="How the pipeline assembles, step by step" minHeight={520} />
```
**Bilingual rule (from CLAUDE.md):** RU is source, EN mirrors. Both locale files must get the embed.

### Step 3 — Verify (local build + render)

This is `output: 'export'` (static). Verify the asset ships and the iframe renders:
```bash
cd LMS/tochka-sborki/web
npm run build          # must succeed; confirms MDX + static export OK
ls out/walkthroughs/   # the .html file(s) must be copied into the static output
```
Then serve `out/` and open the lesson page; step through the walkthrough with `→`/`←`:
```bash
npx serve out          # or: python -m http.server -d out
```
Acceptance:
- [ ] `npm run build` passes (no MDX/type errors).
- [ ] `out/walkthroughs/<slug>.html` present in the static output.
- [ ] Lesson page renders the iframe; cumulative reveal + per-step narration + prev/next all work
      offline; reads fine on both light and dark theme (toggle in nav).
- [ ] Both RU and EN units carry the embed.

### Step 4 (optional follow-up, do NOT block on it)

A walkthrough can also become a **showcase-gallery** item on the LMS home page
(`lib/course/showcase.ts` + `components/showcase-gallery.tsx`). Out of scope for the core task —
note it back on the ticket if you want it tracked separately.

## 5. Gotchas (will bite you)

- **Static asset + sandboxed iframe ONLY.** NEVER cross-import sovern-mindmap app sources into
  `workers/` or the web app — the monorepo has a relative-import / `@`-alias tsc trap
  (see [[project_mc_hub_monorepo]]). The whole point of the self-contained HTML is to avoid this.
- **`sandbox="allow-scripts"`** is intentional: the file needs JS to run the step-through but must
  NOT get same-origin/storage/forms. Don't widen the sandbox.
- **`next-mdx-remote@6` does not pass inline array/object props.** `Walkthrough` only takes **string
  + number** props (`slug`, `title`, `minHeight`) — that's already compatible. Don't try to pass it
  arrays/objects.
- **Keep the diagram small** — restating because it's the #1 quality failure (huge HTML).
- **Metadata-route / static-export quirks** are unrelated to embeds but live in this app — don't get
  nerd-sniped; the embed is pure content + a static file.

## 6. Definition of done

First walkthrough HTML lives in `public/walkthroughs/`, is embedded in module 06 unit 2 in **both**
`content/ru` and `content/en`, `npm run build` passes, the file ships to `out/walkthroughs/`, and the
step-through renders + works offline on both themes. Commit on `main` (CI auto-deploys via path
filters). Then flip ticket `fb_54dd5739f9ce` to `done`.

## 7. References

- `LMS/tochka-sborki/web/public/walkthroughs/README.md` — authoring flow (mirror of §4 here)
- `LMS/tochka-sborki/web/components/walkthrough.tsx` — the embed component
- `CLAUDE.md` (repo root) — bilingual + MDX prop conventions
- sovern-mindmap memory `project_sovern_mindmap.md` — Export Learn HTML internals + smoke pattern
- mc_hub memory `project_mc_hub_monorepo.md` — the workers/ import trap (gotcha 1)
