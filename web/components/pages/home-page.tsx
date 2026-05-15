import Link from 'next/link'
import { getAllModules } from '@/lib/content'
import { getDictionary, type Locale } from '@/lib/dictionaries'
import { Nav } from '@/components/nav'
import { ProgramVenn } from '@/components/program-venn'
import { ChatBubble } from '@/components/chat-bubble'

const lessonsHref = (locale: Locale, slug: string) =>
  locale === 'en' ? `/en/lessons/${slug}/` : `/lessons/${slug}/`
const loginHref = (locale: Locale) => locale === 'en' ? '/en/login/' : '/login/'
const feedbackHref = (locale: Locale) => locale === 'en' ? '/en/feedback/' : '/feedback/'

interface Props { locale: Locale }

export function HomePage({ locale }: Props) {
  const t = getDictionary(locale)
  const modules = getAllModules(locale)

  return (
    <>
      <Nav locale={locale} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 2rem 4rem',
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--section-label-size)',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '1.5rem',
        }}>
          {t.hero.tagline}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(3.5rem, 12vw, 10rem)',
          fontWeight: 900,
          lineHeight: 0.85,
          color: 'var(--text-primary)',
          marginBottom: '2rem',
          textTransform: 'uppercase',
          letterSpacing: '-0.06em',
          fontStretch: '100%',
        }}>
          {t.hero.titleLine1}<br />{t.hero.titleLine2}
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
        }}>
          {t.hero.subtitle}
        </p>

        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '2.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          {t.hero.stats.map(([val, label]) => (
            <div key={label}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-accent)', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            </div>
          ))}
        </div>

        <Link href={loginHref(locale)} style={{
          display: 'inline-block',
          padding: '0.875rem 2.5rem',
          background: 'var(--text-accent)',
          color: '#000',
          fontWeight: 900,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          borderRadius: 'var(--radius)',
        }}>
          {t.hero.cta}
        </Link>
      </section>

      {/* ── ДЛЯ КОГО ─────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}>
            {t.forWhoLabel}
          </div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            marginBottom: '3rem',
            lineHeight: 1,
          }}>
            {t.forWhoHeading}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {t.forWho.map(item => (
              <div key={item.title} style={{ paddingTop: '1rem', borderTop: 'var(--accent-line)' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                  letterSpacing: '0.03em',
                }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProgramVenn locale={locale} />

      {/* ── ПРОГРАММА ────────────────────────────────────────── */}
      <section style={{ padding: 'var(--section-gap) 2rem' }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '3rem',
          }}>
            {t.program.sectionLabel}
          </div>
          {modules.map(m => (
            <Link key={m.slug} href={lessonsHref(locale, m.slug)} style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '1.5rem',
              alignItems: 'start',
              padding: '1.5rem 0',
              borderBottom: '1px solid var(--border-color)',
              color: 'inherit',
              transition: 'opacity 0.2s',
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--section-label-size)',
                  color: 'var(--text-accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: '0.4rem',
                }}>
                  {m.duration}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.4rem',
                }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{m.description}</p>
              </div>
              <span style={{ color: 'var(--text-accent)', fontSize: '1.5rem', lineHeight: 1 }}>→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '2rem',
          }}>
            {t.faq.label}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            {t.faq.items.map(item => (
              <div key={item.q} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <ChatBubble text={item.q} side="user" maxWidth={420} />
                <ChatBubble text={item.a} side="agent" maxWidth={520} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ОБ АВТОРЕ ────────────────────────────────────────── */}
      <section style={{
        padding: 'var(--section-gap) 2rem',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{
          maxWidth: 'var(--content-max)',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--section-label-size)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '1rem',
            }}>
              {t.author.label}
            </div>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              lineHeight: 0.95,
              marginBottom: '1.5rem',
              whiteSpace: 'pre-line',
            }}>
              {t.author.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '1rem' }}>
              {t.author.bio}
            </p>
            <Link href={feedbackHref(locale)} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {t.author.cta}
            </Link>
          </div>
          <div style={{
            aspectRatio: '4/5',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/author.jpg"
              alt={t.author.name.replace('\n', ' ')}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            />
          </div>
        </div>
      </section>
    </>
  )
}
