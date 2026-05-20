// scripts/gen-skins.mjs
// Dev-time only. Generates web/lib/rpg/skins/<skin>.json via Gemini.
// Usage: GEMINI_API_KEY=... node scripts/gen-skins.mjs [skin1 skin2 ...]
import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const KEY = process.env.GEMINI_API_KEY
if (!KEY) { console.error('Set GEMINI_API_KEY'); process.exit(1) }

const MODULE_SLUGS = [
  '00-kickstart','01-introduction','02-setup-guide','03-stack-selection',
  '04-prompt-engineering','05-context-memory','06-audio-pipeline','07-tools','08-agent-engineering',
]

// Read real module titles (RU) for grounding.
function moduleTitles() {
  const out = {}
  for (const slug of MODULE_SLUGS) {
    const meta = JSON.parse(readFileSync(join(ROOT, 'web/content/ru', slug, '_meta.json'), 'utf8'))
    out[slug] = { title: meta.title, description: meta.description }
  }
  return out
}

const SKIN_TONES = {
  'slavic-myth': 'warm Slavic folklore, house-spirit (домовой) metaphors, oral-storytelling, unhurried',
  'dark-fantasy': 'serious, atmospheric, morally complex, earned gravitas',
  'cyber-noir': 'dry, precise, ironic, urban, zero fluff',
  'space-opera': 'epic, expansive, optimistic, mission/crew framing',
  'anime-quest': 'high-energy, training-arc, celebratory, urgent',
  'soviet-heroic': 'dry collective humor, смекалка, pragmatic, anti-glamour',
  'mystic-arcane': 'symbolic, intuitive, arcane/spell metaphors',
}

async function gen(skin) {
  const titles = moduleTitles()
  const prompt = [
    `You localize an AI course into an RPG "world skin". Skin: ${skin}. Tone: ${SKIN_TONES[skin]}.`,
    `For EACH of these 9 modules, invent a short zone name and a quest title in that tone, in BOTH Russian and English.`,
    `Modules (slug → real title): ${JSON.stringify(titles)}`,
    `Russian is primary; keep technical terms (API, prompt, agent, MCP) untranslated. Keep names short (zone ≤ 3 words, quest ≤ 7 words).`,
    `Return STRICT JSON: {"zoneNames":{"<slug>":{"ru","en"}},"questTitles":{"<slug>":{"ru","en"}}} covering all 9 slugs.`,
  ].join('\n')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${KEY}`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.85 } }) })
  if (!res.ok) throw new Error(`${skin}: gemini ${res.status}`)
  const data = await res.json()
  const parsed = JSON.parse(data.candidates[0].content.parts[0].text)
  const pack = { skin, zoneNames: parsed.zoneNames, questTitles: parsed.questTitles }
  // validate coverage
  for (const slug of MODULE_SLUGS) {
    if (!pack.zoneNames?.[slug]?.ru || !pack.questTitles?.[slug]?.ru) throw new Error(`${skin}: missing ${slug}`)
  }
  writeFileSync(join(ROOT, 'web/lib/rpg/skins', `${skin}.json`), JSON.stringify(pack, null, 2) + '\n')
  console.log(`✓ ${skin}`)
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SKIN_TONES)
for (const s of targets) { try { await gen(s) } catch (e) { console.error('✗', e.message) } }
