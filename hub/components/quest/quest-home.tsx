'use client'
import { useRef } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { quest, type Fork } from '../../lib/quest/content'
import { buildRoute, routeText } from '../../lib/quest/route'
import { Chapter, type Tint } from './chapter'
import { OutcomeReveal } from './outcome-reveal'
import { useParallaxFrame, useReducedMotion } from './use-parallax'
import { HeroTitle } from './hero-title'
import { PinnedBackdrop } from './pinned-backdrop'
import { RoadScene } from './road-scene'
import { SceneLoop } from './scene-loop'
import { WideLoop } from './wide-loop'
import { heroDrift as heroDriftPx } from '../../lib/quest/drift'
import { ART_SIZES, SCENES } from '../../lib/quest/scenes'
import { usePathChoice } from './use-path-choice'
import { useScrollMood } from './use-scroll-mood'

interface Props { locale: Locale }

const FORK_TINT: Record<Fork['id'], Tint> = { boulder: 'fork1', temple: 'fork2', gates: 'fork3' }

function Para({ text, lead = false }: { text: string; lead?: boolean }) {
  return <p className="quest-prose" style={{ fontSize: lead ? 'var(--text-lg)' : 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: '1rem' }}>{text}</p>
}
/** Hero art drift: the art lags BEHIND its natural scroll position by up to
 * `HERO_DRIFT_TARGET` px as the hero scrolls past (wave J1). Since the
 * 2026-09-12 pixel audit the room for that lag is real pixels, not a stretch:
 * the scene is 11% taller than its wrapper past each edge (`HERO_SURPLUS`, CSS
 * in themes/quest.css) and the drift is a translate on the scene only — the old
 * `scaleY(1.22)` stretched the art on one axis. Progress comes from the frame's
 * own box (local scroll = `-rect.top` ÷ its height, not `clampProgress`, whose
 * viewport-relative formula starts the hero ~50% "through"); the surplus is
 * measured on the drift wrapper, which is shorter than the frame on mobile
 * (image in flow above the copy), so the cap follows the box that clips. */
function useHeroDrift() {
  const frameRef = useRef<HTMLDivElement>(null)
  const driftRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  useParallaxFrame(() => {
    const frame = frameRef.current
    const drift = driftRef.current
    if (!frame || !drift) return
    const rect = frame.getBoundingClientRect()
    const progress = Math.min(1, Math.max(0, -rect.top / rect.height))
    drift.style.setProperty('--px-y', `${heroDriftPx(progress, drift.getBoundingClientRect().height)}px`)
  }, !reducedMotion)
  return { frameRef, driftRef }
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
              wideSizes={ART_SIZES.heroWide}
              plateProgress="page-top"
              quip={quipFor('hero')}
            />
          </div>
          <div className="quest-hero-copy quest-hero">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
              {c.hero.name} · {c.hero.role}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'clamp(1.9rem, 4.6vw, 3.6rem)', lineHeight: 1.02, letterSpacing: '-0.035em', color: 'var(--text-primary)', marginBottom: '1.25rem', textWrap: 'balance' }}>
              <HeroTitle text={c.hero.lines[0]} />
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
          wide={<WideLoop alt={SCENES[c.intro.scene].alt[locale]} />}
          panels={c.intro.paragraphs.map((p, i) => <Para key={i} text={p} lead />)}
        />
      </Chapter>

      {/* 2–4. Forks (Wave M): each road is ONE pinned full-bleed scene held for
          the chapter's length — setup, the habit road and the detour travel
          over it as panels, and the detour's world wipes in as its card rises
          (road-scene.tsx). #temple mirrors the panels to the left. Then the
          outcomes band breaks out full-width, and the CTA + bridge close the
          chapter as a narrow centred column. */}
      {c.forks.map((fork) => (
        <Chapter key={fork.id} id={fork.id} tint={FORK_TINT[fork.id]} eyebrow={fork.eyebrow} heading={fork.obstacle} bleed guides>
          <RoadScene
            fork={fork}
            locale={locale}
            labels={c.labels}
            setup={fork.setup.map((p, i) => <Para key={i} text={p} lead />)}
            quip={quipFor(fork.id)}
            mark={marks[fork.id]}
            onMark={(m) => setMark(fork.id, m)}
          />
          <OutcomeReveal forkId={fork.id} title={fork.outcomesTitle} outcomes={fork.outcomes} labels={c.labels} chosen={marks[fork.id]} />
          <div className="quest-narrow-copy" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-start' }}>
            {fork.cta ? <a href={fork.cta.href} className="quest-cta">{fork.cta.label}</a> : null}
            <Para text={fork.bridge} />
          </div>
        </Chapter>
      ))}

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

      {/* 6. About (Wave M): a saturated full-width band (the reference's
          "About…" strip) — the signs scene and the two About cards side by
          side in one dense row, the footer in band ink underneath. */}
      <Chapter id="about" tint="about" surface="var(--quest-band-about)">
        <div className="quest-about">
          <div className="quest-about__art">
            <SceneLoop id={c.about.scene} locale={locale} quip={quipFor('about')} />
          </div>
          <div className="quest-about__cards">
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
              <a href={c.about.course.href} className="quest-cta" style={{ alignSelf: 'flex-start' }}>{c.forks[2].detour.ctas?.[0]?.label ?? c.finale.cta.label}</a>
            </article>
          </div>
        </div>
        <footer className="quest-about__footer">
          {c.footer}
        </footer>
      </Chapter>
    </main>
  )
}