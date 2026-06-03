import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const alt = 'Tochka Sborki. Prologue'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamic = 'force-static'

export default async function Image() {
  const bold = readFileSync(join(process.cwd(), 'app/blog/prologue/pt-serif-700.woff'))
  const regular = readFileSync(join(process.cwd(), 'app/blog/prologue/pt-serif-400.woff'))

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#fafaf7',
          display: 'flex',
          padding: '80px',
          position: 'relative',
          fontFamily: 'PT Serif',
        }}
      >
        {/* Assembly-point graphic in upper right */}
        <svg
          width="500"
          height="500"
          viewBox="0 0 500 500"
          style={{ position: 'absolute', top: -30, right: -30 }}
        >
          <g transform="translate(250 250)">
            <circle cx="0" cy="0" r="220" fill="none" stroke="#1a1a1a" strokeWidth="1" opacity="0.06" />
            <circle cx="0" cy="0" r="170" fill="none" stroke="#1a1a1a" strokeWidth="1" opacity="0.11" />
            <circle cx="0" cy="0" r="125" fill="none" stroke="#1a1a1a" strokeWidth="1.25" opacity="0.18" />
            <circle cx="0" cy="0" r="85" fill="none" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.32" />
            <circle cx="0" cy="0" r="50" fill="none" stroke="#1a1a1a" strokeWidth="1.75" opacity="0.55" />
            <circle cx="0" cy="0" r="26" fill="none" stroke="#1a1a1a" strokeWidth="2" opacity="0.8" />
            <circle cx="0" cy="0" r="16" fill="#d4a017" opacity="0.22" />
            <circle cx="0" cy="0" r="9" fill="#d4a017" />
            <circle cx="0" cy="0" r="3" fill="#1a1a1a" />
          </g>
        </svg>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            height: '100%',
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: '#1a1a1a',
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            Tochka Sborki
          </div>
          <div
            style={{
              fontSize: 56,
              color: '#4a4a4a',
              fontStyle: 'italic',
              marginTop: 8,
            }}
          >
            Prologue
          </div>
          <div
            style={{
              width: 110,
              height: 3,
              background: '#d4a017',
              marginTop: 32,
              marginBottom: 24,
            }}
          />
          <div
            style={{
              fontSize: 26,
              color: '#3a3a3a',
              lineHeight: 1.35,
            }}
          >
            The great transition · decentralized AI · assembled within
          </div>
          <div
            style={{
              fontSize: 20,
              color: '#7a7a7a',
              marginTop: 36,
              letterSpacing: 0.5,
            }}
          >
            mamaev.coach/en/blog/prologue
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'PT Serif', data: bold, weight: 700, style: 'normal' },
        { name: 'PT Serif', data: regular, weight: 400, style: 'normal' },
      ],
    },
  )
}
