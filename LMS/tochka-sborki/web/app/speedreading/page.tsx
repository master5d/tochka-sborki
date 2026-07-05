import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SpeedreadingSyllabus } from '@/components/speedreading-syllabus'

export const metadata: Metadata = {
  title: 'Скорочтение — Точка Сборки',
  description: 'Курс скорочтения (готовится).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <SpeedreadingSyllabus locale="ru" />
      </main>
    </>
  )
}
