import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const HERE = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(HERE, 'certificate-page.tsx'), 'utf8')
const certData = readFileSync(join(HERE, '..', '..', 'lib', 'course', 'certificate.ts'), 'utf8')

describe('certificate page — academy admission wiring (S4)', () => {
  it('requests the admission fire-and-forget', () => {
    expect(src).toContain("/api/academy/admission")
    expect(src).toContain("credentials: 'include'")
    expect(src).toMatch(/\.catch\(\(\) => \{\}\)/)
  })

  it('certificate data no longer claims the ticket is symbolic', () => {
    expect(certData).not.toMatch(/SYMBOLIC/i)
    expect(certData).toContain('granted server-side')
  })
})
