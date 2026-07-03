#!/usr/bin/env node
// Sovereign manifesto prompt-emitter for the S.A.S.H.A academy.
// Prints a prompt for the OWNER's agent (no live LLM call anywhere): run it,
// paste the output into your agent, then paste the resulting manifesto into
// hub/lib/dictionaries.ts (academy.positioning, both locales).
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const registry = JSON.parse(readFileSync(join(repoRoot, 'LMS', 'registry.json'), 'utf8'))
const { name, fullName } = registry.academy
const courses = registry.courses
  .map((c) => `- ${c.name.ru} / ${c.name.en} (${c.status})`)
  .join('\n')

console.log(`You are drafting the public manifesto for ${name} — ${fullName.en}.

CONTEXT
Academy: ${name} (${fullName.ru})
Courses today:
${courses}
Frame: ancient wisdom × modern science and AI tools. A family of courses over one engine; each course is a world of its own, the door in is shared.

TASK
Write the academy manifesto in TWO languages (Russian first, then English): 3-5 short paragraphs each, first person plural, warm and specific.

HARD CONSTRAINTS
- No urgency or scarcity (no countdowns, no "limited", no "only today").
- No testimonials, credentials-flexing, or grand titles.
- No religious iconography and no appropriating a specific tradition — keep the cosmos abstract.
- No promises that cannot be kept; modest, honest tone.
- Plain language over guru language.

PLACEMENT
Paste the final paragraphs into hub/lib/dictionaries.ts → academy.positioning (the ru array and the en array), replacing the skeleton copy. Keep academy.metaTitle / academy.metaDescription in sync if the framing shifts.`)
