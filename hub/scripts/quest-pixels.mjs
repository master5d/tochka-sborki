// Pixel guard for the quest cover (2026-09-12 audit: the first picture was stretched,
// cropped and blurry, and five earlier audits missed it — they measured text, fps and
// contrast, never the picture's own pixels).
//
// LOCAL ACCEPTANCE TOOL (same contract as quest-video-check.mjs, which calls it):
// Playwright is not a hub dependency and resolves from whatever cwd has it.
//
// Walks the page half a viewport at a time on three viewports × two themes and, for
// every visible <img>/<video>, measures:
//   (a) stretch — the product of every ancestor's transform matrix: |scaleY/scaleX − 1|
//       must stay ≤ STRETCH_TOL. HARD: any violation fails.
//   (b) upscale — rendered size ÷ the FILE's pixel size × devicePixelRatio (object-fit
//       aware). Under a srcset, `naturalWidth` is density-corrected (the CSS size the
//       browser pretends the file has) and cannot measure this, so the file's real size
//       is decoded once from `currentSrc` without a srcset.
//   (c) visible share of the source under object-fit: cover.
// Since the 2K world is in, (b) and (c) are STRICT by default (STRICT_PIXELS=0 turns
// them back into a report): (b) on 1440×900@2x, (c) for the hero and the pinned scenes
// on the desktop viewports. A file on lib/quest/awaiting-2k.json — still the 1K world-v3
// frame, its 2K pair not generated yet — is printed as AWAITING and never fails; the
// list is the reminder, and it shrinks as the pairs land.
//
// Why 1.75 and not the 1.5 first proposed: the road scenes are 2:3 art drawn full-bleed
// (cover) at 1440 css px = 2880 device px on a 1440@2x screen, and the 2K frame is
// 1696 px wide — 2880 / 1696 = 1.70 is the floor for the 2K world there. 1.5 needs a
// 4K frame (or a narrower box). Anything above 1.75 is a real regression.
// Why 0.78 and (c) only on desktop: a 3:2 frame in a 1920×1028 box shows 0.798 of itself
// by geometry (the crops this gate exists for were 0.22–0.52); a phone's full-screen box
// is ~0.46 wide:tall against the art's 0.67, so ~0.69 there is geometry too — printed.
//
// Usage: node scripts/quest-pixels.mjs <baseUrl> [path]
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

export const STRETCH_TOL = 0.005
export const MAX_UPSCALE_1440_2X = 1.75 // strict gate, 1440×900@2x only (see header)
export const MIN_VISIBLE_PINNED = 0.78 // strict gate, hero and pinned scenes, desktop viewports (see header)

const AWAITING = JSON.parse(readFileSync(new URL('../lib/quest/awaiting-2k.json', import.meta.url), 'utf8'))
const awaiting = (src) => AWAITING.paths.some((p) => p.endsWith('/' + src))

const VIEWPORTS = [
  { w: 1440, h: 900, dpr: 2 },
  { w: 1920, h: 1080, dpr: 1 },
  { w: 390, h: 844, dpr: 3 },
]

export async function checkPixels(browser, base, path, { strict = true, log = console.log } = {}) {
  let failed = 0
  const waiting = new Set()
  for (const vp of VIEWPORTS) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.dpr, colorScheme: scheme })
      const page = await ctx.newPage()
      await page.goto(base + path, { waitUntil: 'load' })
      await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' })
      const total = await page.evaluate(() => document.documentElement.scrollHeight)
      const worst = new Map()
      for (let y = 0; y < total; y += Math.round(vp.h / 2)) {
        await page.evaluate((v) => window.scrollTo(0, v), y)
        await page.waitForTimeout(150)
        const rows = await page.evaluate(async () => {
          const real = (window.__questRealSize ??= new Map())
          const sizeOf = async (el) => {
            if (el.tagName === 'VIDEO') return [el.videoWidth, el.videoHeight]
            const url = el.currentSrc || el.src
            if (!real.has(url)) {
              const probe = new Image()
              probe.src = url
              await probe.decode().catch(() => undefined)
              real.set(url, [probe.naturalWidth || el.naturalWidth, probe.naturalHeight || el.naturalHeight])
            }
            return real.get(url)
          }
          const els = [...document.querySelectorAll('main img, main video')].filter((el) => {
            const r = el.getBoundingClientRect()
            const cs = getComputedStyle(el)
            return r.width > 80 && r.height > 80 && r.top < innerHeight && r.bottom > 0 &&
              cs.visibility !== 'hidden' && +cs.opacity > 0.01 && (el.naturalWidth || el.videoWidth)
          })
          const sizes = await Promise.all(els.map(sizeOf))
          return els.map((el, i) => {
            const cs = getComputedStyle(el)
            // Layout box (pre-transform) for the object-fit math; transforms are handled below.
            const bw = el.offsetWidth || el.getBoundingClientRect().width
            const bh = el.offsetHeight || el.getBoundingClientRect().height
            const [nw, nh] = sizes[i]
            let sx = 1
            let sy = 1
            for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
              const t = getComputedStyle(n).transform
              const m = t && t !== 'none' ? t.match(/matrix\(([^)]+)\)/) : null
              const m3 = t && t !== 'none' ? t.match(/matrix3d\(([^)]+)\)/) : null
              if (m) { const [a, b, c, d] = m[1].split(',').map(Number); sx *= Math.hypot(a, b); sy *= Math.hypot(c, d) }
              else if (m3) { const v = m3[1].split(',').map(Number); sx *= Math.hypot(v[0], v[1]); sy *= Math.hypot(v[4], v[5]) }
            }
            const fit = cs.objectFit
            const s = fit === 'cover' ? Math.max(bw / nw, bh / nh) : fit === 'contain' ? Math.min(bw / nw, bh / nh) : Math.max(bw / nw, bh / nh)
            const visible = fit === 'cover' ? Math.min(bw / (nw * s), 1) * Math.min(bh / (nh * s), 1) : 1
            const pinned = !!el.closest('.quest-hero-frame, .quest-backdrop__scene')
            return {
              src: (el.currentSrc || el.src || '').split('/').slice(-2).join('/'),
              natural: `${nw}x${nh}`,
              upscale: s * devicePixelRatio * Math.max(sx, sy),
              visible,
              stretch: sy / sx,
              pinned,
            }
          })
        })
        for (const r of rows) {
          const cur = worst.get(r.src)
          if (!cur) worst.set(r.src, { ...r, minVisible: r.visible, maxDev: Math.abs(r.stretch - 1) })
          else {
            cur.upscale = Math.max(cur.upscale, r.upscale)
            cur.minVisible = Math.min(cur.minVisible, r.visible)
            if (Math.abs(r.stretch - 1) > cur.maxDev) { cur.maxDev = Math.abs(r.stretch - 1); cur.stretch = r.stretch }
            cur.pinned = cur.pinned || r.pinned
          }
        }
      }
      const label = `${vp.w}x${vp.h}@${vp.dpr} ${scheme}`
      log(`pixels ${label}: src | natural | worst upscale (device px) | min visible share | worst Y/X stretch`)
      for (const r of [...worst.values()].sort((a, b) => b.upscale - a.upscale)) {
        const isWaiting = awaiting(r.src)
        const stretchBad = r.maxDev > STRETCH_TOL
        const upBad = strict && !isWaiting && vp.w === 1440 && vp.dpr === 2 && r.upscale > MAX_UPSCALE_1440_2X
        const visBad = strict && !isWaiting && r.pinned && vp.w >= 901 && r.minVisible < MIN_VISIBLE_PINNED
        if (stretchBad || upBad || visBad) failed++
        if (isWaiting) waiting.add(r.src)
        const flags = [stretchBad && 'STRETCH', upBad && 'UPSCALE', visBad && 'CROP'].filter(Boolean).join(',')
        const note = isWaiting ? '  AWAITING 2K (ждёт генерации, баланс Google)' : ''
        log(`  ${r.src.padEnd(40)} ${r.natural.padEnd(10)} x${r.upscale.toFixed(2).padStart(5)}  vis ${r.minVisible.toFixed(2)}  stretch ${r.stretch.toFixed(3)}${flags ? '  FAIL ' + flags : ''}${note}`)
      }
      await ctx.close()
    }
  }
  if (waiting.size) log(`pixels: ${waiting.size} frame(s) still on 1K, awaiting their 2K pair (lib/quest/awaiting-2k.json): ${[...waiting].sort().join(', ')}`)
  return failed
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('quest-pixels.mjs')) {
  const [base, path = '/cover/trend-adweek-2026-09/'] = process.argv.slice(2)
  if (!base) { console.error('usage: quest-pixels.mjs <baseUrl> [path]'); process.exit(2) }
  const browser = await chromium.launch()
  const failed = await checkPixels(browser, base, path, { strict: process.env.STRICT_PIXELS !== '0' })
  await browser.close()
  console.log(failed ? `quest-pixels: ${failed} failure(s)` : 'quest-pixels: ok')
  process.exit(failed ? 1 : 0)
}
