import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { buildStoreContent } from '@/lib/store/store-content'

export const metadata: Metadata = { title: 'Спасибо — Точка Сборки' }

export default function Page() {
  const c = buildStoreContent('ru')
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1>{c.thanksTitle}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{c.thanksBody}</p>
      </main>
    </>
  )
}
