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
  const sceneMatches = html.match(/\/quest\/scenes\/(0\d-[a-z]+)-(day|night)\.webp/g) ?? []
  const scenes = new Set(sceneMatches.map((m) => m.match(/0\d-[a-z]+/)[0]))
  if (scenes.size < 7) { console.error(`${file}: only ${scenes.size} distinct scene posters, expected ≥ 7`); failed++ }
  if (!sceneMatches.some((m) => m.endsWith('-night.webp'))) { console.error(`${file}: no night poster reference found (picture/source for system-dark)`); failed++ }
  for (const n of needles) if (!html.includes(n)) { console.error(`${file}: missing "${n}"`); failed++ }
  if (/\[(scene|loop|сцена|петля):/.test(html)) { console.error(`${file}: service mark leaked`); failed++ }
}
{
  const ru = readFileSync(join(process.cwd(), 'out/index.html'), 'utf8')
  if (!ru.includes('lang="ru"')) { console.error('out/index.html: missing lang="ru"'); failed++ }
  const en = readFileSync(join(process.cwd(), 'out/en/index.html'), 'utf8')
  if (!en.includes('lang="en"')) { console.error('out/en/index.html: missing lang="en"'); failed++ }
}
console.log(failed ? `smoke: ${failed} miss(es)` : 'smoke: ok')
process.exit(failed ? 1 : 0)
