// Wave E acceptance: confirm the quest page's <video> loop follows the reader's
// theme, and that reduced motion never loads a video at all.
//
// This is a LOCAL ACCEPTANCE TOOL, not part of the build or CI (same contract as
// quest-shots.mjs): Playwright is not a hub dependency; it resolves from
// whatever cwd already has it installed (NAUTILUS/C:\telo in this lab).
//
// Usage: node scripts/quest-video-check.mjs <baseUrl> [path]  (default: the trend cover's hidden page)
import { chromium } from 'playwright'
import { checkPixels } from './quest-pixels.mjs'

const [base, path = '/cover/trend-adweek-2026-09/'] = process.argv.slice(2)
if (!base) { console.error('usage: quest-video-check.mjs <baseUrl>'); process.exit(2) }

const browser = await chromium.launch()
let failed = 0

async function checkTheme(colorScheme, expectSuffix) {
  const page = await browser.newPage({ colorScheme, viewport: { width: 1280, height: 900 } })
  await page.goto(base + path, { waitUntil: 'networkidle' })
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
  await page.goto(base + path, { waitUntil: 'networkidle' })
  const count = await page.locator('video.quest-scene__video').count()
  const ok = count === 0
  console.log(`reduced-motion: video elements=${count} -> ${ok ? 'OK' : 'FAIL'} (expected 0)`)
  if (!ok) failed++
  await page.close()
}

// Fix round (audit4 blocker): no quest text block may hide its own copy behind an
// inner scrollbar (the mobile hero hid 3 of 4 paragraphs that way). Any element
// in <main> that scrolls on its own AND holds prose fails, on both viewports.
async function checkNoInnerScroll(width, height) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(base + path, { waitUntil: 'networkidle' })
  const offenders = await page.evaluate(() =>
    [...document.querySelectorAll('main *')]
      .filter((el) => {
        const oy = getComputedStyle(el).overflowY
        return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1 && el.querySelector('p, h1, h2, h3')
      })
      .map((el) => `${el.className || el.tagName} (${el.scrollHeight}>${el.clientHeight})`),
  )
  const ok = offenders.length === 0
  console.log(`inner-scroll ${width}x${height}: ${ok ? 'OK' : 'FAIL ' + offenders.join(', ')}`)
  if (!ok) failed++
  await page.close()
}

await checkNoInnerScroll(390, 844)
await checkNoInnerScroll(1440, 900)
await checkTheme('dark', '-night')
await checkTheme('light', '-day')
await checkReducedMotion()
// 2026-09-12 pixel audit: no one-axis stretch anywhere (hard); upscale/crop reported,
// hard only with STRICT_PIXELS=1 once the 2K world is in (scripts/quest-pixels.mjs).
failed += await checkPixels(browser, base, path, { strict: process.env.STRICT_PIXELS === '1' })

await browser.close()
console.log(failed ? `quest-video-check: ${failed} failure(s)` : 'quest-video-check: ok')
process.exit(failed ? 1 : 0)
