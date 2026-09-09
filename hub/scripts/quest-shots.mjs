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
