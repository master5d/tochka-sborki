# Golden-ticket certificate rework — design (fb_6ded7b0b7980)

**Ticket:** `fb_6ded7b0b7980` — rework `/certificate` into a "golden ticket": a premium gold-on-dark-cosmic completion certificate framed as a symbolic milestone pass.

## Goal

Visual + copy rework of the existing Tochka Sborki completion certificate into a gold-on-dark-cosmic "golden ticket," using the owner's reference structure (clean classic layout: serif heading, presented-to, founder signature). Frame completion as a **symbolic** milestone ("you've earned your place, ready for what's next") — **not** a literal promise of access to the unbuilt S.A.S.H.A academy.

## Decisions (from design gate)

- **Framing:** symbolic golden ticket — no S.A.S.H.A login/cohort/community promise. Lights up into literal admission later if/when the academy ships.
- **Layout:** clean classic + gold motif (owner reference) — replaces the current piano-grid / before→after stage motif.
- **Publisher string** "Mamaev Institute for AI" stays untouched (rename is a separate ticket `fb_7f1d36587e18`).
- **Founder signature** = "Sasha Mamaev", title "Founder · Точка Сборки" / "основатель · Точка Сборки" — stylized *text* signature (italic serif), not a fake handwritten image.

## Scope

- Single app: `LMS/tochka-sborki/web/`.
- Engine vs content (per ticket): the SVG component is the **engine**; the golden-ticket copy + palette are **Tochka content** → extract to `lib/course/certificate.ts`.
- The "completion → academy admission" *mechanic* generalization is **out of scope** (deferred to S.A.S.H.A epic).

Out of scope: publisher rename, real academy access/login, any new route, share-mechanic changes.

## Architecture — engine+data

Mirrors `lib/course/office-hours.ts` / `showcase.ts`: keyed bilingual data + pure resolver + thin renderer. The SVG component becomes generic (renders from resolved course-data + name/date); the gold palette and all copy live in course-data.

### Units

| Unit | Change |
|---|---|
| `lib/course/certificate.ts` | **NEW** — `CERTIFICATE` data + `CERT_PALETTE` + pure `resolveCertificate(locale, source?)`. Tested. |
| `components/certificate-svg.tsx` | **REWRITE** — thin renderer consuming `resolveCertificate(locale)` + `name`/`date` props. Drops inline `COPY`, piano-grid, and the 4 stage groups. |
| `components/pages/certificate-page.tsx` | **COPY reframe only** — page heading/sub/share text → golden-ticket/milestone tone. All mechanics (name input, localStorage, SVG download, share X/LI, copy link, filename) unchanged. |
| `app/certificate/page.tsx`, `app/en/certificate/page.tsx` | unchanged |

### Data shapes (`lib/course/certificate.ts`)

```ts
import type { Locale } from '@/lib/dictionaries'

interface Bi { ru: string; en: string }

export interface CertificateData {
  brand: Bi          // "ТОЧКА СБОРКИ" / "TOCHKA SBORKI"
  ticketLabel: Bi    // "ЗОЛОТОЙ БИЛЕТ" / "GOLDEN TICKET" (top-right eyebrow)
  heading: Bi        // "Сертификат о прохождении" / "Certificate of Completion" (serif)
  presentedTo: Bi    // "вручается" / "presented to"
  forCompleting: Bi  // "за прохождение курса" / "for completing"
  courseName: Bi     // "«Точка Сборки»" / "Tochka Sborki"
  milestone: Bi      // symbolic 2-line milestone; '\n' splits the lines
  footerMeta: Bi     // "28 юнитов · 7 тем" / "28 units · 7 topics"
  founderName: Bi    // "Саша Мамаев" / "Sasha Mamaev"
  founderTitle: Bi   // "основатель · Точка Сборки" / "Founder · Tochka Sborki"
  publisher: Bi      // "представлено · Mamaev Institute for AI" / "presented by · Mamaev Institute for AI"
  url: string        // "ai.mamaev.coach/certificate" (locale-agnostic)
}

export interface ResolvedCertificate {
  brand: string; ticketLabel: string; heading: string
  presentedTo: string; forCompleting: string; courseName: string
  milestone: string; footerMeta: string
  founderName: string; founderTitle: string
  publisher: string; url: string
}

export const CERT_PALETTE = {
  bg: '#0a0a0f',        // dark cosmic
  gold: '#e8c66a',      // single warm-gold accent
  goldDim: '#9a7f3c',   // dim gold for frame/secondary strokes
  primary: '#f0ece0',   // warm off-white text
  muted: '#9a927e',     // warm muted text
  border: '#2a2620',    // warm dark border
} as const

export const CERTIFICATE: CertificateData = { /* bilingual values, drafted below */ }

export function resolveCertificate(locale: Locale, source: CertificateData = CERTIFICATE): ResolvedCertificate {
  // map each Bi field → source[field][locale]; url passes through unchanged
}
```

`source` optional param = testability seam (precedent: `resolveBreaks` / blog `getGraphEntries`).

### Milestone copy (symbolic, de-guru, drafted for spec review)

- **ru:** `Точка сборки пройдена.\nТы готов(а) к следующему витку.`
- **en:** `The assembly point is set.\nYou're ready for what comes next.`

No "admission," no "academy access," no community promise — symbolic readiness only. Owner may rewrite at spec review (owner-voice).

### New SVG renderer layout (800×1000, gold-on-dark)

Reuses the current scaffold (viewBox 800×1000, `maxWidth:560px`, `@import` font block, double frame, corner ticks, name + gold-underline) — recolored gold and re-laid-out to the classic structure:

1. **Background:** `CERT_PALETTE.bg` + the existing faint grid pattern (recolored neutral).
2. **Double frame:** outer thin `goldDim`, inner dashed `gold` (reuse existing two-rect frame).
3. **Header row:** brand top-left `◈ {brand}` (gold ◈ glyph + primary brand text); `{ticketLabel}` top-right, gold, letter-spaced mono.
4. **Serif heading:** centered `{heading}` in a serif face (add `Playfair Display` wght 600/700 to the `@import`), gold, large.
5. **presented-to:** centered `{presentedTo}` muted small-caps mono.
6. **Name:** centered, large serif/display, primary, with the existing gold underline rule beneath.
7. **for-completing:** centered `{forCompleting}` muted + `{courseName}` primary on the next line.
8. **Milestone:** centered 2-line `{milestone}` (split on `\n`), muted/gold.
9. **ONE geometric gold motif:** a single centered `◈` seal / concentric-diamond starburst in gold (subtle) — the only ornament; no piano-grid, no stage groups.
10. **Founder block:** italic-serif `{founderName}` as a stylized signature above a short gold rule, `{founderTitle}` muted beneath.
11. **Footer:** `{date} · {footerMeta}` muted mono; `{publisher}` gold mono; `{url}` muted mono.
12. **Corner ticks:** keep, recolored gold.

ONE-accent discipline: gold is the only accent hue; everything else is bg / primary / muted / border. No cyan.

### Page copy reframe (`certificate-page.tsx`)

Update the inline `COPY` ru/en strings only:
- `heading`: "Твой золотой билет" / "Your golden ticket"
- `sub`: milestone-tone two lines (e.g. "Скачай SVG или поделись. / Точка сборки пройдена — впереди следующий виток." / "Download or share. / The assembly point is set — the next turn is ahead.")
- `shareText`: reframe to milestone (still honest, no hype/scarcity).
- Anonymous fallback (`displayName`) may be reframed to a neutral guest label or left as-is — implementer's choice, keep it honest.
- Everything else (mechanics, filename, storage key, share URLs) **unchanged**.

## Authenticity constraints

- No fabricated community/access/admission promise; symbolic milestone only.
- Founder signature is the owner's real name as stylized text, not a forged handwritten asset.
- No scarcity/countdown/vanity metrics; no "limited seats."
- Publisher string untouched (separate rename ticket).

## Testing

- `lib/course/certificate.test.ts` — `resolveCertificate('ru')` and `('en')` return non-empty strings for every field; `url` passes through; ru and en differ for `heading` (sanity that both locales populated); resolves from the default source and from an injected `source`.
- SVG renderer + page copy validated by `npm run build` (visual correctness by inspection — no logic tests on presentational SVG).
- No new dependencies (Playfair Display loaded via the existing Google Fonts `@import` in the SVG `<defs>`).

## Backward compatibility

- `CertificateSVG` keeps its public props (`name`, `date`, `locale`) and `forwardRef<SVGSVGElement>` contract → `certificate-page.tsx` download/serialize path is unaffected.
- Routes and share mechanics unchanged.

## Task decomposition (for the plan)

1. **`lib/course/certificate.ts`** — data + palette + resolver + `certificate.test.ts`.
2. **Rewrite `components/certificate-svg.tsx`** — consume resolver, gold classic layout; `npm run build` validation.
3. **`certificate-page.tsx` copy reframe** — golden-ticket/milestone tone; `npm run build` validation.
