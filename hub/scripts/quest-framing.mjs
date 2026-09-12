// Framing guard for the cover's landscape hero and finale (2026-09-12: at 1024 px the hero
// copy panel ran onto the Scroller and the Builder left the frame on the right; the finale
// card touched the Scroller — no check measured where the characters actually land).
//
// LOCAL ACCEPTANCE TOOL (same contract as quest-video-check.mjs, which calls it):
// Playwright is not a hub dependency and resolves from whatever cwd has it.
//
// For every desktop width the landscape plates serve (>= 901 px) and both themes, it
// projects each guide's box (lib/quest/character-boxes.json) through the land plate's own
// object-fit/object-position and on-screen rect (lib/quest/framing-math.mjs) and requires,
// HARD: the box whole inside the visible frame (frame ∩ its clipping wrapper) and 0 px into
// the copy panel. Hero at rest (scroll 0), finale with its frame centred in the viewport.
//
// Usage: node scripts/quest-framing.mjs <baseUrl> [path]
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'
import { intersect, outsideBy, overlapBy, parseObjectPosition, projectBox } from '../lib/quest/framing-math.mjs'

const BOXES = JSON.parse(readFileSync(new URL('../lib/quest/character-boxes.json', import.meta.url), 'utf8'))
export const FRAMING_WIDTHS = [901, 1024, 1180, 1280, 1440, 1920]
const TOL = 0.5 // px — sub-pixel rounding only

const SCENES = [
  { id: 'hero', art: '01-map-wide', frame: '.quest-hero-frame', clip: '.quest-hero-drift', copy: '.quest-hero-copy', atRest: true },
  { id: 'finale', art: '06-wall-wide', frame: '.quest-finale-frame', clip: '.quest-finale-frame', copy: '.quest-finale-copy', atRest: false },
]

/** Which side(s) a rect leaves the frame by, for the log. */
function sides(r, f) {
  const s = []
  if (f.left - r.left > TOL) s.push(`L${(f.left - r.left).toFixed(0)}`)
  if (r.right - f.right > TOL) s.push(`R${(r.right - f.right).toFixed(0)}`)
  if (f.top - r.top > TOL) s.push(`T${(f.top - r.top).toFixed(0)}`)
  if (r.bottom - f.bottom > TOL) s.push(`B${(r.bottom - f.bottom).toFixed(0)}`)
  return s.join('')
}

export async function checkFraming(browser, base, path, { log = console.log, widths = FRAMING_WIDTHS, height = 900 } = {}) {
  let failed = 0
  const rows = []
  for (const w of widths) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: w, height }, colorScheme: scheme })
      const page = await ctx.newPage()
      await page.goto(base + path, { waitUntil: 'load' })
      await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' })
      for (const sc of SCENES) {
        await page.evaluate(({ sel, atRest }) => {
          if (atRest) { window.scrollTo(0, 0); return }
          const el = document.querySelector(sel)
          const r = el.getBoundingClientRect()
          window.scrollTo(0, r.top + window.scrollY - (window.innerHeight - r.height) / 2)
        }, { sel: sc.frame, atRest: sc.atRest })
        await page.waitForTimeout(400)
        const m = await page.evaluate(({ frame, clip, copy }) => {
          const f = document.querySelector(frame)
          const land = f?.querySelector('.quest-scene__plates[data-frame="wide"] .quest-scene__plate--land img')
          if (!land || !land.naturalWidth) return null
          const rect = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height } }
          return {
            box: { w: land.offsetWidth, h: land.offsetHeight },
            natural: { w: land.naturalWidth, h: land.naturalHeight },
            pos: getComputedStyle(land).objectPosition,
            screen: rect(land),
            frame: rect(f),
            clip: rect(f.querySelector(clip) ?? f),
            copy: rect(document.querySelector(copy)),
          }
        }, sc)
        if (!m) { log(`framing ${sc.id} ${w} ${scheme}: FAIL no landscape plate on screen`); failed++; continue }
        const visible = intersect(m.frame, m.clip)
        const pos = parseObjectPosition(m.pos)
        for (const b of BOXES[sc.art]) {
          const r = projectBox(b, m.box, m.natural, pos, m.screen)
          const out = outsideBy(r, visible)
          const over = overlapBy(r, m.copy)
          const bad = out > TOL || over > TOL
          if (bad) failed++
          rows.push({ scene: sc.id, w, scheme, who: b.who, out, over, side: sides(r, visible), bad })
        }
      }
      await ctx.close()
    }
  }
  log('framing: scene | width | guide | px outside frame (side) / px into copy — light | dark')
  for (const sc of SCENES) for (const w of widths) for (const who of ['scroller', 'builder']) {
    const pick = (scheme) => rows.find((r) => r.scene === sc.id && r.w === w && r.who === who && r.scheme === scheme)
    const l = pick('light'); const d = pick('dark')
    if (!l || !d) continue
    const f = (r) => `${r.out.toFixed(1)}${r.side ? `(${r.side})` : ''}/${r.over.toFixed(1)}`
    log(`  ${sc.id.padEnd(6)} ${String(w).padStart(4)} ${who.padEnd(8)} ${f(l)} | ${f(d)}${l.bad || d.bad ? '  FAIL' : ''}`)
  }
  return failed
}

if (process.argv[1]?.endsWith('quest-framing.mjs')) {
  const [base, path = '/cover/trend-adweek-2026-09/'] = process.argv.slice(2)
  if (!base) { console.error('usage: quest-framing.mjs <baseUrl> [path]'); process.exit(2) }
  const browser = await chromium.launch()
  const failed = await checkFraming(browser, base, path)
  await browser.close()
  console.log(failed ? `quest-framing: ${failed} failure(s)` : 'quest-framing: ok')
  process.exit(failed ? 1 : 0)
}
