# Quest Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mamaev.coach home page (`/` RU, `/en/` EN) with a scrollytelling «quest» page built from the Logos Foundry narrative, seven generated scenes and seven loops.

**Architecture:** Typed content module (transcribed from LF pieces #262 seq 11 / #263 seq 3) feeds a set of dependency-free React primitives (`Chapter`, `StickyStage`, `SceneLoop`, `PathFork`, `OutcomeReveal`, `GatePlaques`, `GuideChip`) composed in `QuestHome`. A `quest.css` theme layers chapter tints on top of the existing model-kit tokens. Assets are pre-encoded once locally (WebP scenes, H.264 loops, RGBA guide cut-outs) and committed under `hub/public/quest/`.

**Tech Stack:** Next.js 16 (`output: 'export'`, App Router), React 19, TypeScript, Vitest 4, CSS custom properties, `IntersectionObserver`; ffmpeg 8 + Python Pillow for assets; NAUTILUS `core/image-pool/pool.py` for guide cut-outs.

**Spec:** `docs/superpowers/specs/2026-09-08-quest-home-design.md`

## Global Constraints

- Branch `feat/quest-home` in `C:\telo\Efforts\Ongoing\mc_hub`; never push to or merge into `main` (push to main = production deploy).
- Commit by explicit paths, never `git add -A`; trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Hub app root: `C:\telo\Efforts\Ongoing\mc_hub\hub`; run `npm` commands there. Tests: `npx vitest run`; build: `npm run build`.
- No new npm dependencies. No external CDN, fonts or scripts.
- Text is transcribed verbatim from the LF canon files; no rewording. Service marks `[scene:`, `[loop:`, `[сцена:`, `[петля:` and the service header never reach `content.ts`.
- All colours come from tokens; no hex literals in TSX except the plaque ink documented in the spec (`--quest-plaque-ink`).
- Every chapter tint is declared in bare `:root`, in `@media (prefers-color-scheme: dark) :root:not([data-theme])` and in `[data-theme="dark"]` / `[data-theme="light"]`.
- `prefers-reduced-motion: reduce` → no video playback, no reveal transitions.
- Asset budget: scene WebP ≤ 350 KB each, loop MP4 ≤ 900 KB each, guide PNG ≤ 200 KB each, `hub/public/quest/` ≤ 9 MB total.
- Any LLM/image call goes through the SOVERN gateway via `pool.py` (never provider SDKs); `LITELLM_KEY` is read from the Windows User registry: `[Environment]::GetEnvironmentVariable('LITELLM_KEY','User')`. Never print the key.
- Source media (read-only): `C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_media\world-v2\` (`scenes/<id>.png`, `loops/<id>/loop.mp4`, `charA-sheet-v2.png`, `charB-girl-v3.png`).
- Narrative canon files (read-only): EN `C:\Users\sasha\AppData\Local\Temp\claude\C--telo\86418bfd-0c45-4f00-ab5d-18839aca6ef4\scratchpad\p262-seq11.md`, RU `…\scratchpad\p263-seq3.md`.

---

## File structure

| File | Responsibility |
|---|---|
| `hub/lib/quest/scenes.ts` | Scene registry: ids, asset paths, alt text per locale, gate plaque geometry |
| `hub/lib/quest/scenes.test.ts` | Registry invariants + plaque geometry |
| `hub/lib/quest/assets.test.ts` | Committed assets exist and fit the budget |
| `hub/scripts/quest-assets.ps1` | One-shot local encoder: PNG→WebP, MP4→MP4 (H.264), guides via `pool.py` |
| `hub/lib/quest/content.ts` | Typed narrative for `ru` and `en` |
| `hub/lib/quest/content.test.ts` | Facts, CTAs, no service marks, SEO limits |
| `hub/themes/quest.css` | Chapter tints, stage tokens, reveal/reduced-motion rules |
| `hub/lib/a11y/contrast.test.ts` | Extended with quest tints |
| `hub/components/quest/chapter.tsx` | Section shell with tint/eyebrow/heading |
| `hub/components/quest/guide-chip.tsx` | Guide avatar + name |
| `hub/components/quest/scene-loop.tsx` | Video loop with poster, IO play/pause, reduced-motion fallback |
| `hub/components/quest/use-active-step.ts` | IO hook returning the active step index |
| `hub/components/quest/sticky-stage.tsx` | Sticky scene column + scrolling steps |
| `hub/components/quest/path-fork.tsx` | Habit/detour cards |
| `hub/components/quest/outcome-reveal.tsx` | Outcome stat cards with reveal |
| `hub/components/quest/gate-plaques.tsx` | Scene 05 with text plaques by code |
| `hub/components/quest/quest-home.tsx` | Page composition |
| `hub/app/page.tsx`, `hub/app/en/page.tsx` | Routes + metadata |
| `hub/app/globals.css` | Import `quest.css` |
| `hub/DESIGN.md`, `hub/logs/desops.log` | Design contract update |

---

### Task 1: Scene registry and encoded assets

**Files:**
- Create: `hub/lib/quest/scenes.ts`
- Create: `hub/lib/quest/scenes.test.ts`
- Create: `hub/lib/quest/assets.test.ts`
- Create: `hub/scripts/quest-assets.ps1`
- Create (binaries): `hub/public/quest/scenes/*.webp`, `hub/public/quest/loops/*.mp4`, `hub/public/quest/guides/{scroller,builder}.png`

**Interfaces:**
- Produces: `SceneId`, `SCENES: Record<SceneId, Scene>`, `SCENE_IDS: SceneId[]`, `GATE_PLAQUES`, `sceneAssets(id)`.

- [ ] **Step 1: Write the failing registry test**

`hub/lib/quest/scenes.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { GATE_PLAQUES, SCENES, SCENE_IDS, sceneAssets } from './scenes'

describe('quest scenes registry', () => {
  it('has seven scenes in narrative order with unique ids', () => {
    expect(SCENE_IDS).toEqual(['01-map', '02-camp', '03-boulder', '04-temple', '05-gates', '06-wall', '07-signs'])
    expect(new Set(SCENE_IDS).size).toBe(7)
  })
  it('every scene has alt text in both locales', () => {
    for (const id of SCENE_IDS) {
      expect(SCENES[id].alt.ru.trim().length, `${id} ru alt`).toBeGreaterThan(10)
      expect(SCENES[id].alt.en.trim().length, `${id} en alt`).toBeGreaterThan(10)
    }
  })
  it('asset paths are under /quest/', () => {
    const a = sceneAssets('02-camp')
    expect(a.poster).toBe('/quest/scenes/02-camp.webp')
    expect(a.loop).toBe('/quest/loops/02-camp.mp4')
  })
  it('gate plaques sit inside the frame and do not overlap', () => {
    for (const p of GATE_PLAQUES) {
      for (const v of [p.left, p.top, p.width, p.height]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
      expect(p.left + p.width).toBeLessThanOrEqual(100)
      expect(p.top + p.height).toBeLessThanOrEqual(100)
    }
    const [l, r] = GATE_PLAQUES
    expect(l.left + l.width).toBeLessThan(r.left)
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run (from `hub/`): `npx vitest run lib/quest/scenes.test.ts`
Expected: FAIL — cannot resolve `./scenes`.

- [ ] **Step 3: Write the registry**

`hub/lib/quest/scenes.ts`:

```ts
import type { Locale } from '../dictionaries'

export type SceneId = '01-map' | '02-camp' | '03-boulder' | '04-temple' | '05-gates' | '06-wall' | '07-signs'

export interface Scene {
  id: SceneId
  /** Native pixel size of the generated art (all scenes share it). */
  width: 1264
  height: 848
  alt: Record<Locale, string>
}

export const SCENE_IDS: SceneId[] = ['01-map', '02-camp', '03-boulder', '04-temple', '05-gates', '06-wall', '07-signs']

export const SCENES: Record<SceneId, Scene> = {
  '01-map': {
    id: '01-map', width: 1264, height: 848,
    alt: {
      en: 'A fantasy world map from above: a glowing straight fast track through the centre and a winding side-quest trail along the edge; the Scroller on a cushion and the Builder in a hard hat at the start, Sirius in the sky.',
      ru: 'Фэнтези-карта мира сверху: светящаяся прямая «fast track» через центр и извилистая тропа «side quest» по краю; на старте Скроллер на подушке и Сборщица в каске, в небе Сириус.',
    },
  },
  '02-camp': {
    id: '02-camp', width: 1264, height: 848,
    alt: {
      en: 'A camp by a fire at dusk: the Scroller warms his hands over a phone, the Builder lays tools out on a map; a signpost with two blank arrows between them.',
      ru: 'Лагерь у костра в сумерках: Скроллер греет руки о телефон, Сборщица раскладывает инструменты на карту; между ними указатель с двумя пустыми стрелками.',
    },
  },
  '03-boulder': {
    id: '03-boulder', width: 1264, height: 848,
    alt: {
      en: 'The trail runs into a huge boulder with a screen on its side; the Scroller sits on top with his phone, the Builder pulls a crowbar and rope from her backpack.',
      ru: 'Тропа упирается в огромный валун с экраном на боку; Скроллер сидит сверху с телефоном, Сборщица достаёт из рюкзака лом и верёвку.',
    },
  },
  '04-temple': {
    id: '04-temple', width: 1264, height: 848,
    alt: {
      en: 'A hall that turns from a temple into a workshop: candles and mats on the left, a workbench with monitors on the right; in the centre the Builder takes off a turban and lifts her hard hat.',
      ru: 'Зал, переходящий из храма в мастерскую: слева свечи и коврики, справа верстак с мониторами; в центре Сборщица снимает тюрбан и поднимает каску.',
    },
  },
  '05-gates': {
    id: '05-gates', width: 1264, height: 848,
    alt: {
      en: 'A castle with two gates: the left wooden and open, the right wrought iron with a blueprint on its leaf; the Scroller and the Builder stand in front of them.',
      ru: 'Замок с двумя воротами: левые деревянные и открытые, правые кованые с чертежом на створке; перед ними стоят Скроллер и Сборщица.',
    },
  },
  '06-wall': {
    id: '06-wall', width: 1264, height: 848,
    alt: {
      en: 'View from the castle wall over the crossed land: the boulder broken into steps, the temple-workshop glowing, a line of small figures in hard hats walking to the gates; the Scroller now wears a hard hat too.',
      ru: 'Вид с крепостной стены на пройденную землю: валун разобран на ступени, храм-мастерская светится, к воротам идёт вереница маленьких фигур в касках; Скроллер тоже в каске.',
    },
  },
  '07-signs': {
    id: '07-signs', width: 1264, height: 848,
    alt: {
      en: 'Two card signs at the foot of the wall: the left with a silhouette portrait in a hard hat, the right with a gear.',
      ru: 'Две карточки-таблички у подножия стены: левая с портретом-силуэтом в каске, правая с шестерёнкой.',
    },
  },
}

export interface SceneAssets { poster: string; loop: string }

export function sceneAssets(id: SceneId): SceneAssets {
  return { poster: `/quest/scenes/${id}.webp`, loop: `/quest/loops/${id}.mp4` }
}

export const GUIDE_ASSETS = {
  scroller: '/quest/guides/scroller.png',
  builder: '/quest/guides/builder.png',
} as const

/**
 * Blank plaques on scene 05, measured on the 1264×848 art by flood-filling the
 * plaque colour (left 237–426 × 150–220, right 765–890 × 226–271). Percent of frame.
 */
export interface PlaqueBox { left: number; top: number; width: number; height: number }
export const GATE_PLAQUES: [PlaqueBox, PlaqueBox] = [
  { left: 18.75, top: 17.69, width: 14.95, height: 8.25 },
  { left: 60.52, top: 26.65, width: 9.89, height: 5.31 },
]
```

- [ ] **Step 4: Run the registry test**

Run: `npx vitest run lib/quest/scenes.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing assets test**

`hub/lib/quest/assets.test.ts`:

```ts
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GUIDE_ASSETS, SCENE_IDS, sceneAssets } from './scenes'

const PUBLIC = join(process.cwd(), 'public')
const KB = 1024

function sizeOf(webPath: string): number {
  const p = join(PUBLIC, webPath)
  expect(existsSync(p), `missing asset ${webPath}`).toBe(true)
  return statSync(p).size
}

function dirSize(dir: string): number {
  let total = 0
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    total += e.isDirectory() ? dirSize(p) : statSync(p).size
  }
  return total
}

describe('quest assets', () => {
  it('every scene has a poster ≤ 350 KB and a loop ≤ 900 KB', () => {
    for (const id of SCENE_IDS) {
      const a = sceneAssets(id)
      expect(sizeOf(a.poster), `${id} poster`).toBeLessThanOrEqual(350 * KB)
      expect(sizeOf(a.loop), `${id} loop`).toBeLessThanOrEqual(900 * KB)
    }
  })
  it('both guide cut-outs exist and are ≤ 200 KB', () => {
    for (const p of Object.values(GUIDE_ASSETS)) expect(sizeOf(p)).toBeLessThanOrEqual(200 * KB)
  })
  it('the whole quest folder stays under 9 MB', () => {
    expect(dirSize(join(PUBLIC, 'quest'))).toBeLessThanOrEqual(9 * 1024 * KB)
  })
})
```

- [ ] **Step 6: Run it to see it fail**

Run: `npx vitest run lib/quest/assets.test.ts`
Expected: FAIL — `missing asset /quest/scenes/01-map.webp`.

- [ ] **Step 7: Write the encoder script**

`hub/scripts/quest-assets.ps1`:

```powershell
# One-shot local encoder for the quest page. Not run in CI: outputs are committed.
# Requires: ffmpeg 8 (winget Gyan.FFmpeg), Python 3 with Pillow, NAUTILUS checkout.
param(
  [string]$Media = 'C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_media\world-v2',
  [string]$Pool  = 'C:\telo\Efforts\Ongoing\NAUTILUS\core\image-pool\pool.py',
  [switch]$SkipGuides
)
$ErrorActionPreference = 'Stop'
$hub = Split-Path -Parent $PSScriptRoot
$out = Join-Path $hub 'public\quest'
foreach ($d in 'scenes', 'loops', 'guides') { New-Item -ItemType Directory -Force (Join-Path $out $d) | Out-Null }

$ids = '01-map', '02-camp', '03-boulder', '04-temple', '05-gates', '06-wall', '07-signs'

# 1. Scenes → WebP q82 (Pillow keeps the 1264×848 frame; no resize).
$py = @"
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
Image.open(src).convert('RGB').save(dst, 'WEBP', quality=82, method=6)
"@
$pyFile = Join-Path $env:TEMP 'quest-webp.py'
Set-Content -Path $pyFile -Value $py -Encoding UTF8
foreach ($id in $ids) {
  python $pyFile (Join-Path $Media "scenes\$id.png") (Join-Path $out "scenes\$id.webp")
}

# 2. Loops → H.264, no audio, faststart. Source is CRF 0 (≈1.4 MB); target ≤ 900 KB.
foreach ($id in $ids) {
  $src = Join-Path $Media "loops\$id\loop.mp4"
  $dst = Join-Path $out "loops\$id.mp4"
  ffmpeg -y -loglevel error -i $src -an -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart $dst
  $size = (Get-Item $dst).Length
  if ($size -gt 900KB) {
    ffmpeg -y -loglevel error -i $src -an -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart $dst
  }
}

# 3. Guides → generation on flat magenta, then chroma key → RGBA, then fit height 512.
if (-not $SkipGuides) {
  $env:LITELLM_KEY = [Environment]::GetEnvironmentVariable('LITELLM_KEY', 'User')
  $guides = @(
    @{ name = 'scroller'; ref = 'charA-sheet-v2.png';
       prompt = 'The Scroller: a plump mint-green cushion creature with Moebius hatching, big Rick-and-Morty eyes, pink cheeks and stubby legs, holding a glowing smartphone with a cosmic screen. Full body, standing, facing the viewer, centered, on a flat solid magenta #FF00FF background, nothing else in the frame. Cel-shaded flat cartoon, thin dark-brown outline, no text, no watermark.' },
    @{ name = 'builder'; ref = 'charB-girl-v3.png';
       prompt = 'The Builder: a young woman in clean modern anime style, copper-red wavy loose hair, green eyes, yellow hard hat with goggles pushed up, orange-and-cream striped sweater, dark teal work shorts with a hammer loop, brown boots, big teal backpack with a wrench. Full body, standing, facing the viewer, centered, on a flat solid magenta #FF00FF background, nothing else in the frame. Cel-shaded flat cartoon, thin dark-brown outline, no text, no watermark.' }
  )
  $py2 = @"
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
bbox = im.getbbox()
im = im.crop(bbox)
h = 512
im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
im.save(dst, 'PNG', optimize=True)
"@
  $py2File = Join-Path $env:TEMP 'quest-guide-fit.py'
  Set-Content -Path $py2File -Value $py2 -Encoding UTF8
  foreach ($g in $guides) {
    $raw = Join-Path $env:TEMP "quest-$($g.name)-magenta.png"
    $rgba = Join-Path $env:TEMP "quest-$($g.name)-rgba.png"
    python $Pool --tier edit --ref (Join-Path $Media $g.ref) --prompt $g.prompt --size 1024x1024 --out $raw
    python $Pool --key $raw --bg '#FF00FF' --out $rgba
    python $py2File $rgba (Join-Path $out "guides\$($g.name).png")
  }
}

Get-ChildItem $out -Recurse -File | Select-Object FullName, Length | Format-Table -AutoSize
```

- [ ] **Step 8: Run the encoder**

Run (PowerShell, from `hub/`): `pwsh -NoProfile -File scripts/quest-assets.ps1`
Expected: 7 WebP, 7 MP4, 2 PNG listed; every WebP ≤ 350 KB, MP4 ≤ 900 KB, PNG ≤ 200 KB. If `pool.py` fails (gateway down, rc ≠ 0), do NOT fake the cut-outs: rerun with `-SkipGuides`, then produce the fallback exactly like this and say so in the report:

```powershell
python - <<'EOF'
from PIL import Image, ImageDraw
src = r'C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_media\world-v2\scenes\01-map.png'
im = Image.open(src).convert('RGBA')
for name, box in {'builder': (250, 360, 470, 800), 'scroller': (880, 470, 1200, 800)}.items():
    crop = im.crop(box)
    mask = Image.new('L', crop.size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, crop.width - 1, crop.height - 1), fill=255)
    crop.putalpha(mask)
    h = 512
    crop = crop.resize((round(crop.width * h / crop.height), h), Image.LANCZOS)
    crop.save(rf'public\quest\guides\{name}.png', 'PNG', optimize=True)
EOF
```

Then look at both guide PNGs (Read tool) and confirm each shows one whole character with transparent surroundings.

- [ ] **Step 9: Run the assets test**

Run: `npx vitest run lib/quest`
Expected: PASS (both files).

- [ ] **Step 10: Commit**

```bash
git add hub/lib/quest/scenes.ts hub/lib/quest/scenes.test.ts hub/lib/quest/assets.test.ts hub/scripts/quest-assets.ps1 hub/public/quest
git commit -m "feat(quest): реестр сцен, плашки ворот и закодированные ассеты (7 сцен, 7 петель, 2 проводника)"
```

---

### Task 2: Narrative content module

**Files:**
- Create: `hub/lib/quest/content.ts`
- Create: `hub/lib/quest/content.test.ts`

**Interfaces:**
- Consumes: `SceneId` from `./scenes`, `Locale` from `../dictionaries`.
- Produces: `quest: Record<Locale, QuestContent>`, types `QuestContent`, `Fork`, `PathBlock`, `Outcome`, `Cta`, `Guide`.

- [ ] **Step 1: Write the failing test**

`hub/lib/quest/content.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { quest, type QuestContent } from './content'

const LOCALES = ['ru', 'en'] as const

/** Every string in the content tree, depth-first. */
function strings(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') out.push(node)
  else if (Array.isArray(node)) node.forEach((n) => strings(n, out))
  else if (node && typeof node === 'object') Object.values(node).forEach((n) => strings(n, out))
  return out
}

const FACTS: Record<'ru' | 'en', RegExp[]> = {
  en: [/18 hours 36 minutes/, /2 hours 39 minutes/, /1 hour 47 minutes/, /9 modules/, /44 lessons/, /8\.9 hours/, /38 %/, /46 %/, /84 %/, /3\.1 %/, /3\.13 %/],
  ru: [/18 часов 36 минут/, /2 часов 39 минут/, /1 час 47 минут/, /9 модулей/, /44 урок/, /8,9 часа/, /38 %/, /46 %/, /84 %/, /3,1 %/, /3,13 %/],
}

const SERVICE = [/\[scene:/, /\[loop:/, /\[сцена:/, /\[петля:/, /Service header/, /Служебная шапка/, /^CTA:/m, /^\*\*/m]

function ctasOf(c: QuestContent) {
  return [
    ...c.forks.flatMap((f) => [...(f.cta ? [f.cta] : []), ...(f.detour.ctas ?? [])]),
    c.finale.cta,
    c.about.author.cta,
  ]
}

describe('quest content', () => {
  for (const loc of LOCALES) {
    const c = quest[loc]
    const all = strings(c)
    it(`${loc}: carries every sourced fact`, () => {
      const joined = all.join('\n')
      for (const f of FACTS[loc]) expect(joined, `${loc} fact ${f}`).toMatch(f)
    })
    it(`${loc}: no service marks or markdown leaked`, () => {
      for (const s of all) for (const re of SERVICE) expect(s, `service mark in: ${s.slice(0, 60)}`).not.toMatch(re)
      for (const s of all) expect(s, `list marker in: ${s.slice(0, 60)}`).not.toMatch(/^(- |\d+\. )/)
    })
    it(`${loc}: five CTAs with absolute or root-relative hrefs`, () => {
      const ctas = ctasOf(c)
      expect(ctas.length).toBe(5)
      for (const x of ctas) {
        expect(x.label.trim().length).toBeGreaterThan(3)
        expect(x.href).toMatch(/^(https:\/\/|\/)/)
      }
    })
    it(`${loc}: three forks, each with two outcomes from different guides`, () => {
      expect(c.forks.length).toBe(3)
      for (const f of c.forks) {
        expect(f.habit.guide).toBe('scroller')
        expect(f.detour.guide).toBe('builder')
        expect(f.outcomes[0].guide).not.toBe(f.outcomes[1].guide)
        for (const o of f.outcomes) expect(o.source.length).toBeGreaterThan(5)
      }
    })
    it(`${loc}: seo within limits, footer verbatim`, () => {
      expect(c.seo.title.length).toBeLessThanOrEqual(60)
      expect(c.seo.description.length).toBeLessThanOrEqual(155)
      expect(c.footer).toBe('© 2026 · mamaev.coach · ⬡ vibe in motion')
    })
    it(`${loc}: scenes are wired in narrative order`, () => {
      expect([c.hero.scene, c.intro.scene, ...c.forks.map((f) => f.scene), c.finale.scene, c.about.scene])
        .toEqual(['01-map', '02-camp', '03-boulder', '04-temple', '05-gates', '06-wall', '07-signs'])
    })
  }
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run lib/quest/content.test.ts`
Expected: FAIL — cannot resolve `./content`.

- [ ] **Step 3: Write the content module**

Transcribe from the canon files (Global Constraints). Mapping rules, identical for both locales:

| Canon block | Field |
|---|---|
| frontmatter `seo_title` / `description` | `seo.title` / `seo.description` |
| `## 0.` bold line + three plain paragraphs | `hero.lines` (4 strings, bold markers stripped) |
| `## 0.` «Header (stays as is)» line | `hero.name` («Alexander Mamaev» / «Александр Мамаев»), `hero.role` (text after the dash up to the first period), `hero.bio` (the rest) |
| `## 1.` heading after the colon | `intro.eyebrow`; bold line → `intro.heading`; three paragraphs → `intro.paragraphs` |
| `## 2/3/4.` heading | `fork.eyebrow`; bold «Obstacle N. …» → `fork.obstacle`; paragraph(s) before «The habit road» → `fork.setup` |
| «**The habit road** *(the Scroller)*» + paragraph | `habit: { guide: 'scroller', title: 'The habit road', paragraphs: [...] }` |
| «**The detour** *(the Builder)*» + paragraph(s) | `detour: { guide: 'builder', title: 'The detour', paragraphs: [...] }`; in fork 3 the two inline «CTA: **…**» become `detour.ctas` (labels without «CTA:», arrows kept) and the sentences keep their text minus the CTA fragments |
| «**Outcomes**» two lines | `outcomesTitle`, `outcomes: [{guide:'scroller', value, text, source}, {guide:'builder', …}]` where `value` is the leading figure (e.g. `38 %`, `1 hour 47 minutes`, `84 %`, `44 lessons`, `3.13 %`, `9 modules`), `text` the sentence without the parenthesised source, `source` the parenthesised part without parentheses |
| «CTA: **Swap the scroll for a build →** ai.synergify.com» | `fork.cta = { label: 'Swap the scroll for a build →', href: 'https://ai.synergify.com/' }` (EN: `https://ai.synergify.com/en/`) |
| last paragraph of the fork | `fork.bridge` |
| `## 5.` | `finale.eyebrow` (after the colon), `finale.heading` (bold), `finale.paragraphs` (two paragraphs), `finale.closing` («Hard hat on. Your move.»), `finale.cta` |
| `## 6.` «About the author» | `about.author.heading`, `.text` (paragraph without the CTA fragment), `.cta` («Learn more →» → `https://mentor.mamaev.coach/` or `/en/`), `.links` (GitHub `https://github.com/master5d`, Email `mailto:sasha@mamaev.coach`, Blog `/blog/` or `/en/blog/`, Events `/events/` or `/en/events/`; labels without the arrow) |
| «About the Assemblage Point» | `about.course.heading`, `.text`, `.href` (`https://ai.synergify.com/` / `…/en/`) |
| Footer bold | `footer` (verbatim, both locales) |

`hub/lib/quest/content.ts` (EN shown in full; RU follows the same shape from `p263-seq3.md`):

```ts
// Narrative of the mamaev.coach home page. Distribution copy of Logos Foundry canon:
//   en — piece #262 seq 11 (id 372, accepted by the owner 2026-09-08)
//   ru — piece #263 seq 3  (id 375, human base, derived from the EN canon)
// Wording changes happen in Logos Foundry first, then get re-transcribed here.
import type { Locale } from '../dictionaries'
import type { SceneId } from './scenes'

export type Guide = 'scroller' | 'builder'
export interface Cta { label: string; href: string }
export interface Outcome { guide: Guide; value: string; text: string; source: string }
export interface PathBlock { guide: Guide; title: string; paragraphs: string[]; ctas?: Cta[] }
export interface Fork {
  id: 'boulder' | 'temple' | 'gates'
  scene: SceneId
  eyebrow: string
  obstacle: string
  setup: string[]
  habit: PathBlock
  detour: PathBlock
  outcomesTitle: string
  outcomes: [Outcome, Outcome]
  cta?: Cta
  bridge: string
}
export interface QuestContent {
  seo: { title: string; description: string }
  hero: { scene: SceneId; lines: string[]; name: string; role: string; bio: string }
  intro: { scene: SceneId; eyebrow: string; heading: string; paragraphs: string[] }
  forks: [Fork, Fork, Fork]
  finale: { scene: SceneId; eyebrow: string; heading: string; paragraphs: string[]; closing: string; cta: Cta }
  about: {
    scene: SceneId
    author: { heading: string; text: string; cta: Cta; links: Cta[] }
    course: { heading: string; text: string; href: string }
  }
  labels: { habit: string; detour: string; scroller: string; builder: string; plaques: [string, string]; skipToText: string }
  footer: string
}

const COURSE_EN = 'https://ai.synergify.com/en/'
const COURSE_RU = 'https://ai.synergify.com/'
const MENTOR_EN = 'https://mentor.mamaev.coach/en/'
const MENTOR_RU = 'https://mentor.mamaev.coach/'

const en: QuestContent = {
  seo: {
    title: 'Side quest or fast track: picking a path in the age of AI',
    description: 'Feed or terminal? A map of the mamaev.coach home page: three forks, real numbers, and a free course where your first agent gets built in 1 h 47 min.',
  },
  hero: {
    scene: '01-map',
    lines: [
      'Two years of side quests, sexology, hypnosis, robotaxi work, now agents.',
      "Seventh-degree shaman, if we're honest, I never mapped a route, I kept taking exits that felt alive.",
      'Scroll or build, feed or terminal, watch it or make it.',
      'This page is that map drawn after the fact; where to go is your call.',
    ],
    name: 'Alexander Mamaev',
    role: 'Vibe coder, AI builder, coach.',
    bio: 'I build agent systems on Claude Code + n8n. I teach others to do the same.',
  },
  intro: {
    scene: '02-camp',
    eyebrow: 'From quick wins to long ones',
    heading: 'Quick wins are gone by morning',
    paragraphs: [
      "A side quest, for those who skipped the games, is the road that isn't the main one, and it took me two years to notice I was living on it. The endless feed has a perfect interface and zero leftovers. Dopamine paid out, battery drained, nothing in your hands. The build has a worse interface (a terminal, errors, \"why doesn't it work\"), but the leftovers grow every evening: a working thing you can show someone.",
      'Here is the claim of this page: AI agents made "build it yourself" cheaper than "watch someone build it" for the first time. I did the math, and the math is short. Your first agent with project memory gets built in 1 hour 47 minutes of the course, shorter than two evening episodes. The whole road to a production agent is 9 modules, 44 lessons, $0, cheaper than any streaming subscription. The detour got shorter than the highway, the maps just haven\'t been updated yet.',
      'One strong fact: a person spends 18 hours 36 minutes a week in social and video feeds, about 2 hours 39 minutes every day (DataReportal × GWI, Digital 2026, October 2025). I checked my own screen time before writing this, and I am not going to quote it here, not that anyone asked. The number stays.',
    ],
  },
  forks: [
    {
      id: 'boulder',
      scene: '03-boulder',
      eyebrow: 'Fork 1: a replacement for the binge',
      obstacle: 'Obstacle 1. The boulder',
      setup: [
        "Binge-watching and the endless feed pay in dopamine, and after it there is nothing. The boulder blocks any forward motion because the brain stays glued to the reward loop instead of allocating resources to creation. Vibe coding pays the same charge, but by morning you have a working thing in your hands instead of a dead battery. I ran both experiments on myself, the second one is the only one I kept, if we're honest.",
      ],
      habit: {
        guide: 'scroller',
        title: 'The habit road',
        paragraphs: [
          'The habit road circles the boulder. One more episode. One more "how I built an agent in an evening" review. One more course in the bookmarks. Every step feels like motion, feeds are good at that. By morning the landscape is the same: same room, same phone, zero artifacts. The boulder sits where it sat.',
        ],
      },
      detour: {
        guide: 'builder',
        title: 'The detour',
        paragraphs: [
          "The detour spends the same energy on a build. Not studying it, building it: a script that sorts the mail, an agent that answers questions from my notes, a bot that does the boring part. Terminal, prompt, error, another prompt, the same reward loop, only a thing is left at the end. My first script sorted the mail badly and still beat the feed on leftovers, to be fair. The boulder doesn't get walked around, it gets broken into steps.",
        ],
      },
      outcomesTitle: 'Outcomes',
      outcomes: [
        { guide: 'scroller', value: '38 %', text: 'of US adults say evening scrolling hurts their sleep, and among 18-to-24-year-olds it is 46 %', source: 'AASM, Atomik Research survey, n=2007, June 2025' },
        { guide: 'builder', value: '1 hour 47 minutes', text: 'into the course your first agent with project memory arrives', source: 'modules 0-2 of the Assemblage Point, lesson "First project", by the published lesson durations' },
      ],
      cta: { label: 'Swap the scroll for a build →', href: COURSE_EN },
      bridge: 'The steps are laid. And the first agent brings a question right away: who leads whom, you it or it you? The second stone on the trail is older than the phone.',
    },
    {
      id: 'temple',
      scene: '04-temple',
      eyebrow: "Fork 2: amplify the voice, don't replace it",
      obstacle: 'Obstacle 2. The teacher',
      setup: [
        'I used to teach kundalini yoga, with a spiritual name (Ravi Angad Singh), mantras, a lineage, teacher trainings. That was a world of devotion to the guru. I left the model of dependence on a teacher on purpose: a strong teacher grows another teacher, not a follower. The toolkit needs everything, and that one I had to put down, apparently.',
      ],
      habit: {
        guide: 'scroller',
        title: 'The habit road',
        paragraphs: [
          'The habit road finds a new guru, and now its name is "AI". It gets handed the text, the decision, the taste: "write it for me", "come up with it for me", "decide for me". Comfortable, like sitting at a teacher\'s feet: zero responsibility, answers always there. A year later the voice isn\'t yours, the style isn\'t yours, the projects aren\'t yours. The lineage just switched servers.',
        ],
      },
      detour: {
        guide: 'builder',
        title: 'The detour',
        paragraphs: [
          "The detour takes the same principle from yoga into the tools: AI amplifies your voice, it doesn't replace it. The agent is an apprentice, not a master: it holds the tools, you hold the intent. Sovereignty instead of dependence, that is what the Assemblage Point teaches, and that is how I live myself. My apprentice still breaks things at night and I check its work in the morning, that is the whole limit of the tool, not that I'm counting. A strong tool, like a strong teacher, grows another builder, not a user.",
        ],
      },
      outcomesTitle: 'Outcomes',
      outcomes: [
        { guide: 'scroller', value: '84 %', text: 'of developers use AI in their work, and 3.1 % fully trust its answers', source: 'Stack Overflow Developer Survey, 2025' },
        { guide: 'builder', value: '44 lessons', text: '8.9 hours by the published durations; the finale is module 8 "Agent engineering", lesson "Prototype → Production"', source: 'the Assemblage Point, published lesson durations' },
      ],
      bridge: "Hard hat on, the intent is yours. What's left is where to take it: the trail out of the workshop runs into a wall with gates.",
    },
    {
      id: 'gates',
      scene: '05-gates',
      eyebrow: 'Fork 3: two projects',
      obstacle: 'Obstacle 3. The gates',
      setup: [
        'There are two gates, and this is not "pick one": the left is for you, the right is for your team.',
      ],
      habit: {
        guide: 'scroller',
        title: 'The habit road',
        paragraphs: [
          'The habit road stops at the gates: the link saved "for later", the trailer watched, the free module dropped halfway for the tool that "is about to change everything". I have done this with three tools I could name, and I won\'t, to be fair. The castle seen from twenty angles, never once from inside.',
        ],
      },
      detour: {
        guide: 'builder',
        title: 'The detour',
        paragraphs: [
          'Walk through the gate that is about you. ⬡ The Assemblage Point is an open course on vibe coding, entry from module one.',
          '⚙ Agent engineering is production agent systems for teams.',
        ],
        ctas: [
          { label: 'Start the course →', href: COURSE_EN },
          { label: 'Learn more →', href: MENTOR_EN },
        ],
      },
      outcomesTitle: 'Outcomes',
      outcomes: [
        { guide: 'scroller', value: '3.13 %', text: 'of those who enroll finish an online course', source: 'edX, 2017–18; Reich & Ruipérez-Valiente, Science, 2019' },
        { guide: 'builder', value: '9 modules', text: '$0, the price of entry at the first gate', source: 'the Assemblage Point, ai.synergify.com' },
      ],
      bridge: 'The gates are open. From the castle wall behind them the whole road is visible, and "made it" on this map means something different from what it means on the highway.',
    },
  ],
  finale: {
    scene: '06-wall',
    eyebrow: 'Redefining "made it"',
    heading: '"Made it" is not "watched it all"',
    paragraphs: [
      'On the highway the finish is "watched to the end". On the detour it is "built it and showed it". The first disappears by morning, the second stays. Two guides still stand, and the Scroller lives in each of us. I still catch mine on the cushion about once a week, to be fair. The only difference is who holds the map.',
      'The choice is still yours. The steps are marked now, and the first one is 1 hour 47 minutes from here.',
    ],
    closing: 'Hard hat on. Your move.',
    cta: { label: 'Swap the scroll for a build →', href: COURSE_EN },
  },
  about: {
    scene: '07-signs',
    author: {
      heading: 'About the author',
      text: 'Alexander Mamaev — vibe coder, AI builder, coach. Builds agent systems on Claude Code + n8n and teaches others to do the same. A former kundalini yoga teacher who carried the main principle from the hall into code: a strong teacher grows another teacher. For teams, ⚙ Agent engineering: production agent systems from spec to n8n + observability, b2b · on request.',
      cta: { label: 'Learn more →', href: MENTOR_EN },
      links: [
        { label: 'GitHub', href: 'https://github.com/master5d' },
        { label: 'Email', href: 'mailto:sasha@mamaev.coach' },
        { label: 'Blog', href: '/en/blog/' },
        { label: 'Events', href: '/en/events/' },
      ],
    },
    course: {
      heading: 'About the Assemblage Point',
      text: 'An open, free course on vibe coding and agents: 9 modules, 44 lessons, RU · EN, agent-agnostic. Entry via ai.synergify.com, from module one.',
      href: COURSE_EN,
    },
  },
  labels: {
    habit: 'The habit road',
    detour: 'The detour',
    scroller: 'the Scroller',
    builder: 'the Builder',
    plaques: ['open · free', 'b2b · on request'],
    skipToText: 'Skip to text',
  },
  footer: '© 2026 · mamaev.coach · ⬡ vibe in motion',
}

const ru: QuestContent = {
  // Transcribe from p263-seq3.md with the same mapping. Fixed values:
  //   hrefs: COURSE_RU, MENTOR_RU, '/blog/', '/events/', GitHub and mailto as in `en`
  //   labels: { habit: 'Привычная дорога', detour: 'Обходная тропа', scroller: 'Скроллер',
  //             builder: 'Сборщица', plaques: ['open · бесплатно', 'b2b · по запросу'],
  //             skipToText: 'К тексту' }
  //   outcomes value/text split for RU: '38 %', '1 час 47 минут', '84 %', '44 урока', '3,13 %', '9 модулей'
  //   hero.name 'Александр Мамаев', role 'Vibe coder, AI builder, коуч.', bio 'Строю agent-системы на Claude Code + n8n. Учу других делать то же самое.'
  ...
}

export const quest: Record<Locale, QuestContent> = { ru, en }
```

The `...` above is the only place where the implementer types text not printed in this plan: the RU object is a field-by-field transcription of `p263-seq3.md` by the mapping table, keeping the closing-bracket signatures `)` exactly as written in the canon.

- [ ] **Step 4: Run the test**

Run: `npx vitest run lib/quest/content.test.ts`
Expected: PASS (12 tests). If a fact regex fails on RU, re-read the canon line — the numbers there are «18 часов 36 минут», «2 часов 39 минут», «1 час 47 минут», «44 урока», «8,9 часа», «3,1 %», «3,13 %».

- [ ] **Step 5: Commit**

```bash
git add hub/lib/quest/content.ts hub/lib/quest/content.test.ts
git commit -m "feat(quest): нарратив главной из Logos Foundry (#262 seq 11 EN, #263 seq 3 RU) как типизированный контент"
```

---

### Task 3: Quest theme tokens and design contract

**Files:**
- Create: `hub/themes/quest.css`
- Modify: `hub/app/globals.css` (add import)
- Modify: `hub/lib/a11y/contrast.test.ts` (extend)
- Modify: `hub/DESIGN.md` (dials + decision line), `hub/logs/desops.log` (entry)

**Interfaces:**
- Produces CSS custom properties: `--quest-stage-top`, `--quest-tint-hero|intro|fork1|fork2|fork3|finale|about`, `--quest-card`, `--quest-plaque-ink`; classes `.quest-reveal`, `.quest-reveal.is-in`.

- [ ] **Step 1: Extend the contrast test (failing)**

Append to `hub/lib/a11y/contrast.test.ts`:

```ts
const QUEST = readFileSync(join(process.cwd(), 'themes', 'quest.css'), 'utf8')
const TINTS = ['hero', 'intro', 'fork1', 'fork2', 'fork3', 'finale', 'about'].map((k) => `--quest-tint-${k}`)

function questTokensOf(selector: string): Record<string, string> {
  const start = QUEST.indexOf(selector)
  if (start < 0) throw new Error(`блок ${selector} не найден в quest.css`)
  const open = QUEST.indexOf('{', start)
  const close = QUEST.indexOf('}', open)
  const out: Record<string, string> = {}
  for (const m of QUEST.slice(open + 1, close).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}

describe('quest chapter tints', () => {
  const cases: Array<[string, string, string]> = [
    [':root {', ':root {', 'light fallback'],
    [':root:not([data-theme])', ':root:not([data-theme])', 'system dark'],
    ['[data-theme="dark"]', '[data-theme="dark"]', 'explicit dark'],
    ['[data-theme="light"]', '[data-theme="light"]', 'explicit light'],
  ]
  for (const [questSel, kitSel, name] of cases) {
    it(`${name}: text stays readable on every tint`, () => {
      const tint = questTokensOf(questSel)
      const kit = tokensOf(kitSel)
      for (const t of TINTS) {
        expect(tint[t], `${questSel} ${t}`).toMatch(/^#[0-9a-f]{6}$/i)
        expect(contrastRatio(kit['--text-primary'], tint[t]), `${name} primary on ${t}`).toBeGreaterThanOrEqual(4.5)
        expect(contrastRatio(kit['--text-secondary'], tint[t]), `${name} secondary on ${t}`).toBeGreaterThanOrEqual(3.0)
      }
    })
  }
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run lib/a11y/contrast.test.ts`
Expected: FAIL — `ENOENT … themes/quest.css`.

- [ ] **Step 3: Write the theme**

`hub/themes/quest.css`:

```css
/* Quest theme: chapter tints and the sticky stage, layered on model-kit tokens.
   Palette = model-kit paper + the pastel fields of illustration style v2
   (lavender, mint, sand, peach, steel). Every tint is declared four times,
   exactly like model-kit: bare :root (pre-hydration / no JS), system dark,
   explicit dark, explicit light. contrast.test.ts keeps them readable. */
:root {
  --quest-stage-top: 3.25rem;
  --quest-tint-hero: #ece6f8;
  --quest-tint-intro: #e4f1ea;
  --quest-tint-fork1: #f3ecdf;
  --quest-tint-fork2: #fbe8d9;
  --quest-tint-fork3: #e3e8f5;
  --quest-tint-finale: #e9e3f7;
  --quest-tint-about: #f4f1ea;
  --quest-card: #fbf9f4;
  --quest-plaque-ink: #2b1d12;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --quest-tint-hero: #15121f;
    --quest-tint-intro: #0f1a16;
    --quest-tint-fork1: #1b1712;
    --quest-tint-fork2: #1f1611;
    --quest-tint-fork3: #12151f;
    --quest-tint-finale: #171226;
    --quest-tint-about: #0a0a0f;
    --quest-card: #16161f;
  }
}

[data-theme="dark"] {
  --quest-tint-hero: #15121f;
  --quest-tint-intro: #0f1a16;
  --quest-tint-fork1: #1b1712;
  --quest-tint-fork2: #1f1611;
  --quest-tint-fork3: #12151f;
  --quest-tint-finale: #171226;
  --quest-tint-about: #0a0a0f;
  --quest-card: #16161f;
}

[data-theme="light"] {
  --quest-tint-hero: #ece6f8;
  --quest-tint-intro: #e4f1ea;
  --quest-tint-fork1: #f3ecdf;
  --quest-tint-fork2: #fbe8d9;
  --quest-tint-fork3: #e3e8f5;
  --quest-tint-finale: #e9e3f7;
  --quest-tint-about: #f4f1ea;
  --quest-card: #fbf9f4;
}

/* Reveal: visible at rest; JS adds .is-in when the block enters the viewport. */
.quest-reveal { opacity: 1; transform: none; }
@media (prefers-reduced-motion: no-preference) {
  .quest-reveal[data-armed] { opacity: 0; transform: translateY(12px); transition: opacity 400ms ease, transform 400ms ease; }
  .quest-reveal[data-armed].is-in { opacity: 1; transform: none; }
}

/* Sticky stage layout. */
.quest-stage { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: clamp(1.5rem, 4vw, 4rem); align-items: start; }
.quest-stage__media { position: sticky; top: var(--quest-stage-top); height: calc(100vh - var(--quest-stage-top)); display: flex; align-items: center; }
.quest-stage__media > * { width: 100%; }
.quest-stage__steps { display: flex; flex-direction: column; gap: clamp(3rem, 12vh, 8rem); padding: 20vh 0 30vh; }
.quest-stage__step { min-height: 40vh; display: flex; align-items: center; }
.quest-stage__step[data-active="false"] { opacity: 0.55; }
.quest-stage__step[data-active="true"] { opacity: 1; }
@media (prefers-reduced-motion: no-preference) { .quest-stage__step { transition: opacity 300ms ease; } }
@media (max-width: 900px) {
  .quest-stage { grid-template-columns: 1fr; gap: 0; }
  .quest-stage__media { height: 42vh; z-index: 1; }
  .quest-stage__steps { padding: 1.5rem 0 3rem; gap: 2rem; }
  .quest-stage__step { min-height: 0; }
}

/* Scene frame (poster/video share the art's aspect). */
.quest-scene { position: relative; aspect-ratio: 1264 / 848; overflow: hidden; border-radius: var(--radius); border: 1px solid var(--border-color); background: var(--bg-secondary); container-type: inline-size; }
.quest-scene img, .quest-scene video { display: block; width: 100%; height: 100%; object-fit: cover; }
.quest-scene__caption { position: absolute; left: 0.75rem; bottom: 0.75rem; font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: 0.04em; color: var(--text-primary); background: rgba(var(--bg-primary-rgb), 0.85); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 0.3rem 0.55rem; }
.quest-plaque { position: absolute; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: clamp(7px, 1.15cqw, 18px); letter-spacing: 0.06em; text-transform: lowercase; color: var(--quest-plaque-ink); text-align: center; line-height: 1.1; padding: 0 2%; overflow: hidden; }

/* Cards. */
.quest-card { background: var(--quest-card); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 1.5rem; display: flex; flex-direction: column; gap: 0.9rem; }
.quest-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }
@media (max-width: 720px) { .quest-cards { grid-template-columns: 1fr; } }
.quest-chip { display: inline-flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-secondary); }
.quest-chip img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; object-position: top; background: var(--bg-secondary); border: 1px solid var(--border-color); }
.quest-number { font-family: var(--font-display), system-ui, sans-serif; font-weight: 900; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 0.95; letter-spacing: -0.03em; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.quest-source { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary); letter-spacing: 0.02em; }
.quest-cta { display: inline-block; font-family: var(--font-mono); font-size: var(--text-sm); letter-spacing: 0.04em; color: var(--text-on-accent); background: var(--text-accent); border-radius: var(--radius); padding: 0.8rem 1.2rem; text-decoration: none; }
.quest-cta:hover { opacity: 0.9; }
.quest-cta--ghost { color: var(--text-accent); background: transparent; border: 1px solid var(--text-accent); }
```

- [ ] **Step 4: Import it and run the contrast test**

In `hub/app/globals.css`, after `@import "../themes/model-kit.css";` add:

```css
@import "../themes/quest.css";
```

Run: `npx vitest run lib/a11y/contrast.test.ts`
Expected: PASS. If a tint fails the 3.0 secondary-text bar in light mode, darken `--text-secondary`? No — adjust the tint toward `--bg-primary` instead (the kit tokens are the contract).

- [ ] **Step 5: Update the design contract**

In `hub/DESIGN.md` frontmatter change `dials: {variance: 4, motion: 2, density: 3}` → `dials: {variance: 4, motion: 3, density: 3}`, and under `## Решения` add:

```
- 2026-09-08: тема quest (скроллителлинг главной по Adweek×Twitch, спек 2026-09-08-quest-home-design): тинты глав поверх model-kit, sticky-сцены с петлями, reveal 400 мс; motion 2 → 3
```

Append to `hub/logs/desops.log`:

```
2026-09-08 design-change: quest theme layered on model-kit (7 chapter tints ×4 blocks, contrast test extended), motion dial 2→3
```

- [ ] **Step 6: Commit**

```bash
git add hub/themes/quest.css hub/app/globals.css hub/lib/a11y/contrast.test.ts hub/DESIGN.md hub/logs/desops.log
git commit -m "feat(quest): тема quest — тинты глав, sticky-сцена, reveal; контракт дизайна motion 2→3"
```

---

### Task 4: Scene primitives — SceneLoop, GuideChip, GatePlaques

**Files:**
- Create: `hub/components/quest/scene-loop.tsx`
- Create: `hub/components/quest/guide-chip.tsx`
- Create: `hub/components/quest/gate-plaques.tsx`
- Create: `hub/components/quest/gate-plaques.test.tsx`

**Interfaces:**
- Consumes: `SCENES`, `sceneAssets`, `GUIDE_ASSETS`, `GATE_PLAQUES`, `SceneId` from `lib/quest/scenes`; `Guide` from `lib/quest/content`; classes from Task 3.
- Produces: `<SceneLoop id locale caption? />`, `<GuideChip guide label />`, `<GatePlaques locale plaques caption? />`.

- [ ] **Step 1: Write the failing plaque test**

Vitest here has no DOM environment; test the pure geometry helper instead.

`hub/components/quest/gate-plaques.test.tsx`:

```ts
import { describe, expect, it } from 'vitest'
import { plaqueStyle } from './gate-plaques'

describe('plaqueStyle', () => {
  it('maps a percent box to absolute CSS percentages', () => {
    expect(plaqueStyle({ left: 18.75, top: 17.69, width: 14.95, height: 8.25 })).toEqual({
      left: '18.75%', top: '17.69%', width: '14.95%', height: '8.25%',
    })
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run components/quest/gate-plaques.test.tsx`
Expected: FAIL — cannot resolve `./gate-plaques`.

- [ ] **Step 3: Write SceneLoop**

`hub/components/quest/scene-loop.tsx`:

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { SCENES, sceneAssets, type SceneId } from '../../lib/quest/scenes'

interface Props {
  id: SceneId
  locale: Locale
  /** Mono caption in the corner, switches with the active step. */
  caption?: string
  /** Absolutely positioned children over the art (plaques). */
  children?: React.ReactNode
  /** The hero loop may start eagerly; everything else waits for the viewport. */
  eager?: boolean
}

/**
 * Poster first, video only when motion is allowed and the frame is on screen.
 * Frame 0 of every loop equals the poster, so the swap is invisible.
 */
export function SceneLoop({ id, locale, caption, children, eager = false }: Props) {
  const scene = SCENES[id]
  const assets = sceneAssets(id)
  const ref = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [motion, setMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setMotion(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!motion) return
    const el = ref.current
    const video = videoRef.current
    if (!el || !video) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [motion])

  return (
    <div ref={ref} className="quest-scene" data-scene={id}>
      {motion ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload={eager ? 'auto' : 'none'}
          autoPlay={eager}
          poster={assets.poster}
          width={scene.width}
          height={scene.height}
          aria-label={scene.alt[locale]}
        >
          <source src={assets.loop} type="video/mp4" />
        </video>
      ) : (
        <img src={assets.poster} width={scene.width} height={scene.height} alt={scene.alt[locale]} loading={eager ? 'eager' : 'lazy'} />
      )}
      {children}
      {caption ? <div className="quest-scene__caption">{caption}</div> : null}
    </div>
  )
}
```

- [ ] **Step 4: Write GuideChip**

`hub/components/quest/guide-chip.tsx`:

```tsx
import type { Guide } from '../../lib/quest/content'
import { GUIDE_ASSETS } from '../../lib/quest/scenes'

interface Props { guide: Guide; label: string }

export function GuideChip({ guide, label }: Props) {
  return (
    <span className="quest-chip">
      <img src={GUIDE_ASSETS[guide]} alt="" width={40} height={40} loading="lazy" />
      {label}
    </span>
  )
}
```

- [ ] **Step 5: Write GatePlaques**

`hub/components/quest/gate-plaques.tsx`:

```tsx
import type { CSSProperties } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { GATE_PLAQUES, type PlaqueBox } from '../../lib/quest/scenes'
import { SceneLoop } from './scene-loop'

export function plaqueStyle(box: PlaqueBox): Pick<CSSProperties, 'left' | 'top' | 'width' | 'height'> {
  return { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }
}

interface Props { locale: Locale; plaques: [string, string]; caption?: string }

/** Scene 05 with the two blank plaques lettered by code (the art itself has no text). */
export function GatePlaques({ locale, plaques, caption }: Props) {
  return (
    <SceneLoop id="05-gates" locale={locale} caption={caption}>
      {GATE_PLAQUES.map((box, i) => (
        <span key={i} className="quest-plaque" style={plaqueStyle(box)} aria-hidden>
          {plaques[i]}
        </span>
      ))}
    </SceneLoop>
  )
}
```

- [ ] **Step 6: Run the test and typecheck**

Run: `npx vitest run components/quest && npx tsc --noEmit -p tsconfig.json`
Expected: PASS; tsc clean (no output).

- [ ] **Step 7: Commit**

```bash
git add hub/components/quest/scene-loop.tsx hub/components/quest/guide-chip.tsx hub/components/quest/gate-plaques.tsx hub/components/quest/gate-plaques.test.tsx
git commit -m "feat(quest): SceneLoop (постер→петля по вьюпорту, reduced-motion), GuideChip, GatePlaques (надписи ворот кодом)"
```

---

### Task 5: Layout primitives — Chapter, StickyStage, PathFork, OutcomeReveal

**Files:**
- Create: `hub/components/quest/chapter.tsx`
- Create: `hub/components/quest/use-active-step.ts`
- Create: `hub/components/quest/sticky-stage.tsx`
- Create: `hub/components/quest/path-fork.tsx`
- Create: `hub/components/quest/outcome-reveal.tsx`
- Create: `hub/components/quest/use-active-step.test.ts`

**Interfaces:**
- Consumes: `Fork`, `PathBlock`, `Outcome` from `lib/quest/content`; `GuideChip`; CSS classes from Task 3.
- Produces: `<Chapter id tint eyebrow? heading? children />`, `<StickyStage media steps />` with `steps: StageStep[] = { key, body }`, `useActiveStep(count, ref)`, `<PathFork fork labels />`, `<OutcomeReveal title outcomes labels />`, pure `pickActive(ratios: number[]): number`.

- [ ] **Step 1: Write the failing hook test (pure part)**

`hub/components/quest/use-active-step.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { pickActive } from './use-active-step'

describe('pickActive', () => {
  it('returns the step with the largest visible ratio', () => {
    expect(pickActive([0, 0.3, 0.8, 0.1])).toBe(2)
  })
  it('keeps the first step when nothing is visible yet', () => {
    expect(pickActive([0, 0, 0])).toBe(0)
  })
  it('prefers the earlier step on ties', () => {
    expect(pickActive([0.5, 0.5])).toBe(0)
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run components/quest/use-active-step.test.ts`
Expected: FAIL — cannot resolve `./use-active-step`.

- [ ] **Step 3: Write the hook**

`hub/components/quest/use-active-step.ts`:

```ts
'use client'
import { useEffect, useState, type RefObject } from 'react'

/** Index of the most visible step; 0 when none is visible; earlier wins ties. */
export function pickActive(ratios: number[]): number {
  let best = 0
  for (let i = 1; i < ratios.length; i++) if (ratios[i] > ratios[best]) best = i
  return best
}

/**
 * Observes `[data-step]` children of `container` and reports the most visible one.
 * Without IntersectionObserver the first step stays active (page readable at rest).
 */
export function useActiveStep(container: RefObject<HTMLElement | null>, count: number): number {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const root = container.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'))
    const ratios = new Array<number>(steps.length).fill(0)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.step)
          ratios[i] = e.isIntersecting ? e.intersectionRatio : 0
        }
        setActive(pickActive(ratios))
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-15% 0px -15% 0px' },
    )
    steps.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [container, count])
  return active
}
```

- [ ] **Step 4: Write Chapter**

`hub/components/quest/chapter.tsx`:

```tsx
export type Tint = 'hero' | 'intro' | 'fork1' | 'fork2' | 'fork3' | 'finale' | 'about'

interface Props {
  id: string
  tint: Tint
  eyebrow?: string
  heading?: string
  children: React.ReactNode
}

/** One chapter of the quest: tinted full-width band, content capped at --content-max. */
export function Chapter({ id, tint, eyebrow, heading, children }: Props) {
  return (
    <section id={id} className="hub-section" style={{ background: `var(--quest-tint-${tint})`, padding: 'var(--section-gap) 2rem', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        {eyebrow ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
            {eyebrow}
          </div>
        ) : null}
        {heading ? (
          <h2 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '2rem', textWrap: 'balance' }}>
            {heading}
          </h2>
        ) : null}
        {children}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Write StickyStage**

`hub/components/quest/sticky-stage.tsx`:

```tsx
'use client'
import { useRef, type ReactNode } from 'react'
import { useActiveStep } from './use-active-step'

export interface StageStep { key: string; body: ReactNode }

interface Props {
  /** Render prop: receives the active step index so the media can switch its caption. */
  media: (active: number) => ReactNode
  steps: StageStep[]
}

/** Sticky scene on the left, scrolling steps on the right; stacked under 900px. */
export function StickyStage({ media, steps }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useActiveStep(ref, steps.length)
  return (
    <div className="quest-stage" ref={ref}>
      <div className="quest-stage__media">{media(active)}</div>
      <div className="quest-stage__steps">
        {steps.map((s, i) => (
          <div key={s.key} className="quest-stage__step" data-step={i} data-active={i === active ? 'true' : 'false'}>
            <div style={{ fontSize: 'var(--text-lg)', lineHeight: 1.65, color: 'var(--text-primary)', maxWidth: '36rem' }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Write PathFork**

`hub/components/quest/path-fork.tsx`:

```tsx
import type { Fork, QuestContent } from '../../lib/quest/content'
import { GuideChip } from './guide-chip'

interface Props { fork: Fork; labels: QuestContent['labels'] }

function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((p, i) => (
        <p key={i} style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{p}</p>
      ))}
    </>
  )
}

/** Two cards: the habit road (Scroller) and the detour (Builder). */
export function PathFork({ fork, labels }: Props) {
  const guideName = (g: 'scroller' | 'builder') => (g === 'scroller' ? labels.scroller : labels.builder)
  return (
    <div className="quest-cards">
      {[fork.habit, fork.detour].map((path) => (
        <article key={path.guide} className="quest-card">
          <GuideChip guide={path.guide} label={guideName(path.guide)} />
          <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{path.title}</h3>
          <Paragraphs items={path.paragraphs} />
          {path.ctas?.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: 'auto' }}>
              {path.ctas.map((c, i) => (
                <a key={c.href} href={c.href} className={i === 0 ? 'quest-cta' : 'quest-cta quest-cta--ghost'}>{c.label}</a>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
```

- [ ] **Step 7: Write OutcomeReveal**

`hub/components/quest/outcome-reveal.tsx`:

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import type { Outcome, QuestContent } from '../../lib/quest/content'
import { GuideChip } from './guide-chip'

interface Props { title: string; outcomes: [Outcome, Outcome]; labels: QuestContent['labels'] }

/**
 * Two stat cards. Visible at rest; when JS runs and motion is allowed the block is
 * "armed" (hidden) and revealed once it enters the viewport.
 */
export function OutcomeReveal({ title, outcomes, labels }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState(false)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight) return // already on screen: never hide what the reader sees
    setArmed(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { threshold: 0.3 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`quest-reveal${inView ? ' is-in' : ''}`} data-armed={armed ? '' : undefined}>
      <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>{title}</h3>
      <div className="quest-cards">
        {outcomes.map((o) => (
          <article key={o.guide} className="quest-card">
            <GuideChip guide={o.guide} label={o.guide === 'scroller' ? labels.habit : labels.detour} />
            <div className="quest-number">{o.value}</div>
            <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.6, color: 'var(--text-primary)' }}>{o.text}</p>
            <div className="quest-source">{o.source}</div>
          </article>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Run tests and typecheck**

Run: `npx vitest run components/quest && npx tsc --noEmit -p tsconfig.json`
Expected: PASS (4 tests across two files); tsc clean.

- [ ] **Step 9: Commit**

```bash
git add hub/components/quest/chapter.tsx hub/components/quest/use-active-step.ts hub/components/quest/use-active-step.test.ts hub/components/quest/sticky-stage.tsx hub/components/quest/path-fork.tsx hub/components/quest/outcome-reveal.tsx
git commit -m "feat(quest): Chapter, StickyStage + useActiveStep, PathFork, OutcomeReveal"
```

---

### Task 6: QuestHome composition, routes, build smoke

**Files:**
- Create: `hub/components/quest/quest-home.tsx`
- Modify: `hub/app/page.tsx`, `hub/app/en/page.tsx`
- Delete: `hub/components/home-page.tsx`
- Create: `hub/scripts/quest-smoke.mjs`

**Interfaces:**
- Consumes everything from Tasks 1–5.
- Produces: `<QuestHome locale />`; `npm run build` output with the quest page at `out/index.html` and `out/en/index.html`.

- [ ] **Step 1: Write the smoke script (fails until the page exists)**

`hub/scripts/quest-smoke.mjs`:

```js
// Static-export smoke: run after `npm run build`. Exit 1 on any miss.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const checks = {
  'out/index.html': ['Два года по side quest', 'Скроллер', 'open · бесплатно', '© 2026 · mamaev.coach · ⬡ vibe in motion'],
  'out/en/index.html': ['Two years of side quests', 'the Scroller', 'open · free', '© 2026 · mamaev.coach · ⬡ vibe in motion'],
}
let failed = 0
for (const [file, needles] of Object.entries(checks)) {
  const html = readFileSync(join(process.cwd(), file), 'utf8')
  const scenes = (html.match(/\/quest\/scenes\/0\d-[a-z]+\.webp/g) ?? []).length
  if (scenes < 7) { console.error(`${file}: only ${scenes} scene posters, expected ≥ 7`); failed++ }
  for (const n of needles) if (!html.includes(n)) { console.error(`${file}: missing "${n}"`); failed++ }
  if (/\[(scene|loop|сцена|петля):/.test(html)) { console.error(`${file}: service mark leaked`); failed++ }
}
console.log(failed ? `smoke: ${failed} miss(es)` : 'smoke: ok')
process.exit(failed ? 1 : 0)
```

- [ ] **Step 2: Write QuestHome**

`hub/components/quest/quest-home.tsx`:

```tsx
import type { Locale } from '../../lib/dictionaries'
import { quest, type Fork } from '../../lib/quest/content'
import { LangSwitcher } from '../lang-switcher'
import { Chapter, type Tint } from './chapter'
import { GatePlaques } from './gate-plaques'
import { OutcomeReveal } from './outcome-reveal'
import { PathFork } from './path-fork'
import { SceneLoop } from './scene-loop'
import { StickyStage } from './sticky-stage'

interface Props { locale: Locale }

const FORK_TINT: Record<Fork['id'], Tint> = { boulder: 'fork1', temple: 'fork2', gates: 'fork3' }

function Para({ text, lead = false }: { text: string; lead?: boolean }) {
  return <p style={{ fontSize: lead ? 'var(--text-lg)' : 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)', maxWidth: '40rem', marginBottom: '1rem' }}>{text}</p>
}

export function QuestHome({ locale }: Props) {
  const c = quest[locale]
  return (
    <main>
      <LangSwitcher locale={locale} />
      <style>{`
        @media (max-width: 720px) {
          .hub-section { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
          .quest-hero h1 { font-size: clamp(1.6rem, 7vw, 3rem) !important; }
        }
      `}</style>

      {/* 0. Hero: the map, the four lines, the header line that stays. */}
      <Chapter id="hero" tint="hero">
        <div className="quest-hero" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
              {c.hero.name} · {c.hero.role}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'clamp(1.9rem, 4.6vw, 3.6rem)', lineHeight: 1.02, letterSpacing: '-0.035em', color: 'var(--text-primary)', marginBottom: '1.25rem', textWrap: 'balance' }}>
              {c.hero.lines[0]}
            </h1>
            {c.hero.lines.slice(1).map((l) => <Para key={l} text={l} lead />)}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>{c.hero.bio}</p>
          </div>
          <SceneLoop id={c.hero.scene} locale={locale} eager />
        </div>
      </Chapter>

      {/* 1. Intro: camp by the fire, three paragraphs as steps beside the sticky scene. */}
      <Chapter id="intro" tint="intro" eyebrow={c.intro.eyebrow} heading={c.intro.heading}>
        <StickyStage
          media={() => <SceneLoop id={c.intro.scene} locale={locale} />}
          steps={c.intro.paragraphs.map((p, i) => ({ key: `intro-${i}`, body: p }))}
        />
      </Chapter>

      {/* 2–4. Forks. */}
      {c.forks.map((fork, n) => (
        <Chapter key={fork.id} id={fork.id} tint={FORK_TINT[fork.id]} eyebrow={fork.eyebrow} heading={fork.obstacle}>
          <StickyStage
            media={(active) =>
              fork.id === 'gates'
                ? <GatePlaques locale={locale} plaques={c.labels.plaques} caption={active === 0 ? undefined : active === 1 ? c.labels.habit : c.labels.detour} />
                : <SceneLoop id={fork.scene} locale={locale} caption={active === 0 ? undefined : active === 1 ? c.labels.habit : c.labels.detour} />
            }
            steps={[
              { key: `${fork.id}-setup`, body: fork.setup.map((p, i) => <Para key={i} text={p} lead />) },
              { key: `${fork.id}-habit`, body: <PathFork fork={fork} labels={c.labels} /> },
              { key: `${fork.id}-outcomes`, body: <OutcomeReveal title={fork.outcomesTitle} outcomes={fork.outcomes} labels={c.labels} /> },
            ]}
          />
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-start' }}>
            {fork.cta ? <a href={fork.cta.href} className="quest-cta">{fork.cta.label}</a> : null}
            <Para text={fork.bridge} />
          </div>
          {n === 2 ? null : null}
        </Chapter>
      ))}

      {/* 5. Finale. */}
      <Chapter id="finale" tint="finale" eyebrow={c.finale.eyebrow} heading={c.finale.heading}>
        <StickyStage
          media={() => <SceneLoop id={c.finale.scene} locale={locale} />}
          steps={[
            ...c.finale.paragraphs.map((p, i) => ({ key: `finale-${i}`, body: p })),
            {
              key: 'finale-cta',
              body: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div className="quest-number" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}>{c.finale.closing}</div>
                  <a href={c.finale.cta.href} className="quest-cta">{c.finale.cta.label}</a>
                </div>
              ),
            },
          ]}
        />
      </Chapter>

      {/* 6. About × 2 + footer. */}
      <Chapter id="about" tint="about">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
          <SceneLoop id={c.about.scene} locale={locale} />
          <div className="quest-cards">
            <article className="quest-card">
              <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{c.about.author.heading}</h3>
              <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{c.about.author.text}</p>
              <a href={c.about.author.cta.href} className="quest-cta quest-cta--ghost" style={{ alignSelf: 'flex-start' }}>{c.about.author.cta.label}</a>
              <p style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', letterSpacing: '0.04em' }}>
                {c.about.author.links.map((l) => <a key={l.href} href={l.href}>→ {l.label}</a>)}
              </p>
            </article>
            <article className="quest-card">
              <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{c.about.course.heading}</h3>
              <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{c.about.course.text}</p>
              <a href={c.about.course.href} className="quest-cta" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>{c.forks[2].detour.ctas?.[0].label}</a>
            </article>
          </div>
        </div>
        <footer style={{ marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
          {c.footer}
        </footer>
      </Chapter>
    </main>
  )
}
```

Remove the no-op line `{n === 2 ? null : null}` before committing (it is a placeholder for nothing; the `n` index is then unused — drop it from the `map` signature too).

- [ ] **Step 3: Wire the routes and delete the old page**

`hub/app/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { QuestHome } from '../components/quest/quest-home'
import { quest } from '../lib/quest/content'

export const metadata: Metadata = { title: quest.ru.seo.title, description: quest.ru.seo.description }

export default function Page() {
  return <QuestHome locale="ru" />
}
```

`hub/app/en/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { QuestHome } from '../../components/quest/quest-home'
import { quest } from '../../lib/quest/content'

export const metadata: Metadata = { title: quest.en.seo.title, description: quest.en.seo.description }

export default function Page() {
  return <QuestHome locale="en" />
}
```

Then `git rm hub/components/home-page.tsx`. Grep for any other importer first: `grep -rn "home-page" hub/app hub/components hub/lib` must return nothing after the route edits.

- [ ] **Step 4: Build and smoke**

Run (from `hub/`): `npm run build && node scripts/quest-smoke.mjs && npx vitest run`
Expected: build succeeds (static export, no errors about client/server boundaries), `smoke: ok`, all tests pass.

If the build complains that `SceneLoop` (client) receives a function prop from a server component: the `media` render prop is passed from `QuestHome`, which is a server component, into `StickyStage` (client). Fix by marking `QuestHome` itself `'use client'` at the top of `quest-home.tsx` (it holds no server-only logic), and keep `page.tsx` server-side for `metadata`.

- [ ] **Step 5: Commit**

```bash
git add hub/components/quest/quest-home.tsx hub/app/page.tsx hub/app/en/page.tsx hub/scripts/quest-smoke.mjs
git rm -q hub/components/home-page.tsx
git commit -m "feat(quest): QuestHome — главная как скроллителлинг (RU/EN), старый лендинг снят"
```

---

### Task 7: Acceptance shots and trend vibe-check

**Files:**
- Create: `hub/scripts/quest-shots.mjs`
- Output (outside git): `C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_media\quest-home\*.png`
- Output (outside git): `C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_derived\quest-trend\`
- Report: `docs/superpowers/plans/2026-09-08-quest-home-acceptance.md` (numbers only, no verdict)

**Interfaces:**
- Consumes the built `hub/out/`.

- [ ] **Step 1: Write the screenshot script**

`hub/scripts/quest-shots.mjs` (Playwright is available globally via `npx playwright`; browsers already installed for the taste contour):

```js
// Chapter screenshots of the static export for acceptance. Usage:
//   npx serve out -l 4173   (or any static server)  →  node scripts/quest-shots.mjs http://localhost:4173 <outDir>
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const [base, outDir] = process.argv.slice(2)
if (!base || !outDir) { console.error('usage: quest-shots.mjs <baseUrl> <outDir>'); process.exit(2) }
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  for (const path of ['/', '/en/']) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' })
    await page.goto(base + path, { waitUntil: 'networkidle' })
    for (const id of ['hero', 'intro', 'boulder', 'temple', 'gates', 'finale', 'about']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      const loc = path === '/' ? 'ru' : 'en'
      await page.screenshot({ path: join(outDir, `${loc}-${name}-${id}.png`) })
    }
    await page.close()
  }
}
await browser.close()
console.log('shots written to', outDir)
```

If `playwright` cannot be resolved from `hub/`, run it from the NAUTILUS checkout where it is installed: `node C:\telo\Efforts\Ongoing\mc_hub\hub\scripts\quest-shots.mjs … ` with `cwd` = `C:\telo\Efforts\Ongoing\NAUTILUS`.

- [ ] **Step 2: Serve and shoot**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub\hub
npx -y serve out -l 4173   # background
node scripts/quest-shots.mjs http://localhost:4173 C:\telo\Efforts\Ongoing\NAUTILUS\core\desops\taste\_media\quest-home
```

Expected: 28 PNG files. Open `ru-desktop-gates.png` and `en-desktop-gates.png` with the Read tool and confirm the plaques read «open · бесплатно» / «open · free» inside the two blank boards, not floating beside them. Open `en-mobile-boulder.png` and confirm the scene sticks above the text without covering it.

- [ ] **Step 3: Vibe-check against the trend sample**

From `C:\telo\Efforts\Ongoing\NAUTILUS` (worktree of `origin/main` if the main tree sits on another branch: `git worktree add .worktrees/quest-check origin/main`):

```powershell
$env:LITELLM_KEY = [Environment]::GetEnvironmentVariable('LITELLM_KEY','User')
cd core/desops/scripts
python taste_embed.py run --source ../taste/_media/adweek-twitch/shots --out ../taste/_derived/quest-trend --view both --kind screen
python - <<'EOF'
import json, os
shots = sorted(f for f in os.listdir('../taste/_media/adweek-twitch/shots') if f.endswith('.jpg'))
json.dump({'selected': shots}, open('../taste/_derived/quest-trend/selection.json', 'w'))
EOF
python taste_mood.py centroid --index ../taste/_derived/quest-trend --from-selection ../taste/_derived/quest-trend/selection.json
# prints  sel-<ref>: картинок 21, r90=…  → use the ref below
foreach ($f in Get-ChildItem ../taste/_media/quest-home/*-desktop-*.png) {
  python taste_mood.py check --index ../taste/_derived/quest-trend --file $f.FullName --ref sel-<ref>
}
```

Expected: 14 lines `inside | edge | outside` with distances. Record every line in `docs/superpowers/plans/2026-09-08-quest-home-acceptance.md` under «Vibe-check», with the centroid ref and r90, and a one-line note that the threshold is uncalibrated (first calibration point). If the gateway or jina embedder is down (`run` exits 2 or refuses without the key), write that outcome in the same file instead of numbers — never fabricate distances.

- [ ] **Step 4: Commit the scripts and the acceptance note**

```bash
git add hub/scripts/quest-shots.mjs docs/superpowers/plans/2026-09-08-quest-home-acceptance.md
git commit -m "chore(quest): скрины приёмки по главам и вайб-чек по тренду Adweek (первая точка калибровки)"
```

---

## Self-review

- Spec §3 content shape → Task 2; §4 primitives → Tasks 4–5 (`GuideChip`, `SceneLoop`, `GatePlaques`, `Chapter`, `StickyStage`, `PathFork`, `OutcomeReveal`), `QuestHome` → Task 6; §5 theme + contract → Task 3; §6 assets + budget → Task 1; §7 routes + metadata → Task 6; §8 tests → Tasks 1, 2, 3, 4, 5, 6 (smoke); §9 acceptance → Task 7; §10 branch rules → Global Constraints.
- Placeholders: the RU object in Task 2 is a transcription from a named file by an explicit mapping table; the only `...` in the plan marks it and says so. No other TBD.
- Types: `SceneId`, `Scene`, `sceneAssets`, `GUIDE_ASSETS`, `GATE_PLAQUES`, `PlaqueBox` (Task 1) are used with the same names in Tasks 4–6; `QuestContent['labels']` carries `habit`, `detour`, `scroller`, `builder`, `plaques`, `skipToText` (Task 2) and is consumed by `PathFork`, `OutcomeReveal`, `GatePlaques` (Tasks 4–6). `StageStep = { key, body }` and `media: (active) => ReactNode` match between Task 5 and Task 6. `Tint` union matches the seven CSS tokens in Task 3.
