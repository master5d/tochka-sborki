import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { FeedbackForm } from '@/components/feedback-form'

export const metadata: Metadata = {
  title: 'Фидбек — Точка Сборки',
  description: 'Обратная связь по курсу',
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
          fontSize: 'clamp(2rem, 5vw, 3rem)',
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
        <FeedbackForm />
      </main>
    </>
  )
}
