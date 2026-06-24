import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CaptureForm } from '@/components/capture-form'
import { getEvent, EVENTS } from '@/lib/events'

export function generateStaticParams() {
  return Object.keys(EVENTS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const e = getEvent(slug, 'en')
  if (!e) return { title: 'Event — Alexander Mamaev' }
  return { title: `${e.title} — ${e.format}`, description: e.summary }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEvent(slug, 'en')
  if (!e) notFound()

  return (
    <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontSize: '0.75rem' }}>
        {e.eyebrow}
      </p>
      <h1 style={{ marginTop: '0.5rem' }}>{e.title}</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>{e.summary}</p>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', margin: '2rem 0', fontSize: '0.9rem' }}>
        <dt style={{ color: 'var(--text-secondary)' }}>Format</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.format}</dd>
        <dt style={{ color: 'var(--text-secondary)' }}>Where</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.locationLabel}</dd>
        <dt style={{ color: 'var(--text-secondary)' }}>When</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.whenLabel}</dd>
        <dt style={{ color: 'var(--text-secondary)' }}>Host</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.facilitator}</dd>
      </dl>

      <h2 style={{ fontSize: '1.1rem' }}>What to expect</h2>
      <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.2rem', marginBottom: '2.5rem' }}>
        {e.whatToExpect.map((item, i) => <li key={i}>{item}</li>)}
      </ul>

      <CaptureForm config={e.capture} locale="en" />
    </main>
  )
}
