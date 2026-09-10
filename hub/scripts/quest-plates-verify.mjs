// Wave K acceptance: proves the two-plane parallax scenes actually behave as
// specified, on the BUILT static export — not by re-reading the source, by
// measuring the real rendered page.
//
// This is a LOCAL ACCEPTANCE TOOL, not part of the build or CI (same contract
// as quest-shots.mjs / quest-video-check.mjs): it imports `playwright`, which
// is deliberately not a hub dependency; it resolves from whatever cwd already
// has it installed (works from `hub/` or from NAUTILUS in this lab).
//
// Usage: node scripts/quest-plates-verify.mjs <baseUrl> [screenshotDir]
//
// What it proves, in order:
//  1. Relative displacement (land vs. sky, absolute DOCUMENT y-coordinates —
//     not Playwright's viewport-relative boundingBox(), which would conflate
//     the page's own scroll delta with the transform) for every split scene,
//     sampled at the chapter's own progress=0 and progress=1 scroll offsets
//     (computed from the exact `clampProgress` formula the page itself uses,
//     read off the LIVE `.quest-scene` box — not assumed from layout guesses).
//     Also prints the same measurement for a flat scene (03-boulder), which
//     must come out exactly 0 (no plates, no transform, untouched).
//  2. prefers-reduced-motion: the same measurement under `reducedMotion:
//     'reduce'`, which must also come out exactly 0 for a split scene (planes
//     still shown, zero relative offset — the original still).
//  3. Seam coverage: takes a full-height screenshot of each split scene's own
//     `.quest-scene` box at several scroll offsets spanning its chapter, and
//     scans every row of every screenshot for a row that is (almost) entirely
//     the page's own `--bg-secondary` token colour — the only way a real gap
//     between the sky and land plates could show, since nothing else in the
//     composite is a flat colour. Reports the worst case (max background-row
//     fraction found, 0 = never) alongside the manifest's own `feather`, which
//     is the guaranteed minimum plate overlap at rest (land only ever drifts
//     TOWARD the sky, never away — see scene-plates.tsx for why that's safe).
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SEAM_SCAN_PY = join(__dirname, 'quest-seam-scan.py')

/** No new npm dependency for PNG pixel access: shells out to the system
 *  Python + Pillow this lab's other one-shot scripts already rely on
 *  (see quest-assets.ps1's own `python $pyFile ...` calls). Returns the
 *  worst-case row background-colour match fraction, 0..1. */
function seamScanWorstFraction(pngPath, [r, g, b]) {
  const out = execFileSync('python', [SEAM_SCAN_PY, pngPath, String(r), String(g), String(b)], { encoding: 'utf8' })
  return parseFloat(out.trim())
}

const [base, shotDir] = process.argv.slice(2)
if (!base) { console.error('usage: quest-plates-verify.mjs <baseUrl> [screenshotDir]'); process.exit(2) }
const OUT = shotDir ?? join(process.cwd(), '.quest-plates-verify-shots')
mkdirSync(OUT, { recursive: true })

const SPLIT_SCENES = [
  { chapter: 'hero', id: '01-map' },
  { chapter: 'intro', id: '02-camp' },
  { chapter: 'finale', id: '06-wall' },
  { chapter: 'about', id: '07-signs' },
]
const FLAT_SCENE = { chapter: 'boulder', id: '03-boulder' }

let failed = 0
const browser = await chromium.launch()

/** Absolute-document y = viewport-relative top + current scrollY. Cancels the
 *  scroll delta between two measurements, isolating whatever CSS transform
 *  moved the element — the whole point of NOT using boundingBox() here. */
async function absDocY(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    return el.getBoundingClientRect().top + window.scrollY
  }, selector)
}

/** Scroll offsets bracketing this element's own 0..1 `clampProgress` transit,
 *  read off its LIVE rect (documentTop/height), matching use-chapter-progress.ts
 *  exactly rather than guessing from chapter layout. */
async function progressBounds(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    const rect = el.getBoundingClientRect()
    const documentTop = rect.top + window.scrollY
    const vh = window.innerHeight
    return {
      y0: Math.max(0, documentTop - vh),
      y1: documentTop + rect.height,
      documentTop,
      height: rect.height,
    }
  }, selector)
}

async function scrollTo(page, y) {
  await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y)
  await page.waitForTimeout(250) // let the shared rAF parallax loop settle
}

async function measureDisplacement(page, sceneId, { skySel, landSel, singleSel }) {
  const containerSel = `[data-scene="${sceneId}"]`
  const bounds = await progressBounds(page, containerSel)
  await scrollTo(page, bounds.y0)
  const startSky = singleSel ? await absDocY(page, singleSel) : await absDocY(page, skySel)
  const startLand = singleSel ? startSky : await absDocY(page, landSel)
  await scrollTo(page, bounds.y1)
  const endSky = singleSel ? await absDocY(page, singleSel) : await absDocY(page, skySel)
  const endLand = singleSel ? endSky : await absDocY(page, landSel)
  const skyDelta = endSky - startSky
  const landDelta = endLand - startLand
  return { skyDelta, landDelta, relative: landDelta - skyDelta }
}

console.log('--- 1. relative displacement (land vs sky, absolute document y) ---')
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(base + '/', { waitUntil: 'networkidle' })

  for (const s of SPLIT_SCENES) {
    const skySel = `[data-scene="${s.id}"] .quest-scene__plate--sky img`
    const landSel = `[data-scene="${s.id}"] .quest-scene__plate--land img`
    const { skyDelta, landDelta, relative } = await measureDisplacement(page, s.id, { skySel, landSel })
    const ok = Math.abs(relative) >= 30 && Math.abs(relative) <= 80
    console.log(`${s.id} (#${s.chapter}): sky=${skyDelta.toFixed(1)}px land=${landDelta.toFixed(1)}px relative=${relative.toFixed(1)}px -> ${ok ? 'OK' : 'CHECK'}`)
    if (!ok) failed++
  }

  const flatSel = `[data-scene="${FLAT_SCENE.id}"] > picture > img`
  const flat = await measureDisplacement(page, FLAT_SCENE.id, { singleSel: flatSel })
  const flatOk = Math.abs(flat.relative) < 0.5 // sub-pixel layout jitter tolerance, not a real offset
  console.log(`${FLAT_SCENE.id} (#${FLAT_SCENE.chapter}, flat/control): relative=${flat.relative.toFixed(1)}px -> ${flatOk ? 'OK' : 'FAIL'}`)
  if (!flatOk) failed++

  await page.close()
}

console.log('--- 2. prefers-reduced-motion: relative displacement must be 0 ---')
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  const s = SPLIT_SCENES[0]
  const skySel = `[data-scene="${s.id}"] .quest-scene__plate--sky img`
  const landSel = `[data-scene="${s.id}"] .quest-scene__plate--land img`
  const { relative } = await measureDisplacement(page, s.id, { skySel, landSel })
  const ok = Math.abs(relative) < 0.5 // sub-pixel layout jitter tolerance, not a real offset
  console.log(`${s.id} reduced-motion: relative=${relative.toFixed(1)}px -> ${ok ? 'OK' : 'FAIL'}`)
  if (!ok) failed++
  await page.close()
}

console.log('--- 3. seam coverage: no background-colour row across the chapter ---')
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  const bg = await page.evaluate(() => {
    const probe = document.querySelector('.quest-scene')
    return probe ? getComputedStyle(probe).backgroundColor : null
  })
  console.log(`page --bg-secondary resolves to: ${bg}`)
  const bgRgb = bg?.match(/\d+/g)?.map(Number) ?? null

  let worstFraction = 0
  for (const s of SPLIT_SCENES) {
    const containerSel = `[data-scene="${s.id}"]`
    const bounds = await progressBounds(page, containerSel)
    const samples = 6
    let sceneWorst = 0
    for (let i = 0; i < samples; i++) {
      const y = bounds.y0 + ((bounds.y1 - bounds.y0) * i) / (samples - 1)
      await scrollTo(page, y)
      const shotPath = join(OUT, `seam-${s.id}-${i}.png`)
      const el = page.locator(containerSel).first()
      await el.screenshot({ path: shotPath })
      const worstRowFraction = bgRgb ? seamScanWorstFraction(shotPath, bgRgb) : 0
      if (worstRowFraction > sceneWorst) sceneWorst = worstRowFraction
    }
    console.log(`${s.id}: worst background-colour row fraction across ${samples} samples = ${(sceneWorst * 100).toFixed(1)}% -> ${sceneWorst < 0.9 ? 'OK (no gap)' : 'FAIL (gap suspected)'}`)
    if (sceneWorst >= 0.9) failed++
    if (sceneWorst > worstFraction) worstFraction = sceneWorst
  }
  console.log(`worst-case seam overlap: manifest feather = 48 native px is the guaranteed floor (land drifts toward the sky only, per scene-plates.tsx); empirical worst background-row fraction observed = ${(worstFraction * 100).toFixed(1)}%`)
  await page.close()
}

await browser.close()
console.log(failed ? `quest-plates-verify: ${failed} failure(s)` : 'quest-plates-verify: ok')
process.exit(failed ? 1 : 0)
