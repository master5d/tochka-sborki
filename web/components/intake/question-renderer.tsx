'use client'
import type { Question, AnswerValue, Locale } from '@/lib/intake/types'

interface Props { question: Question; locale: Locale; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }

export function QuestionRenderer({ question: q, locale, value, onChange }: Props) {
  const t = (x: { ru: string; en: string }) => x[locale]
  if (q.format === 'text')
    return <textarea value={(value as string) ?? ''} onChange={e => onChange(e.target.value)}
      placeholder="…" style={{ width: '100%', minHeight: 90 }} />
  if (q.format === 'number')
    return <input type="number" value={(value as number) ?? ''} onChange={e => onChange(Number(e.target.value))} />
  if (q.format === 'likert')
    return <div style={{ display: 'flex', gap: 8 }}>{[1,2,3,4,5].map(n =>
      <button key={n} onClick={() => onChange(n)} aria-pressed={value === n}
        style={{ fontWeight: value === n ? 700 : 400 }}>{n}</button>)}</div>
  const selected = q.format === 'multi' ? ((value as string[]) ?? []) : value
  return <div>{q.options!.map(o => {
    const on = q.format === 'multi' ? (selected as string[]).includes(o.value) : selected === o.value
    return <button key={o.value} aria-pressed={on}
      onClick={() => q.format === 'multi'
        ? onChange(on ? (selected as string[]).filter(v => v !== o.value) : [...(selected as string[]), o.value])
        : onChange(o.value)}
      style={{ display: 'block', width: '100%', textAlign: 'left', fontWeight: on ? 700 : 400 }}>
      {t(o.label)}</button>
  })}</div>
}
