'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import type { Locale } from '@/lib/dictionaries'

interface Entry { niche: string | null; contact: string | null; blurb: string | null }

const NICHE_LABEL: Record<string, { ru: string; en: string }> = {
  coach: { ru: 'Коучинг и психотерапия', en: 'Coaching & therapy' },
  massage: { ru: 'Телесные практики', en: 'Bodywork' },
  astrology: { ru: 'Астрология и духовные практики', en: 'Astrology & spiritual' },
  content: { ru: 'Контент и блогинг', en: 'Content & blogging' },
  ecommerce: { ru: 'Электронная торговля', en: 'E-commerce' },
  service: { ru: 'Сервисный бизнес', en: 'Service business' },
  tech: { ru: 'Технологии', en: 'Tech' },
}

export function AlumniClient({ locale }: { locale: Locale }) {
  const router = useRouter()
  const en = locale === 'en'
  const [list, setList] = useState<Entry[]>([])
  const [optin, setOptin] = useState(false)
  const [contact, setContact] = useState('')
  const [blurb, setBlurb] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/alumni/me', { credentials: 'include' })
      .then(r => { if (r.status === 401) { router.replace(en ? '/en/login/' : '/login/'); return null } return r.ok ? r.json() : null })
      .then(me => { if (me) { setOptin(!!me.optin); setContact(me.contact ?? ''); setBlurb(me.blurb ?? '') } })
      .catch(() => {})
    fetch('/api/alumni', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { alumni: [] })
      .then(d => { setList(d.alumni ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [router, en])

  const t = en
    ? { title: 'Alumni', sub: 'An opt-in directory of fellow learners — grouped by field, so you can find people building near you. Your email is never shown.', optinLabel: 'List me in the directory', contact: 'How to reach you (handle / link)', blurb: 'One line — what you\'re building or want to connect on', save: 'Save', saved: 'Saved ✓', empty: 'No one has opted in yet. Be the first.', other: 'Other' }
    : { title: 'Выпускники', sub: 'Opt-in справочник соучеников — по сферам, чтобы найти тех, кто строит рядом. Твой email никогда не показывается.', optinLabel: 'Показывать меня в справочнике', contact: 'Как с тобой связаться (ник / ссылка)', blurb: 'Одна строка — что строишь или о чём хочешь связаться', save: 'Сохранить', saved: 'Сохранено ✓', empty: 'Пока никто не открылся. Будь первым.', other: 'Другое' }

  async function save() {
    const r = await fetch('/api/alumni/optin', {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optin, contact, blurb }),
    })
    if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); const d = await fetch('/api/alumni', { credentials: 'include' }).then(x => x.json()).catch(() => null); if (d) setList(d.alumni ?? []) }
  }

  const groups = list.reduce<Record<string, Entry[]>>((acc, e) => {
    const k = e.niche ?? 'other'; (acc[k] ??= []).push(e); return acc
  }, {})
  const nicheLabel = (k: string) => k === 'other' ? t.other : (NICHE_LABEL[k]?.[en ? 'en' : 'ru'] ?? k)

  const input: React.CSSProperties = { width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 14 }

  return (
    <>
      <Nav locale={locale} />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{t.title}</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '56ch' }}>{t.sub}</p>

        <section style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', background: 'var(--bg-surface)', marginBottom: '2.5rem' }}>
          <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', cursor: 'pointer', marginBottom: '1rem' }}>
            <input type="checkbox" checked={optin} onChange={e => setOptin(e.target.checked)} />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.optinLabel}</span>
          </label>
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            <input style={input} value={contact} onChange={e => setContact(e.target.value)} placeholder={t.contact} maxLength={120} />
            <input style={input} value={blurb} onChange={e => setBlurb(e.target.value)} placeholder={t.blurb} maxLength={200} />
            <button onClick={save} style={{ ...input, width: 'auto', cursor: 'pointer', fontWeight: 700, color: 'var(--text-on-accent)', background: 'var(--text-accent)', border: 'none' }}>{saved ? t.saved : t.save}</button>
          </div>
        </section>

        {loaded && list.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>{t.empty}</p>}
        {Object.entries(groups).map(([k, entries]) => (
          <div key={k} style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-accent)', marginBottom: '0.6rem' }}>{nicheLabel(k)}</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.6rem' }}>
              {entries.map((e, i) => (
                <li key={i} style={{ borderLeft: '3px solid var(--border-color)', paddingLeft: '0.8rem' }}>
                  {e.blurb && <div style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>{e.blurb}</div>}
                  {e.contact && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-accent)' }}>{e.contact}</div>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </main>
    </>
  )
}
