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
  // Wave K: a split scene (01-map, 02-camp, 06-wall, 07-signs) renders two plate
  // stills (quest/plates/<id>-<state>-{sky,land}.webp) instead of a flat poster —
  // both reference forms count toward the same "distinct scene id" tally, and
  // either one satisfies the night-reference check.
  const sceneMatches = html.match(/\/quest\/scenes\/(0\d-[a-z]+)-(day|night)\.webp/g) ?? []
  const plateMatches = html.match(/\/quest\/plates\/(0\d-[a-z]+)-(day|night)-(sky|land)\.webp/g) ?? []
  const scenes = new Set([...sceneMatches, ...plateMatches].map((m) => m.match(/0\d-[a-z]+/)[0]))
  if (scenes.size < 7) { console.error(`${file}: only ${scenes.size} distinct scene posters, expected ≥ 7`); failed++ }
  const hasNight = sceneMatches.some((m) => m.endsWith('-night.webp')) || plateMatches.some((m) => m.includes('-night-'))
  if (!hasNight) { console.error(`${file}: no night poster reference found (picture/source for system-dark)`); failed++ }
  for (const n of needles) if (!html.includes(n)) { console.error(`${file}: missing "${n}"`); failed++ }
  if (/\[(scene|loop|сцена|петля):/.test(html)) { console.error(`${file}: service mark leaked`); failed++ }
  // L2/L3: six outcome illustrations and three detour curtains per locale; the
  // generation manifest's own marks ("Outcome of the …") must never reach the page.
  const outcomes = new Set(html.match(/\/quest\/outcomes\/(boulder|temple|gates)-(scroller|builder)-day\.webp/g) ?? [])
  if (outcomes.size !== 6) { console.error(`${file}: ${outcomes.size} outcome illustrations, expected 6`); failed++ }
  const detours = new Set(html.match(/\/quest\/detours\/(boulder|temple|gates)-day\.webp/g) ?? [])
  if (detours.size !== 3) { console.error(`${file}: ${detours.size} detour curtains, expected 3`); failed++ }
  if (/Outcome of the (habit|detour)|Detour world at the|\bthe Builder on top of\b/i.test(html)) { console.error(`${file}: generation mark leaked`); failed++ }
}
{
  const ru = readFileSync(join(process.cwd(), 'out/index.html'), 'utf8')
  if (!ru.includes('lang="ru"')) { console.error('out/index.html: missing lang="ru"'); failed++ }
  const en = readFileSync(join(process.cwd(), 'out/en/index.html'), 'utf8')
  if (!en.includes('lang="en"')) { console.error('out/en/index.html: missing lang="en"'); failed++ }
}
console.log(failed ? `smoke: ${failed} miss(es)` : 'smoke: ok')
process.exit(failed ? 1 : 0)
