'use client'
import type { Locale } from '../../lib/dictionaries'
import { quest, type Fork } from '../../lib/quest/content'
import { buildRoute, routeText } from '../../lib/quest/route'
import { Chapter, type Tint } from './chapter'
import { GatePlaques } from './gate-plaques'
import { OutcomeReveal } from './outcome-reveal'
import { PathFork } from './path-fork'
import { SceneLoop } from './scene-loop'
import { StickyStage } from './sticky-stage'
import { usePathChoice } from './use-path-choice'
import { useScrollMood } from './use-scroll-mood'

interface Props { locale: Locale }

const FORK_TINT: Record<Fork['id'], Tint> = { boulder: 'fork1', temple: 'fork2', gates: 'fork3' }

function Para({ text, lead = false }: { text: string; lead?: boolean }) {
  return <p style={{ fontSize: lead ? 'var(--text-lg)' : 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)', maxWidth: '40rem', marginBottom: '1rem' }}>{text}</p>
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

  return (
    <main>
      <style>{`
        @media (max-width: 720px) {
          .hub-section { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
        }
        @media (max-width: 900px) {
          .quest-hero h1 { font-size: clamp(1.5rem, 6.5vw, 2.6rem) !important; }
        }
      `}</style>

      {/* 0. Hero: the map is the first screen's backdrop, copy sits over it on a scrim (A4). */}
      <Chapter id="hero" tint="hero" bleed>
        <div className="quest-hero-frame">
          <SceneLoop
            id={c.hero.scene}
            locale={locale}
            eager
            className="quest-hero-scene"
            loopCaption={c.captions[c.hero.scene]}
            quip={quipFor('hero')}
          />
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

      {/* 1. Intro: camp by the fire, three paragraphs as steps beside the sticky scene. */}
      <Chapter id="intro" tint="intro" eyebrow={c.intro.eyebrow} heading={c.intro.heading} bleed>
        <StickyStage
          media={() => (
            <SceneLoop
              id={c.intro.scene}
              locale={locale}
              loopCaption={c.captions[c.intro.scene]}
              quip={quipFor('intro')}
            />
          )}
          steps={c.intro.paragraphs.map((p, i) => ({ key: `intro-${i}`, body: p }))}
        />
      </Chapter>

      {/* 2–4. Forks. The CTA + bridge are a trailing step INSIDE the same sticky
          grid as setup/habit/outcomes (not a sibling block after it) — otherwise
          the grid's own height stops short of the chapter's real content and the
          sticky world un-pins early, leaving bare tint while the cards keep
          scrolling (the Wave A/B "world disappears mid-chapter" finding). */}
      {c.forks.map((fork) => (
        <Chapter key={fork.id} id={fork.id} tint={FORK_TINT[fork.id]} eyebrow={fork.eyebrow} heading={fork.obstacle} bleed>
          <StickyStage
            media={(active) =>
              fork.id === 'gates'
                ? (
                  <GatePlaques
                    locale={locale}
                    plaques={c.labels.plaques}
                    caption={active === 1 ? c.labels.habit : active === 2 ? c.labels.detour : undefined}
                    loopCaption={c.captions[fork.scene]}
                    quip={quipFor(fork.id)}
                  />
                )
                : (
                  <SceneLoop
                    id={fork.scene}
                    locale={locale}
                    caption={active === 1 ? c.labels.habit : active === 2 ? c.labels.detour : undefined}
                    loopCaption={c.captions[fork.scene]}
                    quip={quipFor(fork.id)}
                  />
                )
            }
            steps={[
              { key: `${fork.id}-setup`, body: fork.setup.map((p, i) => <Para key={i} text={p} lead />) },
              { key: `${fork.id}-habit`, body: <PathFork fork={fork} labels={c.labels} mark={marks[fork.id]} onMark={(m) => setMark(fork.id, m)} /> },
              { key: `${fork.id}-outcomes`, body: <OutcomeReveal title={fork.outcomesTitle} outcomes={fork.outcomes} labels={c.labels} /> },
              {
                key: `${fork.id}-outro`,
                body: (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-start' }}>
                    {fork.cta ? <a href={fork.cta.href} className="quest-cta">{fork.cta.label}</a> : null}
                    <Para text={fork.bridge} />
                  </div>
                ),
              },
            ]}
          />
        </Chapter>
      ))}

      {/* 5. Finale. */}
      <Chapter id="finale" tint="finale" eyebrow={c.finale.eyebrow} heading={c.finale.heading} bleed>
        <StickyStage
          media={() => (
            <SceneLoop
              id={c.finale.scene}
              locale={locale}
              loopCaption={c.captions[c.finale.scene]}
              quip={quipFor('finale')}
            />
          )}
          steps={[
            ...c.finale.paragraphs.map((p, i) => ({ key: `finale-${i}`, body: p })),
            /* Wave F: the reader's assembled route, canon titles + guide names
               only (lib/quest/route.ts) — rendered ONLY when all three forks are
               marked; otherwise this step is simply absent and the finale reads
               exactly as it did before Wave F. */
            ...(route
              ? [{ key: 'finale-route', body: <p className="quest-route">{routeText(route, c.labels)}</p> }]
              : []),
            {
              key: 'finale-cta',
              body: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div className="quest-number" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}>{c.finale.closing}</div>
                  <a href={c.finale.cta.href} className="quest-cta">{c.finale.cta.label}</a>
                </div>
              ),
            },
          ]}
        />
      </Chapter>

      {/* 6. About × 2 + footer. */}
      <Chapter id="about" tint="about">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
          <SceneLoop id={c.about.scene} locale={locale} loopCaption={c.captions[c.about.scene]} quip={quipFor('about')} />
          <div className="quest-cards">
            <article className="quest-card">
              <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{c.about.author.heading}</h3>
              <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{c.about.author.text}</p>
              <a href={c.about.author.cta.href} className="quest-cta quest-cta--ghost" style={{ alignSelf: 'flex-start' }}>{c.about.author.cta.label}</a>
              <p style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', letterSpacing: '0.04em' }}>
                {c.about.author.links.map((l) => <a key={l.href} href={l.href}>→ {l.label}</a>)}
              </p>
            </article>
            <article className="quest-card">
              <h3 style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontWeight: 900, fontSize: 'var(--text-xl)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{c.about.course.heading}</h3>
              <p style={{ fontSize: 'var(--text-base)', lineHeight: 1.7, color: 'var(--text-primary)' }}>{c.about.course.text}</p>
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
