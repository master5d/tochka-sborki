'use client'

import { useState } from 'react'
import { withAutoplay, type VideoSource } from '@/lib/course/showcase'

const FRAME: React.CSSProperties = {
  position: 'relative', aspectRatio: '16 / 9', width: '100%',
  borderRadius: 14, overflow: 'hidden',
  border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
  marginBottom: '2rem',
}
const FILL: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }

export function ShowcaseVideo({ source, poster, caption, title }: {
  source: VideoSource | null
  poster: string | null
  caption: string
  title: string
}) {
  const [playing, setPlaying] = useState(false)

  // No video configured yet → static placeholder (preserves current look).
  if (!source) {
    return (
      <div style={FRAME}>
        <div style={{ ...FILL, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: 'var(--text-secondary)' }}>
          <span aria-hidden="true" style={{ fontSize: '2.4rem' }}>▶</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{caption}</span>
        </div>
      </div>
    )
  }

  // Facade: poster (or surface) + play button; load the real player only on click.
  if (!playing) {
    return (
      <div style={FRAME}>
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={title}
          style={{
            ...FILL, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: poster ? `center / cover no-repeat url(${poster})` : 'var(--bg-surface)',
          }}
        >
          <span aria-hidden="true" style={{
            fontSize: '1.6rem', width: 72, height: 72, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--text-accent)', color: 'var(--text-on-accent)',
          }}>▶</span>
        </button>
      </div>
    )
  }

  // Playing.
  return (
    <div style={FRAME}>
      {source.kind === 'embed' ? (
        <iframe
          src={withAutoplay(source.src)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={FILL}
        />
      ) : (
        <video src={source.src} controls autoPlay playsInline poster={poster ?? undefined} style={FILL} />
      )}
    </div>
  )
}
