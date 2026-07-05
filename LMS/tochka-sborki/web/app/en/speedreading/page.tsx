import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SpeedreadingSyllabus } from '@/components/speedreading-syllabus'

export const metadata: Metadata = {
  title: 'Speed Reading — Tochka Sborki',
  description: 'A speed-reading course (in preparation).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <SpeedreadingSyllabus locale="en" />
      </main>
    </>
  )
}
