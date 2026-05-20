'use client'
import { useEffect, useState } from 'react'
import { QUESTIONS, MODULE_INTROS } from '@/lib/intake/questions'
import { visibleQuestions } from '@/lib/intake/visible'
import { QuestionRenderer } from './question-renderer'
import type { Answers, AnswerValue, Locale } from '@/lib/intake/types'

export function IntakeWizard({ locale }: { locale: Locale }) {
  const [answers, setAnswers] = useState<Answers>({})
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.answers) { setAnswers(JSON.parse(d.answers)); setStep(d.current_step ?? 0) } })
      .catch(() => {})
  }, [])

  const visible = visibleQuestions(QUESTIONS, answers)
  const total = visible.length

  // Keep step within range if the visible set shrinks (e.g. conditional questions).
  useEffect(() => {
    if (step > total - 1) setStep(Math.max(0, total - 1))
  }, [total, step])

  const q = visible[Math.min(step, total - 1)]

  function persist(a: Answers, s: number) {
    fetch('/api/intake/progress', { method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: a, currentStep: s }) }).catch(() => {})
  }

  // Update answer locally only; progress is persisted on step changes (not per keystroke).
  function setAnswer(v: AnswerValue) {
    setAnswers(prev => ({ ...prev, [q.id]: v }))
  }

  function goTo(nextStep: number) {
    const s = Math.max(0, Math.min(nextStep, total - 1))
    setStep(s)
    persist(answers, s)
  }

  async function finish() {
    setSubmitting(true)
    const res = await fetch('/api/intake/submit', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) })
    if (res.ok) { const { redirect } = await res.json(); window.location.replace(locale === 'en' ? '/en' + redirect : redirect) }
    else setSubmitting(false)
  }

  if (!q) return null
  const isLast = step === total - 1
  const answered = answers[q.id] != null && answers[q.id] !== '' && !(Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0)
  const moduleTitle = MODULE_INTROS.find(m => m.id === q.module)?.title[locale] ?? ''

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '4rem 1.5rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--text-secondary)' }}>
        {moduleTitle} · {step + 1}/{total}
      </div>
      <div style={{ height: 4, background: 'var(--border-color)', borderRadius: 2, margin: '.5rem 0 1.5rem' }}>
        <div style={{ height: '100%', width: `${((step + 1) / total) * 100}%`, background: 'var(--text-accent)', borderRadius: 2 }} />
      </div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.2rem' }}>{q.prompt[locale]}</h1>
      <QuestionRenderer question={q} locale={locale} value={answers[q.id]} onChange={setAnswer} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button disabled={step === 0} onClick={() => goTo(step - 1)}>← {locale === 'en' ? 'Back' : 'Назад'}</button>
        {isLast
          ? <button disabled={(q.required && !answered) || submitting} onClick={finish}>{locale === 'en' ? 'Finish →' : 'Завершить →'}</button>
          : <button disabled={q.required && !answered} onClick={() => goTo(step + 1)}>{locale === 'en' ? 'Next →' : 'Далее →'}</button>}
      </div>
    </main>
  )
}
