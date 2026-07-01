// lib/authoring/review.ts
// S4 of the course-authoring engine: a deterministic readability lint (the "review pass"
// as an executable gate) + (Task 2) a polish PROMPT the author's agent uses to tighten prose.
// No live LLM. Pure. Run alongside S3's validateDraftMdx.

const MAX_SENTENCE_WORDS = 25
const MIN_PRACTICE_CHARS = 20
const PHASES = ['activation', 'reflection', 'concept', 'practice'] as const

function phaseBody(mdx: string, type: string): string {
  return new RegExp(`<Phase type="${type}">([\\s\\S]*?)</Phase>`).exec(mdx)?.[1] ?? ''
}

// Prose lines = phase body lines minus structural ones (Phase tags, MDX comments, headers),
// with a leading bullet (`- `) or callout (`> `) marker stripped. Checked per line so that
// bullets (which lack terminal punctuation) are never joined into one giant "sentence".
function phaseProseLines(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !/^<\/?Phase/.test(l) && !/^\{\/\*/.test(l) && !/^#/.test(l))
    .map(l => l.replace(/^-\s+/, '').replace(/^>\s*/, '').trim())
    .filter(Boolean)
}

export function lintReadability(mdx: string): string[] {
  const findings: string[] = []
  for (const type of PHASES) {
    const body = phaseBody(mdx, type)
    if (body.trim().length === 0) { findings.push(`${type}: empty phase body`); continue }
    if (/\bTODO\b/.test(body)) findings.push(`${type}: leftover TODO`)

    const lines = phaseProseLines(body)
    for (const line of lines) {
      for (const sentence of line.split(/[.!?…]+/)) {
        const n = sentence.trim().split(/\s+/).filter(Boolean).length
        if (n > MAX_SENTENCE_WORDS) findings.push(`${type}: long sentence (${n} words)`)
      }
    }
    if (type === 'practice' && lines.join(' ').length < MIN_PRACTICE_CHARS) {
      findings.push('practice: too vague — needs a concrete applied step')
    }
  }
  return findings
}
