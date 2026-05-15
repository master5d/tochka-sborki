'use client'

import { useEffect, useRef, useState } from 'react'
import { Nav } from '@/components/nav'
import { CertificateSVG } from '@/components/certificate-svg'
import type { Locale } from '@/lib/dictionaries'

const COPY = {
  ru: {
    label: '/ сертификат',
    heading: 'Твой сертификат',
    sub: 'Скачай SVG или поделись в соцсетях.\nVibe coder — это новая базовая грамотность.',
    nameLabel: 'Имя на сертификате',
    namePlaceholder: 'Введи имя…',
    download: '↓ Скачать SVG',
    shareX: 'Поделиться в X',
    shareLI: 'Поделиться в LinkedIn',
    copyLink: 'Скопировать ссылку',
    copied: '✓ Скопировано',
    shareText: 'Прошёл курс по vibe-кодингу @ Точка Сборки. Claude Code, MCP, агенты, автоматизация.',
  },
  en: {
    label: '/ certificate',
    heading: 'Your certificate',
    sub: 'Download the SVG or share on social media.\nVibe coding is the new basic literacy.',
    nameLabel: 'Name on certificate',
    namePlaceholder: 'Enter name…',
    download: '↓ Download SVG',
    shareX: 'Share on X',
    shareLI: 'Share on LinkedIn',
    copyLink: 'Copy link',
    copied: '✓ Copied',
    shareText: 'Just finished the vibe-coding course @ Tochka Sborki. Claude Code, MCP, agents, automation.',
  },
}

const STORAGE_KEY = 'cert_name'

interface Props { locale: Locale }

export function CertificatePage({ locale }: Props) {
  const t = COPY[locale]
  const [name, setName] = useState('')
  const [copied, setCopied] = useState(false)
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const stored = (() => {
      try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
    })()
    if (stored) {
      setName(stored)
      return
    }
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.email) setName(d.email.split('@')[0])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (name) {
      try { localStorage.setItem(STORAGE_KEY, name) } catch { /* */ }
    }
  }, [name])

  const date = new Date().toISOString().slice(0, 10)
  const displayName = name.trim() || (locale === 'en' ? 'Anonymous Vibe Coder' : 'Анонимный Vibe Coder')

  const certUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${locale === 'en' ? '/en' : ''}/certificate/`
    : 'https://mamaev.coach/certificate/'

  function downloadSvg() {
    if (!svgRef.current) return
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svgRef.current)
    const blob = new Blob(
      ['<?xml version="1.0" encoding="UTF-8"?>\n', svgString],
      { type: 'image/svg+xml;charset=utf-8' }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tochka-sborki-${displayName.toLowerCase().replace(/\s+/g, '-')}-${date}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function shareX() {
    const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(t.shareText)}&url=${encodeURIComponent(certUrl)}`
    window.open(u, '_blank', 'noopener,noreferrer')
  }

  function shareLI() {
    const u = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certUrl)}`
    window.open(u, '_blank', 'noopener,noreferrer')
  }

  function copyLink() {
    navigator.clipboard?.writeText(certUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <Nav locale={locale} />
      <main style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '1rem',
        }}>
          {t.label}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(2.5rem, 7vw, 5rem)',
          fontWeight: 900,
          lineHeight: 0.9,
          textTransform: 'uppercase',
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
          marginBottom: '1.5rem',
        }}>
          {t.heading}
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '500px',
          whiteSpace: 'pre-line',
          marginBottom: '3rem',
        }}>
          {t.sub}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          alignItems: 'start',
        }}>
          {/* Left: SVG */}
          <div>
            <CertificateSVG ref={svgRef} name={displayName} date={date} locale={locale} />
          </div>

          {/* Right: controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: '0.5rem',
              }}>
                {t.nameLabel}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <button
              onClick={downloadSvg}
              style={{
                padding: '0.875rem 1.5rem',
                background: 'var(--text-accent)',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              {t.download}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={shareX}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                𝕏  {t.shareX}
              </button>
              <button
                onClick={shareLI}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                in  {t.shareLI}
              </button>
              <button
                onClick={copyLink}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'transparent',
                  color: copied ? 'var(--text-accent)' : 'var(--text-primary)',
                  border: `1px solid ${copied ? 'var(--text-accent)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                ⎘  {copied ? t.copied : t.copyLink}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
