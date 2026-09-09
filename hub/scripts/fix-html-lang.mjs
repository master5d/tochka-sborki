// Post-build fix: Next.js App Router only lets the ROOT layout render <html>, so app/layout.tsx's
// hardcoded lang="ru" ships on /en/ pages too. Deterministically rewrite it after export, rather
// than patching lang client-side (client JS would leave a wrong lang in the initial static HTML).
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(process.cwd(), 'out', 'en')

function walk(dir) {
  let files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) files = files.concat(walk(full))
    else if (entry.endsWith('.html')) files.push(full)
  }
  return files
}

let rewritten = 0
for (const file of walk(root)) {
  const html = readFileSync(file, 'utf8')
  const fixed = html.replace(/<html([^>]*?)lang="ru"/, '<html$1lang="en"')
  if (fixed !== html) {
    writeFileSync(file, fixed, 'utf8')
    rewritten++
  }
}

console.log(`fix-html-lang: rewrote ${rewritten} file(s) under out/en/`)
process.exit(rewritten === 0 ? 1 : 0)
