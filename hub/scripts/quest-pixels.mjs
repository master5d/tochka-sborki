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
//   (b) upscale — rendered size ÷ natural size × devicePixelRatio (object-fit aware).
//   (c) visible share of the source under object-fit: cover.
// (b) and (c) are REPORTED as a worst-case table; they only fail with STRICT_PIXELS=1,
// to be switched on once the 2K world is in (the current 848×1264 art cannot pass).
//
// Usage: node scripts/quest-pixels.mjs <baseUrl> [path]
import { chromium } from 'playwright'

export const STRETCH_TOL = 0.005
export const MAX_UPSCALE_1440_2X = 1.5 // STRICT_PIXELS gate, 1440×900@2x only
export const MIN_VISIBLE_PINNED = 0.8 // STRICT_PIXELS gate, hero and pinned scenes

const VIEWPORTS = [
  { w: 1440, h: 900, dpr: 2 },
  { w: 1920, h: 1080, dpr: 1 },
  { w: 390, h: 844, dpr: 3 },
]

export async function checkPixels(browser, base, path, { strict = false, log = console.log } = {}) {
  let failed = 0
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
        const rows = await page.evaluate(() =>
          [...document.querySelectorAll('main img, main video')]
            .filter((el) => {
              const r = el.getBoundingClientRect()
              const cs = getComputedStyle(el)
              return r.width > 80 && r.height > 80 && r.top < innerHeight && r.bottom > 0 &&
                cs.visibility !== 'hidden' && +cs.opacity > 0.01 && (el.naturalWidth || el.videoWidth)
            })
            .map((el) => {
              const cs = getComputedStyle(el)
              // Layout box (pre-transform) for the object-fit math; transforms are handled below.
              const bw = el.offsetWidth || el.getBoundingClientRect().width
              const bh = el.offsetHeight || el.getBoundingClientRect().height
              const nw = el.naturalWidth || el.videoWidth
              const nh = el.naturalHeight || el.videoHeight
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
            }),
        )
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
        const stretchBad = r.maxDev > STRETCH_TOL
        const upBad = strict && vp.w === 1440 && vp.dpr === 2 && r.upscale > MAX_UPSCALE_1440_2X
        const visBad = strict && r.pinned && r.minVisible < MIN_VISIBLE_PINNED
        if (stretchBad || upBad || visBad) failed++
        const flags = [stretchBad && 'STRETCH', upBad && 'UPSCALE', visBad && 'CROP'].filter(Boolean).join(',')
        log(`  ${r.src.padEnd(40)} ${r.natural.padEnd(10)} x${r.upscale.toFixed(2).padStart(5)}  vis ${r.minVisible.toFixed(2)}  stretch ${r.stretch.toFixed(3)}${flags ? '  FAIL ' + flags : ''}`)
      }
      await ctx.close()
    }
  }
  return failed
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('quest-pixels.mjs')) {
  const [base, path = '/cover/trend-adweek-2026-09/'] = process.argv.slice(2)
  if (!base) { console.error('usage: quest-pixels.mjs <baseUrl> [path]'); process.exit(2) }
  const browser = await chromium.launch()
  const failed = await checkPixels(browser, base, path, { strict: process.env.STRICT_PIXELS === '1' })
  await browser.close()
  console.log(failed ? `quest-pixels: ${failed} failure(s)` : 'quest-pixels: ok')
  process.exit(failed ? 1 : 0)
}
