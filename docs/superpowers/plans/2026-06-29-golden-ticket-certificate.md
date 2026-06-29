# Golden-ticket Certificate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Точка Сборки `/certificate` into a gold-on-dark-cosmic "golden ticket" — a symbolic milestone pass — by extracting its copy/palette into course-data and restyling the SVG to a clean classic layout.

**Architecture:** Engine+data pattern mirroring `lib/course/office-hours.ts` — bilingual `CERTIFICATE` data + gold `CERT_PALETTE` + pure `resolveCertificate(locale)` resolver consumed by a thin SVG renderer. The page wrapper keeps all mechanics; only its copy is reframed.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`), TypeScript, React client components, inline SVG, Vitest. No new dependencies (Playfair Display via the existing Google Fonts `@import`).

## Global Constraints

- App directory: all paths under `LMS/tochka-sborki/web/`. Run all commands from there.
- Test runner: `npm run test` (= `vitest run`). Scoped: `npm run test -- lib/course/certificate.test.ts`.
- `Locale` (`'ru' | 'en'`) is imported from `@/lib/dictionaries`. `interface Bi { ru: string; en: string }` is module-local (not exported/imported).
- **Framing is symbolic** — no S.A.S.H.A login / cohort / community / "admission to academy" promise. Milestone copy = symbolic readiness only.
- **Publisher string stays "Mamaev Institute for AI"** — do NOT rename (separate ticket `fb_7f1d36587e18`).
- **Founder signature** = "Саша Мамаев" / "Sasha Mamaev" as stylized italic text, title "основатель · Точка Сборки" / "Founder · Tochka Sborki".
- **Single gold accent** `#e8c66a` on dark `#0a0a0f` — ONE accent hue, no cyan, no second color.
- Authenticity: no scarcity/countdown/vanity metrics; honest milestone tone.
- `CertificateSVG` keeps its public contract: `forwardRef<SVGSVGElement, { name: string; date: string; locale: Locale }>` (the page serializes the ref to download the SVG).
- Commit directly to `main` (trunk-based). Do NOT create a feature branch.
- No new dependencies.

---

### Task 1: Certificate course-data + palette + resolver

**Files:**
- Create: `lib/course/certificate.ts`
- Test: `lib/course/certificate.test.ts`

**Interfaces:**
- Consumes: `Locale` from `@/lib/dictionaries`.
- Produces:
  - `interface CertificateData` (12 fields; 11 `Bi` + `url: string`)
  - `interface ResolvedCertificate` (12 `string` fields)
  - `const CERT_PALETTE` (`bg, gold, goldDim, primary, muted, border`)
  - `const CERTIFICATE: CertificateData`
  - `function resolveCertificate(locale: Locale, source?: CertificateData): ResolvedCertificate`

- [ ] **Step 1: Write the failing test**

Create `lib/course/certificate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveCertificate, CERTIFICATE, CERT_PALETTE } from './certificate'
import type { ResolvedCertificate } from './certificate'

const FIELDS: (keyof ResolvedCertificate)[] = [
  'brand', 'ticketLabel', 'heading', 'presentedTo', 'forCompleting',
  'courseName', 'milestone', 'footerMeta', 'founderName', 'founderTitle',
  'publisher', 'url',
]

describe('resolveCertificate', () => {
  it('returns non-empty strings for every field in both locales', () => {
    for (const locale of ['ru', 'en'] as const) {
      const r = resolveCertificate(locale)
      for (const f of FIELDS) {
        expect(typeof r[f]).toBe('string')
        expect(r[f].trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('localizes heading and passes url through unchanged', () => {
    const ru = resolveCertificate('ru')
    const en = resolveCertificate('en')
    expect(ru.heading).not.toBe(en.heading)
    expect(ru.url).toBe(CERTIFICATE.url)
    expect(en.url).toBe(CERTIFICATE.url)
  })

  it('resolves from an injected source', () => {
    const fake = { ...CERTIFICATE, heading: { ru: 'РУ', en: 'EN' } }
    expect(resolveCertificate('ru', fake).heading).toBe('РУ')
    expect(resolveCertificate('en', fake).heading).toBe('EN')
  })

  it('keeps the publisher referencing the current institute (rename is a separate ticket)', () => {
    expect(resolveCertificate('en').publisher).toContain('Mamaev Institute for AI')
    expect(resolveCertificate('ru').publisher).toContain('Mamaev Institute for AI')
  })

  it('uses a single gold accent', () => {
    expect(CERT_PALETTE.gold).toBe('#e8c66a')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/course/certificate.test.ts`
Expected: FAIL — cannot resolve `./certificate`.

- [ ] **Step 3: Create the data + resolver module**

Create `lib/course/certificate.ts`:

```ts
// lib/course/certificate.ts
// Golden-ticket certificate course-data (fb_6ded7b0b7980). The SVG component is the
// engine; this file holds the Tochka-Sborki golden-ticket copy + palette.
// Framing is SYMBOLIC — no promise of access to the (unbuilt) S.A.S.H.A academy.
import type { Locale } from '@/lib/dictionaries'

interface Bi { ru: string; en: string }

export interface CertificateData {
  brand: Bi
  ticketLabel: Bi
  heading: Bi
  presentedTo: Bi
  forCompleting: Bi
  courseName: Bi
  milestone: Bi      // 2 lines; '\n' splits them
  footerMeta: Bi
  founderName: Bi
  founderTitle: Bi
  publisher: Bi
  url: string
}

export interface ResolvedCertificate {
  brand: string
  ticketLabel: string
  heading: string
  presentedTo: string
  forCompleting: string
  courseName: string
  milestone: string
  footerMeta: string
  founderName: string
  founderTitle: string
  publisher: string
  url: string
}

export const CERT_PALETTE = {
  bg: '#0a0a0f',
  gold: '#e8c66a',
  goldDim: '#9a7f3c',
  primary: '#f0ece0',
  muted: '#9a927e',
  border: '#2a2620',
} as const

export const CERTIFICATE: CertificateData = {
  brand: { ru: 'ТОЧКА СБОРКИ', en: 'TOCHKA SBORKI' },
  ticketLabel: { ru: 'ЗОЛОТОЙ БИЛЕТ', en: 'GOLDEN TICKET' },
  heading: { ru: 'Сертификат о прохождении', en: 'Certificate of Completion' },
  presentedTo: { ru: 'вручается', en: 'presented to' },
  forCompleting: { ru: 'за прохождение курса', en: 'for completing' },
  courseName: { ru: '«Точка Сборки»', en: 'Tochka Sborki' },
  milestone: {
    ru: 'Точка сборки пройдена.\nТы готов(а) к следующему витку.',
    en: 'The assembly point is set.\nYou’re ready for what comes next.',
  },
  footerMeta: { ru: '28 юнитов · 7 тем', en: '28 units · 7 topics' },
  founderName: { ru: 'Саша Мамаев', en: 'Sasha Mamaev' },
  founderTitle: { ru: 'основатель · Точка Сборки', en: 'Founder · Tochka Sborki' },
  publisher: {
    ru: 'представлено · Mamaev Institute for AI',
    en: 'presented by · Mamaev Institute for AI',
  },
  url: 'ai.mamaev.coach/certificate',
}

export function resolveCertificate(
  locale: Locale,
  source: CertificateData = CERTIFICATE,
): ResolvedCertificate {
  return {
    brand: source.brand[locale],
    ticketLabel: source.ticketLabel[locale],
    heading: source.heading[locale],
    presentedTo: source.presentedTo[locale],
    forCompleting: source.forCompleting[locale],
    courseName: source.courseName[locale],
    milestone: source.milestone[locale],
    footerMeta: source.footerMeta[locale],
    founderName: source.founderName[locale],
    founderTitle: source.founderTitle[locale],
    publisher: source.publisher[locale],
    url: source.url,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/course/certificate.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/course/certificate.ts lib/course/certificate.test.ts
git commit -m "feat(certificate): golden-ticket course-data + palette + resolver (fb_6ded7b0b7980)"
```

---

### Task 2: Rewrite the certificate SVG renderer

**Files:**
- Modify (full rewrite): `components/certificate-svg.tsx`

**Interfaces:**
- Consumes: `resolveCertificate`, `CERT_PALETTE` from `@/lib/course/certificate`; `Locale` from `@/lib/dictionaries`.
- Produces: `CertificateSVG` — unchanged public contract `forwardRef<SVGSVGElement, { name: string; date: string; locale: Locale }>`.

- [ ] **Step 1: Replace the entire file contents**

Replace the full contents of `components/certificate-svg.tsx` with:

```tsx
'use client'

import { forwardRef } from 'react'
import type { Locale } from '@/lib/dictionaries'
import { resolveCertificate, CERT_PALETTE } from '@/lib/course/certificate'

interface Props {
  name: string
  date: string
  locale: Locale
}

export const CertificateSVG = forwardRef<SVGSVGElement, Props>(
  function CertificateSVG({ name, date, locale }, ref) {
    const t = resolveCertificate(locale)
    const W = 800
    const H = 1000
    const { bg, gold, goldDim, primary, muted, border } = CERT_PALETTE
    const milestoneLines = t.milestone.split('\n')

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', maxWidth: '560px', margin: '0 auto' }}
      >
        <defs>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@900&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Geist+Mono:wght@400;700&display=swap');
            .brand   { font-family: 'Unbounded', system-ui, sans-serif; font-weight: 900; }
            .serif   { font-family: 'Playfair Display', Georgia, serif; font-weight: 700; }
            .serif-i { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; font-style: italic; }
            .mono    { font-family: 'Geist Mono', ui-monospace, monospace; font-weight: 400; }
            .mono-b  { font-family: 'Geist Mono', ui-monospace, monospace; font-weight: 700; }
          `}</style>
          <radialGradient id="cert-glow" cx="50%" cy="30%" r="62%">
            <stop offset="0%" stopColor={gold} stopOpacity="0.10" />
            <stop offset="70%" stopColor={gold} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={W} height={H} fill={bg} />
        <rect x="0" y="0" width={W} height={H} fill="url(#cert-glow)" />

        {/* Subtle grid */}
        <pattern id="cert-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
        </pattern>
        <rect x="0" y="0" width={W} height={H} fill="url(#cert-grid)" />

        {/* Double gold frame */}
        <rect x="40" y="40" width={W - 80} height={H - 80} fill="none" stroke={goldDim} strokeWidth="1" />
        <rect x="48" y="48" width={W - 96} height={H - 96} fill="none" stroke={gold} strokeWidth="0.5" strokeDasharray="2 4" opacity="0.5" />

        {/* Header */}
        <text x="70" y="100" className="brand" fontSize="20" fill={primary} letterSpacing="-1">
          <tspan fill={gold}>◈</tspan> {t.brand}
        </text>
        <text x={W - 70} y="100" textAnchor="end" className="mono-b" fontSize="11" fill={gold} letterSpacing="3">
          {t.ticketLabel}
        </text>
        <line x1="70" y1="115" x2={W - 70} y2="115" stroke={border} strokeWidth="1" />

        {/* Serif heading */}
        <text x={W / 2} y="240" textAnchor="middle" className="serif" fontSize="40" fill={gold}>
          {t.heading}
        </text>

        {/* presented to */}
        <text x={W / 2} y="320" textAnchor="middle" className="mono" fontSize="12" fill={muted} letterSpacing="3">
          {t.presentedTo}
        </text>

        {/* Name + gold underline */}
        <text x={W / 2} y="392" textAnchor="middle" className="serif" fontSize="44" fill={primary}>
          {name}
        </text>
        <line x1={W / 2 - 180} y1="414" x2={W / 2 + 180} y2="414" stroke={gold} strokeWidth="1.5" opacity="0.85" />

        {/* for completing + course */}
        <text x={W / 2} y="470" textAnchor="middle" className="mono" fontSize="12" fill={muted} letterSpacing="1.5">
          {t.forCompleting}
        </text>
        <text x={W / 2} y="506" textAnchor="middle" className="serif-i" fontSize="28" fill={primary}>
          {t.courseName}
        </text>

        {/* Milestone (symbolic) */}
        {milestoneLines.map((ln, i) => (
          <text
            key={i}
            x={W / 2}
            y={596 + i * 30}
            textAnchor="middle"
            className="mono"
            fontSize="14"
            fill={i === milestoneLines.length - 1 ? gold : muted}
            letterSpacing="0.5"
          >
            {ln}
          </text>
        ))}

        {/* ONE geometric gold motif — concentric diamond seal */}
        <g transform={`translate(${W / 2}, 700)`} stroke={gold} fill="none">
          <rect x="-18" y="-18" width="36" height="36" transform="rotate(45)" strokeWidth="1.5" opacity="0.9" />
          <rect x="-11" y="-11" width="22" height="22" transform="rotate(45)" strokeWidth="1" opacity="0.6" />
          <circle r="3" fill={gold} stroke="none" />
        </g>

        {/* Founder signature block */}
        <text x={W / 2} y="828" textAnchor="middle" className="serif-i" fontSize="28" fill={primary}>
          {t.founderName}
        </text>
        <line x1={W / 2 - 90} y1="845" x2={W / 2 + 90} y2="845" stroke={goldDim} strokeWidth="1" opacity="0.7" />
        <text x={W / 2} y="868" textAnchor="middle" className="mono" fontSize="10" fill={muted} letterSpacing="1.5">
          {t.founderTitle}
        </text>

        {/* Footer */}
        <text x={W / 2} y={H - 108} textAnchor="middle" className="mono" fontSize="11" fill={muted} letterSpacing="2">
          {date} · {t.footerMeta}
        </text>
        <text x={W / 2} y={H - 82} textAnchor="middle" className="mono-b" fontSize="10" fill={gold} letterSpacing="1.5">
          {t.publisher}
        </text>
        <text x={W / 2} y={H - 60} textAnchor="middle" className="mono" fontSize="10" fill={muted} letterSpacing="2">
          {t.url}
        </text>

        {/* Corner ticks */}
        <g stroke={gold} strokeWidth="1.5" opacity="0.7">
          <line x1="40" y1="40" x2="60" y2="40" />
          <line x1="40" y1="40" x2="40" y2="60" />
          <line x1={W - 60} y1="40" x2={W - 40} y2="40" />
          <line x1={W - 40} y1="40" x2={W - 40} y2="60" />
          <line x1="40" y1={H - 40} x2="60" y2={H - 40} />
          <line x1="40" y1={H - 60} x2="40" y2={H - 40} />
          <line x1={W - 60} y1={H - 40} x2={W - 40} y2={H - 40} />
          <line x1={W - 40} y1={H - 60} x2={W - 40} y2={H - 40} />
        </g>
      </svg>
    )
  }
)
```

- [ ] **Step 2: Type-check + build**

Run: `npm run build`
Expected: build succeeds, no type errors. `CertificateSVG` props/ref contract unchanged, so `certificate-page.tsx` still compiles.

- [ ] **Step 3: Run the suite (no regressions)**

Run: `npm run test`
Expected: PASS — all existing tests + the 5 certificate-data tests from Task 1.

- [ ] **Step 4: Commit**

```bash
git add components/certificate-svg.tsx
git commit -m "feat(certificate): gold-on-dark classic SVG renderer from course-data (fb_6ded7b0b7980)"
```

---

### Task 3: Reframe the certificate page copy

**Files:**
- Modify: `components/pages/certificate-page.tsx` (the `COPY` object only — `ru.heading`, `ru.sub`, `ru.shareText`, `en.heading`, `en.sub`, `en.shareText`)

**Interfaces:**
- Consumes: nothing new. Pure copy edit; all mechanics (name input, localStorage, `downloadSvg`, `shareX`, `shareLI`, `copyLink`, filename, storage key) stay exactly as they are.

- [ ] **Step 1: Edit the `ru` copy strings**

In `components/pages/certificate-page.tsx`, inside the `COPY.ru` object, replace these three lines:

```ts
    heading: 'Твой сертификат',
    sub: 'Скачай SVG или поделись в соцсетях.\nVibe coder — это новая базовая грамотность.',
```
```ts
    shareText: 'Прошёл курс по vibe-кодингу @ Точка Сборки. Claude Code, MCP, агенты, автоматизация.',
```

with:

```ts
    heading: 'Твой золотой билет',
    sub: 'Скачай SVG или поделись.\nТочка сборки пройдена — впереди следующий виток.',
```
```ts
    shareText: 'Получил золотой билет «Точки Сборки» — vibe coding, Claude Code, агенты, автоматизация.',
```

- [ ] **Step 2: Edit the `en` copy strings**

In the `COPY.en` object, replace these three lines:

```ts
    heading: 'Your certificate',
    sub: 'Download the SVG or share on social media.\nVibe coding is the new basic literacy.',
```
```ts
    shareText: 'Just finished the vibe-coding course @ Tochka Sborki. Claude Code, MCP, agents, automation.',
```

with:

```ts
    heading: 'Your golden ticket',
    sub: 'Download the SVG or share.\nThe assembly point is set — the next turn is ahead.',
```
```ts
    shareText: 'Earned my Tochka Sborki golden ticket — vibe coding, Claude Code, agents, automation.',
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds, no errors.

- [ ] **Step 4: Run the suite (no regressions)**

Run: `npm run test`
Expected: PASS — no test asserts on these copy strings; full suite green.

- [ ] **Step 5: Commit**

```bash
git add components/pages/certificate-page.tsx
git commit -m "feat(certificate): reframe certificate page copy to golden-ticket milestone (fb_6ded7b0b7980)"
```

---

## Self-Review

**1. Spec coverage:**
- `lib/course/certificate.ts` (data + palette + resolver, engine+data split) → Task 1. ✅
- Bilingual symbolic milestone, publisher untouched, founder signature, single gold accent → Task 1 data values + Global Constraints. ✅
- SVG rewrite to clean classic gold layout (serif heading, presented-to, gold-underlined name, for-completing+course, ONE motif, founder block, footer, corner ticks), drops piano-grid/stages → Task 2. ✅
- `CertificateSVG` contract preserved (forwardRef + props) → Task 2 interfaces + build check. ✅
- Page copy reframe, mechanics unchanged → Task 3. ✅
- Testing (pure resolver test + build validation, no new deps) → Tasks 1-3. ✅

**2. Placeholder scan:** No TBD/TODO/"handle X". Every code step is complete. Milestone/copy values are concrete and verbatim.

**3. Type consistency:** `CertificateData`/`ResolvedCertificate` 12-field shapes identical across Tasks 1-2; `resolveCertificate(locale, source?)` and `CERT_PALETTE` keys (`bg/gold/goldDim/primary/muted/border`) match between producer (Task 1) and consumer (Task 2). `CertificateSVG` prop names (`name/date/locale`) unchanged. `milestone.split('\n')` matches the `'\n'`-containing data values.
