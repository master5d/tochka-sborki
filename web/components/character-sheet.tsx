'use client'
import { useEffect, useState } from 'react'
import { ATTRIBUTES } from '@/lib/intake/attributes'
import type { Locale } from '@/lib/intake/types'

export function CharacterSheet({ locale }: { locale: Locale }) {
  const [p, setP] = useState<any>(null)
  useEffect(() => { fetch('/api/intake/me', { credentials: 'include' })
    .then(r => r.ok ? r.json() : null).then(setP).catch(() => {}) }, [])
  if (!p) return null
  const scores: Record<string, number> = { INT: p.int_score, WIS: p.wis_score, CON: p.con_score, DEX: p.dex_score, CHA: p.cha_score, STR: p.str_score }
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.66rem', color: 'var(--text-accent)', textTransform: 'uppercase' }}>
        {p.world_skin} · {p.char_class} · {locale === 'en' ? 'Level' : 'Уровень'} {p.char_level}
      </div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 900, margin: '.4rem 0 1.4rem' }}>{p.legendary_title}</h1>
      {ATTRIBUTES.map(a => (
        <div key={a.code} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '.74rem' }}>
            <span>{a.emoji} {a.name[locale]} <em style={{ color: 'var(--text-secondary)', fontSize: '.62rem' }}>{a.code}</em></span>
            <b style={{ color: 'var(--text-accent)' }}>{scores[a.code]} / {a.max}</b>
          </div>
          <div style={{ fontSize: '.74rem', color: 'var(--text-secondary)', margin: '.2rem 0' }}>{a.meaning[locale]}</div>
          <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${(scores[a.code] / a.max) * 100}%`, background: 'var(--text-accent)', borderRadius: 3 }} />
          </div>
        </div>
      ))}
      {[['backstory', p.backstory], ['first_quest', p.first_quest], ['final_boss', p.final_boss]].map(([k, v]) => (
        <div key={k as string} style={{ borderLeft: '3px solid var(--text-accent)', paddingLeft: '.9rem', margin: '1rem 0' }}>{v}</div>
      ))}
    </main>
  )
}
