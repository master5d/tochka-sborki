import type { Metadata } from 'next'
import { buildStoreContent } from '@/lib/store/store-content'

export const metadata: Metadata = { title: 'Thank you — Alexander Mamaev', robots: { index: false, follow: false } }

export default function Page() {
  const c = buildStoreContent('en')
  return (
    <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <h1>{c.thanksTitle}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>{c.thanksBody}</p>
    </main>
  )
}
