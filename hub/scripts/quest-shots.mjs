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
