// Chapter screenshots of the static export for acceptance. Usage:
//   npx serve out -l 4173   (or any static server)  →  node scripts/quest-shots.mjs http://localhost:4173 <outDir>
//
// This is a LOCAL ACCEPTANCE TOOL, not part of the build or CI. It is never run by
// `npm run build`, `npm test`, or any workflow — it imports `playwright`, which is
// deliberately NOT a dependency in hub/package.json (adding it would bloat every
// CI install with a browser download nobody else needs).
//
// It needs Playwright available on the machine running it, e.g.:
//   npm i -g playwright   (or any existing install that already has browsers downloaded)
//
// Run it against a served copy of the static export (`out/`), not the dev server —
// see the two commands above and in docs/superpowers/plans/2026-09-08-quest-home-acceptance.md.
//
// Wave C: shoots BOTH themes (colorScheme light/dark drives the world's day/night
// via prefers-color-scheme, since the static export has no explicit data-theme
// attribute) and shoots each chapter TWICE — once at its top, once scrolled to its
// middle — so a mid-chapter empty sticky column (the Wave A/B finding) can't hide
// from a screenshot that only ever looks at chapter tops.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const [base, outDir] = process.argv.slice(2)
if (!base || !outDir) { console.error('usage: quest-shots.mjs <baseUrl> <outDir>'); process.exit(2) }
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
for (const [name, viewport] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  for (const path of ['/', '/en/']) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce', colorScheme: theme })
      await page.goto(base + path, { waitUntil: 'networkidle' })
      const loc = path === '/' ? 'ru' : 'en'
      for (const id of ['hero', 'intro', 'boulder', 'temple', 'gates', 'finale', 'about']) {
        const locator = page.locator(`#${id}`)
        await locator.scrollIntoViewIfNeeded()
        await page.waitForTimeout(400)
        await page.screenshot({ path: join(outDir, `${loc}-${name}-${theme}-${id}-top.png`) })

        // Scroll to the chapter's own vertical middle so the sticky media's
        // mid-chapter state is captured, not just its entrance. `behavior: 'instant'`
        // matters: the site sets `scroll-behavior: smooth` on <html>, and a plain
        // wheel/scrollTo would land mid-animation under a fixed wait.
        const box = await locator.boundingBox()
        if (box) {
          const scrollY = await page.evaluate(() => window.scrollY)
          await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY + box.y + box.height / 2)
          await page.waitForTimeout(400)
          await page.screenshot({ path: join(outDir, `${loc}-${name}-${theme}-${id}-middle.png`) })
        }
      }
      await page.close()
    }
  }
}
await browser.close()
console.log('shots written to', outDir)
