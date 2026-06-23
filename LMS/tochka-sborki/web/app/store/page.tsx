import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { StoreGrid } from '@/components/store/store-grid'
import { buildStoreContent } from '@/lib/store/store-content'

export const metadata: Metadata = { title: 'Магазин — Точка Сборки', description: 'Цифровые товары от автора курса.' }

export default function Page() {
  const c = buildStoreContent('ru')
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', margin: 0 }}>{c.eyebrow}</p>
        <h1 style={{ marginTop: '0.5rem' }}>{c.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{c.lead}</p>
        <StoreGrid locale="ru" />
      </main>
    </>
  )
}
