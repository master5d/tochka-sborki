'use client'

import { useState } from 'react'
import { STORE_PRODUCTS } from '@/lib/store/products.data'
import { buildStoreContent } from '@/lib/store/store-content'
import type { Locale } from '@/lib/dictionaries'

export function StoreGrid({ locale }: { locale: Locale }) {
  const c = buildStoreContent(locale)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState(false)

  async function buy(productId: string) {
    if (busy) return
    setError(false)
    setBusy(productId)
    try {
      const res = await fetch('/api/checkout/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, locale }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.url) { window.location.assign(data.url); return }
      setError(true)
    } catch {
      setError(true)
    }
    setBusy(null)
  }

  if (STORE_PRODUCTS.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem' }}>{c.emptyMsg}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '40rem', marginTop: '1.5rem' }}>
      {STORE_PRODUCTS.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name[locale]}</p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{p.blurb[locale]}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{c.priceFmt(p.priceCents)}</span>
            <button onClick={() => buy(p.id)} disabled={busy !== null}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--text-accent)', color: 'var(--text-on-accent)', cursor: 'pointer', fontWeight: 600 }}>
              {c.buyLabel}
            </button>
          </div>
        </div>
      ))}
      {error && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.errorMsg}</p>}
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.footnote}</p>
    </div>
  )
}
