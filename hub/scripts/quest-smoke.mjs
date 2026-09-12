// Static-export smoke: run after `npm run build`. Exit 1 on any miss.
// Layout (spec 2026-09-11-site-covers-floor-ab): the floor is the home page,
// the quest is a trend cover at a hidden, noindex, unlinked path.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const COVER = 'trend-adweek-2026-09'
const ROBOTS_NOINDEX = /<meta name="robots" content="noindex/

const coverChecks = {
  [`out/cover/${COVER}/index.html`]: ['Два года по side quest', 'Скроллер', 'open · бесплатно', '© 2026 · mamaev.coach · ⬡ vibe in motion'],
  [`out/en/cover/${COVER}/index.html`]: ['Two years of side quests', 'the Scroller', 'open · free', '© 2026 · mamaev.coach · ⬡ vibe in motion'],
}
const floorChecks = {
  'out/index.html': ['Усиливать голос, не заменять', 'Точка Сборки', 'open · бесплатно'],
  'out/en/index.html': ['Amplify the voice', 'Tochka Sborki', 'open · free'],
}
let failed = 0
const read = (file) => readFileSync(join(process.cwd(), file), 'utf8')

for (const [file, needles] of Object.entries(coverChecks)) {
  const html = read(file)
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
  // The cover is a showcase at a hidden path: never indexable there.
  if (!ROBOTS_NOINDEX.test(html)) { console.error(`${file}: cover page lacks robots noindex`); failed++ }
}

for (const [file, needles] of Object.entries(floorChecks)) {
  const html = read(file)
  for (const n of needles) if (!html.includes(n)) { console.error(`${file}: floor missing "${n}"`); failed++ }
  if (ROBOTS_NOINDEX.test(html)) { console.error(`${file}: floor must stay indexable`); failed++ }
}

for (const [file, lang] of [['out/index.html', 'ru'], ['out/en/index.html', 'en'], [`out/cover/${COVER}/index.html`, 'ru'], [`out/en/cover/${COVER}/index.html`, 'en']]) {
  if (!read(file).includes(`lang="${lang}"`)) { console.error(`${file}: missing lang="${lang}"`); failed++ }
}

// No visitor switcher: nothing anywhere in the export may link to a cover path.
function walk(dir) {
  let files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) files = files.concat(walk(full))
    else if (entry.endsWith('.html')) files.push(full)
  }
  return files
}
for (const file of walk(join(process.cwd(), 'out'))) {
  if (/href="(\/en)?\/cover\//.test(readFileSync(file, 'utf8'))) { console.error(`${file}: links to a cover path`); failed++ }
}

// The Function must only wake for the two home paths.
if (!existsSync(join(process.cwd(), 'out/_routes.json'))) { console.error('out/_routes.json missing'); failed++ }

console.log(failed ? `smoke: ${failed} miss(es)` : 'smoke: ok')
process.exit(failed ? 1 : 0)
