import type { Metadata } from 'next'
import { StoreGrid } from '@/components/store/store-grid'
import { buildStoreContent } from '@/lib/store/store-content'

export const metadata: Metadata = { title: 'Store — Alexander Mamaev', description: 'Digital goods by the author.' }

export default function Page() {
  const c = buildStoreContent('en')
  return (
    <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontSize: '0.75rem' }}>{c.eyebrow}</p>
      <h1 style={{ marginTop: '0.5rem' }}>{c.title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>{c.lead}</p>
      <StoreGrid locale="en" />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2.5rem' }}>{c.footnote}</p>
    </main>
  )
}
