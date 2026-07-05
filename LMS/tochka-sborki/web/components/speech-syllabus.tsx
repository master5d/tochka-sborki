import type { Locale } from '@/lib/dictionaries'
import { resolveSpeechCourse } from '@/lib/speech/course'

export function SpeechSyllabus({ locale }: { locale: Locale }) {
  const c = resolveSpeechCourse(locale)
  const badge = locale === 'en' ? 'in preparation' : 'готовится'
  const intro = locale === 'en'
    ? 'This course is in preparation. Here is the shape it will take.'
    : 'Курс готовится. Вот структура, которую он примет.'
  return (
    <section style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', background: 'var(--bg-surface)', marginBottom: '2.5rem' }}>
      <h1 style={{ margin: '0 0 .5rem', fontSize: '1.4rem', color: 'var(--text-primary)' }}>{c.title}</h1>
      <p style={{ margin: '0 0 1rem', fontSize: '.95rem', lineHeight: 1.55, color: 'var(--text-primary)', borderLeft: '3px solid var(--text-accent)', paddingLeft: '.8rem' }}>{c.tagline}</p>
      <p style={{ margin: '0 0 1.25rem', fontSize: '.85rem', color: 'var(--text-secondary)' }}>{intro}</p>
      <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '.7rem' }}>
        {c.lessons.map((l) => (
          <li key={l.slug} style={{ fontSize: '.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{l.title}</span>
            <span style={{ marginLeft: '.5rem', fontFamily: 'var(--font-mono)', fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-accent)', border: '1px solid var(--border-color)', borderRadius: 6, padding: '.05rem .4rem' }}>{badge}</span>
            <div>{l.objective}</div>
          </li>
        ))}
      </ol>
    </section>
  )
}
