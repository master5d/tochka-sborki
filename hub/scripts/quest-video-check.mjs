// Wave E acceptance: confirm the quest page's <video> loop follows the reader's
// theme, and that reduced motion never loads a video at all.
//
// This is a LOCAL ACCEPTANCE TOOL, not part of the build or CI (same contract as
// quest-shots.mjs): Playwright is not a hub dependency; it resolves from
// whatever cwd already has it installed (NAUTILUS/C:\telo in this lab).
//
// Usage: node scripts/quest-video-check.mjs <baseUrl>
import { chromium } from 'playwright'

const [base] = process.argv.slice(2)
if (!base) { console.error('usage: quest-video-check.mjs <baseUrl>'); process.exit(2) }

const browser = await chromium.launch()
let failed = 0

async function checkTheme(colorScheme, expectSuffix) {
  const page = await browser.newPage({ colorScheme, viewport: { width: 1280, height: 900 } })
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  const video = page.locator('video.quest-scene__video').first()
  await video.waitFor({ state: 'attached', timeout: 5000 })
  // Give the src-swap effect + loadedmetadata a moment to settle.
  await page.waitForTimeout(800)
  const currentSrc = await video.evaluate((el) => el.currentSrc)
  const ok = currentSrc.endsWith(`${expectSuffix}.mp4`)
  console.log(`${colorScheme}: currentSrc=${currentSrc} -> ${ok ? 'OK' : 'FAIL'} (expected suffix ${expectSuffix}.mp4)`)
  if (!ok) failed++
  await page.close()
}

async function checkReducedMotion() {
  const page = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } })
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  const count = await page.locator('video.quest-scene__video').count()
  const ok = count === 0
  console.log(`reduced-motion: video elements=${count} -> ${ok ? 'OK' : 'FAIL'} (expected 0)`)
  if (!ok) failed++
  await page.close()
}

await checkTheme('dark', '-night')
await checkTheme('light', '-day')
await checkReducedMotion()

await browser.close()
console.log(failed ? `quest-video-check: ${failed} failure(s)` : 'quest-video-check: ok')
process.exit(failed ? 1 : 0)
