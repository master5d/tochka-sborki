'use client'
import { useRef } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { quest, type Fork, type QuestContent } from '../../lib/quest/content'
import type { PathMark } from '../../lib/quest/route'
import { buildRoute, routeText } from '../../lib/quest/route'
import { Chapter, type Tint } from './chapter'
import { GatePlaques } from './gate-plaques'
import { OutcomeReveal } from './outcome-reveal'
import { clampProgress } from './use-chapter-progress'
import { useParallaxFrame, useReducedMotion } from './use-parallax'
import { PathFork } from './path-fork'
import { PinnedBackdrop } from './pinned-backdrop'
import { RoadStrip } from './road-strip'
import { SceneLoop } from './scene-loop'
import { StickyStage } from './sticky-stage'
import { usePathChoice } from './use-path-choice'
import { useScrollMood } from './use-scroll-mood'

interface Props { locale: Locale }

const FORK_TINT: Record<Fork['id'], Tint> = { boulder: 'fork1', temple: 'fork2', gates: 'fork3' }

function Para({ text, lead = false }: { text: string; lead?: boolean }) {
  return <p className="quest-prose" style={{ fontSize: lead ? 'var(--text-lg)' : 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: '1rem' }}>{text}</p>
}

/** Wave J1 fix (coordinator review): the first cut's rate (-0.984 vs the
 * copy's -1.0) was invisible in practice — ~14px of relative drift is below
 * the threshold of perception. Reworked to guarantee a fixed PIXEL
 * displacement instead of a small rate: `HERO_DRIFT_TARGET` (80px) is what
 * the art lags BEHIND its own natural scroll position by the time the hero
 * has fully scrolled past — i.e. `relativeDisplacement(art, copy) ===
 * HERO_DRIFT_TARGET` exactly at that point (copy has no added transform, so
 * its own displacement over the same window is the plain -scrollDelta; the
 * art's is that same -scrollDelta + amplitude — the difference IS the
 * amplitude, by construction). `frameRef` measures `.quest-hero-frame`'s own
 * box directly (local scroll = `-rect.top`, progress = that ÷ the frame's own
 * height — NOT `clampProgress`, whose viewport-relative formula starts the
 * hero already ~50% "through" its transit at scrollY=0, which was hiding
 * most of the usable range). `driftRef` is the wrapper around the hero
 * `SceneLoop`. The wrapper is scaled vertically only (`scaleY`, not a
 * uniform `scale`) in CSS — a uniform zoom would also crop the LEFT/RIGHT
 * edges, and the hero art already runs a character (the robot) right to the
 * frame's right edge; `scaleY` gives vertical surplus for the drift without
 * touching horizontal framing at all. `amplitude` is capped at 85% of that
 * surplus so the drift can never expose a gap at the top/bottom edge — on a
 * short viewport where the full 80px doesn't fit, it quietly shrinks instead
 * (per the brief: stay subtle rather than break the frame). */
const HERO_DRIFT_TARGET = 80
const HERO_SCALE_Y = 1.22 // ±11% of the frame's own height as vertical surplus, scaleY only (no horizontal crop change)

function useHeroDrift() {
  const frameRef = useRef<HTMLDivElement>(null)
  const driftRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  useParallaxFrame(() => {
    const frame = frameRef.current
    const drift = driftRef.current
    if (!frame || !drift) return
    const rect = frame.getBoundingClientRect()
    const surplusPerSide = (rect.height * (HERO_SCALE_Y - 1)) / 2
    const amplitude = Math.min(HERO_DRIFT_TARGET, surplusPerSide * 0.85)
    const progress = Math.min(1, Math.max(0, -rect.top / rect.height))
    drift.style.setProperty('--px-y', `${progress * amplitude}px`)
  }, !reducedMotion)
  return { frameRef, driftRef }
}

/** Wave J1 (item 2): `#gates`' two road rails move at different rates from
 * each other (one lagging, one leading the centred text) so the fork visibly
 * splits as the reader descends — max ~80px of relative drift across the
 * chapter (±40px each), well under the "gimmick" ceiling in the brief.
 * `containerRef` measures the whole `.quest-two-roads` grid's own transit;
 * the two rail `<img>`s get their `--px-y` written directly, clipped by
 * `.quest-two-roads__rail{overflow:hidden}` + a static `scale(1.15)` in CSS
 * (same oversize-and-clip trick as the hero, sized generously since the rail
 * amplitude is larger). A standalone component (not a hook called inside
 * `c.forks.map`) so the hook obeys the rules of hooks regardless of fork
 * order. */
function GatesRoads({
  fork,
  labels,
  plaques,
  locale,
  quip,
  mark,
  onMark,
}: {
  fork: Fork
  labels: QuestContent['labels']
  plaques: [string, string]
  locale: Locale
  quip?: string
  mark?: PathMark
  onMark: (mark: PathMark) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const leftImgRef = useRef<HTMLImageElement>(null)
  const rightImgRef = useRef<HTMLImageElement>(null)
  const reducedMotion = useReducedMotion()
  useParallaxFrame(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const progress = clampProgress(rect.top, rect.height, window.innerHeight)
    leftImgRef.current?.style.setProperty('--px-y', `${-40 * progress}px`)
    rightImgRef.current?.style.setProperty('--px-y', `${40 * progress}px`)
  }, !reducedMotion)
  return (
    <div className="quest-two-roads" ref={containerRef}>
      <div className="quest-two-roads__rail quest-two-roads__rail--left">
        <RoadStrip forkId={fork.id} guide={fork.habit.guide} imgRef={leftImgRef} />
      </div>
      <div className="quest-two-roads__text">
        {fork.setup.map((p, i) => <Para key={i} text={p} lead />)}
        <div className="quest-gate-scene">
          <GatePlaques locale={locale} plaques={plaques} quip={quip} />
        </div>
        <PathFork fork={fork} labels={labels} mark={mark} onMark={onMark} hideRoad />
      </div>
      <div className="quest-two-roads__rail quest-two-roads__rail--right">
        <RoadStrip forkId={fork.id} guide={fork.detour.guide} imgRef={rightImgRef} />
      </div>
    </div>
  )
}

export function QuestHome({ locale }: Props) {
  const c = quest[locale]
  // Wave F: path choice with memory. `marks` is `{}` before mount, before storage
  // is read, and forever if storage throws or stays empty — the finale then reads
  // exactly as it does today (buildRoute returns null for anything short of all
  // three forks marked).
  const { marks, setMark } = usePathChoice()
  const route = buildRoute(marks, c)
  // Wave F: the page notices how you read. `quipChapterId` is which chapter's
  // scene should show the Scroller's remark right now (or null — nothing to show,
  // including always under prefers-reduced-motion, handled inside the hook).
  const { chapterId: quipChapterId, showQuip } = useScrollMood()
  const quipFor = (id: string) => (showQuip && quipChapterId === id ? c.scrollerQuip : undefined)
  const heroDrift = useHeroDrift()

  return (
    <main>
      <style>{`
        @media (max-width: 720px) {
          .hub-section:not(.quest-bleed) { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
        }
        @media (max-width: 900px) {
          .quest-hero h1 { font-size: clamp(1.5rem, 6.5vw, 2.6rem) !important; }
        }
      `}</style>

      {/* 0. Hero: the map is the first screen's backdrop, copy sits over it on a scrim (A4). */}
      <Chapter id="hero" tint="hero" bleed>
        <div className="quest-hero-frame" ref={heroDrift.frameRef}>
          <div className="quest-hero-drift" ref={heroDrift.driftRef}>
            <SceneLoop
              id={c.hero.scene}
              locale={locale}
              eager
              className="quest-hero-scene"
              quip={quipFor('hero')}
            />
          </div>
          <div className="quest-hero-copy quest-hero">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
              {c.hero.name} · {c.hero.role}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'clamp(1.9rem, 4.6vw, 3.6rem)', lineHeight: 1.02, letterSpacing: '-0.035em', color: 'var(--text-primary)', marginBottom: '1.25rem', textWrap: 'balance' }}>
              {c.hero.lines[0]}
            </h1>
            {c.hero.lines.slice(1).map((l) => <Para key={l} text={l} lead />)}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>{c.hero.bio}</p>
          </div>
        </div>
      </Chapter>

      {/* 1. Intro: the camp scene pinned full-bleed for the whole chapter, the
          three paragraphs travelling over it on their own tint panels — the
          world never leaves the screen (Wave L1), and it is still not another
          split screen. */}
      <Chapter id="intro" tint="intro" eyebrow={c.intro.eyebrow} heading={c.intro.heading} bleed>
        <PinnedBackdrop
          scene={<SceneLoop id={c.intro.scene} locale={locale} quip={quipFor('intro')} />}
          panels={c.intro.paragraphs.map((p, i) => <Para key={i} text={p} lead />)}
        />
      </Chapter>

      {/* 2–4. Forks: each gets its own composition below the shared chapter
          opener. #boulder keeps the workhorse sticky-stage (world left/steps
          right); #temple is its real mirror (world right/steps left); #gates
          drops the big sticky scene for two tall road rails bracketing a
          narrow text column — the fork made visible. In all three, the
          outcomes act breaks OUT into its own full-width band (echoing the
          opener), and the CTA + bridge close the chapter as a narrow centred
          column — neither is inside a sticky grid any more, so there is
          nothing left to un-pin early. */}
      {c.forks.map((fork) => {
        const outro = (
          <div className="quest-narrow-copy" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-start' }}>
            {fork.cta ? <a href={fork.cta.href} className="quest-cta">{fork.cta.label}</a> : null}
            <Para text={fork.bridge} />
          </div>
        )
        const outcomesAct = <OutcomeReveal title={fork.outcomesTitle} outcomes={fork.outcomes} labels={c.labels} />

        if (fork.id === 'gates') {
          return (
            <Chapter key={fork.id} id={fork.id} tint={FORK_TINT[fork.id]} eyebrow={fork.eyebrow} heading={fork.obstacle} bleed guides>
              <GatesRoads
                fork={fork}
                labels={c.labels}
                plaques={c.labels.plaques}
                locale={locale}
                quip={quipFor(fork.id)}
                mark={marks[fork.id]}
                onMark={(m) => setMark(fork.id, m)}
              />
              {outcomesAct}
              {outro}
            </Chapter>
          )
        }

        return (
          <Chapter key={fork.id} id={fork.id} tint={FORK_TINT[fork.id]} eyebrow={fork.eyebrow} heading={fork.obstacle} bleed guides>
            <StickyStage
              mirror={fork.id === 'temple'}
              media={() => (
                <SceneLoop
                  id={fork.scene}
                  locale={locale}
                  quip={quipFor(fork.id)}
                />
              )}
              steps={[
                { key: `${fork.id}-setup`, body: fork.setup.map((p, i) => <Para key={i} text={p} lead />) },
                { key: `${fork.id}-habit`, body: <PathFork fork={fork} labels={c.labels} mark={marks[fork.id]} onMark={(m) => setMark(fork.id, m)} /> },
              ]}
            />
            {outcomesAct}
            {outro}
          </Chapter>
        )
      })}

      {/* 5. Finale: a closing title card mirroring the hero's own pattern —
          the paragraphs (and, once all three forks are marked, the assembled
          route) run first as a narrow centred column on the plain tint, then
          the scene sits full-bleed with the closing line + CTA on their OWN
          token-painted surface, centred over it — never straight on the art. */}
      <Chapter id="finale" tint="finale" eyebrow={c.finale.eyebrow} heading={c.finale.heading} bleed>
        <div className="quest-narrow-copy">
          {c.finale.paragraphs.map((p, i) => <Para key={i} text={p} />)}
          {/* Wave F: the reader's assembled route — each fork's own obstacle
             noun (fork.obstacle, prefix stripped) plus the road taken there
             (lib/quest/route.ts) — rendered ONLY when all three forks are
             marked; otherwise this line is simply absent and the finale reads
             exactly as it did before Wave F. */}
          {route ? <p className="quest-route">{routeText(route)}</p> : null}
        </div>
        <div className="quest-finale-frame">
          <SceneLoop
            id={c.finale.scene}
            locale={locale}
            className="quest-finale-scene"
            quip={quipFor('finale')}
          />
          <div className="quest-finale-copy">
            <div className="quest-number" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}>{c.finale.closing}</div>
            <a href={c.finale.cta.href} className="quest-cta">{c.finale.cta.label}</a>
          </div>
        </div>
      </Chapter>

      {/* 6. About: the signs scene as a centred panel (no sticky stage), the
          two About cards below it, side by side. */}
      <Chapter id="about" tint="about">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
          <SceneLoop id={c.about.scene} locale={locale} quip={quipFor('about')} />
          <div className="quest-cards">
            <article className="quest-card">
              <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{c.about.author.heading}</h3>
              <p className="quest-prose" style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{c.about.author.text}</p>
              <a href={c.about.author.cta.href} className="quest-cta quest-cta--ghost" style={{ alignSelf: 'flex-start' }}>{c.about.author.cta.label}</a>
              <p style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', letterSpacing: '0.04em' }}>
                {c.about.author.links.map((l) => <a key={l.href} href={l.href}>→ {l.label}</a>)}
              </p>
            </article>
            <article className="quest-card">
              <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{c.about.course.heading}</h3>
              <p className="quest-prose" style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{c.about.course.text}</p>
              <a href={c.about.course.href} className="quest-cta" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>{c.forks[2].detour.ctas?.[0]?.label ?? c.finale.cta.label}</a>
            </article>
          </div>
        </div>
        <footer style={{ marginTop: '4rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
          {c.footer}
        </footer>
      </Chapter>
    </main>
  )
}
