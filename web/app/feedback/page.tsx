import type { Metadata } from 'next'
import { Nav } from '@/components/nav'

export const metadata: Metadata = {
  title: 'Фидбек — Точка Сборки',
  description: 'Оставь отзыв о курсе',
}

const LIKERT = ['1', '2', '3', '4', '5']

function LikertScale({ name, label }: { name: string; label: string }) {
  return (
    <fieldset style={{ border: 'none', marginBottom: '2rem' }}>
      <legend style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>
        {label}
      </legend>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '5rem' }}>Не согласен</span>
        {LIKERT.map(v => (
          <label key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
            <input type="radio" name={name} value={v} required style={{ accentColor: 'var(--text-accent)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}</span>
          </label>
        ))}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '4rem' }}>Согласен</span>
      </div>
    </fieldset>
  )
}

export default function FeedbackPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          ⬡ Фидбек
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.95,
          marginBottom: '1rem',
        }}>
          Оцени<br />курс
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.75 }}>
          Твой отзыв помогает курсу самообновляться. 2 минуты — и урок станет лучше для следующего студента.
        </p>

        <form action="#" method="POST" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Q1: select lesson */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Какую встречу ты только что прошёл?
            </label>
            <select name="lesson" required style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius)',
              fontSize: '0.9rem',
            }}>
              <option value="">— выбери встречу —</option>
              {['Meeting 0: Kickstart', 'Meeting 1: Знакомство', 'Meeting 2: Сетап',
                'Meeting 3: Промпты', 'Meeting 4: Контекст', 'Meeting 5: Pipeline',
                'Meeting 6: Инструменты'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Q2-Q4: Likert scales */}
          <LikertScale name="recommend" label='"Я бы порекомендовал этот курс другим."' />
          <LikertScale name="impact" label='"То, что я узнал, положительно повлияет на мою работу."' />
          <LikertScale name="apply" label='"Я смогу применить это на практике уже сейчас."' />

          {/* Q5: open text */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Что было непонятно или что стоит улучшить?
            </label>
            <textarea name="unclear" rows={4} style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius)',
              fontSize: '0.9rem',
              resize: 'vertical',
            }} />
          </div>

          {/* Q6: open text */}
          <div style={{ marginBottom: '2.5rem' }}>
            <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Любые другие мысли (опционально)
            </label>
            <textarea name="other" rows={3} style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius)',
              fontSize: '0.9rem',
              resize: 'vertical',
            }} />
          </div>

          <button type="submit" style={{
            padding: '0.875rem 2.5rem',
            background: 'var(--text-accent)',
            color: '#000',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderRadius: 'var(--radius)',
            border: 'none',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}>
            Отправить →
          </button>
        </form>
      </main>
    </>
  )
}
