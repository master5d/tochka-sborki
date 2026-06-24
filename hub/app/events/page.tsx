import type { Metadata } from 'next'
import Link from 'next/link'
import { listEvents } from '@/lib/events'

export const metadata: Metadata = {
  title: 'События — Александр Мамаев',
  description: 'Оффлайн-ретриты, буткемпы и воркшопы.',
}

export default function Page() {
  const events = listEvents('ru')
  return (
    <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontSize: '0.75rem' }}>
        События
      </p>
      <h1 style={{ marginTop: '0.5rem' }}>Живые встречи</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        Оффлайн-ретриты и воркшопы — небольшие группы, живой разговор, прикладная практика.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {events.map((e) => (
          <li key={e.slug}>
            <Link href={`/events/${e.slug}/`} style={{
              display: 'block',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-secondary)',
              padding: '1.5rem',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-accent)' }}>
                {e.format}
              </span>
              <h2 style={{ margin: '0.4rem 0', color: 'var(--text-primary)' }}>{e.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>{e.summary}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.75rem', marginBottom: 0 }}>
                {e.locationLabel} · {e.whenLabel}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
