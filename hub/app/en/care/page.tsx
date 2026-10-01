import type { Metadata } from 'next'
import { CareDesk } from '@/components/care-form'
import { careCopy } from '@/lib/care'

const c = careCopy('en')

export const metadata: Metadata = { title: 'Care desk — Alexander Mamaev', description: c.lead }

export default function Page() {
  return (
    <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontSize: '0.75rem' }}>{c.eyebrow}</p>
      <h1 style={{ marginTop: '0.5rem' }}>{c.title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>{c.lead}</p>
      <CareDesk locale="en" />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2.5rem' }}>
        {c.relatedLabel}: {c.related.map((r, i) => (
          <span key={r.href}>{i > 0 && ' · '}<a href={r.href} style={{ color: 'var(--text-accent)' }}>{r.label}</a> — {r.note}</span>
        ))}
      </p>
    </main>
  )
}
