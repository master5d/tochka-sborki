import Link from 'next/link'
import { getAllLessons } from '@/lib/content'
import { Nav } from '@/components/nav'

const FOR_WHO = [
  {
    title: 'Хочешь понять AI изнутри',
    body: 'Не просто пользоваться ChatGPT, а строить с ним — pipeline\'ы, агентов, автоматизации.',
  },
  {
    title: 'Уже пробовал, но не систематизировал',
    body: 'Промпты работают хаотично. Хочешь выстроить процесс, который масштабируется.',
  },
  {
    title: 'Строишь AI-продукт',
    body: 'Нужен практический фундамент: Claude Code, MCP, агенты, деплой — без воды.',
  },
  {
    title: 'Ценишь суверенитет',
    body: 'Walk-away экономика, open-source стек, никаких lock-in платформ.',
  },
]

const FAQ = [
  {
    q: 'Нужно ли уметь программировать?',
    a: 'Нет. Vibe coding — это подход где AI пишет код, а ты управляешь. Мы начинаем с нуля.',
  },
  {
    q: 'Что такое vibe coding?',
    a: 'Разработка в потоке: ты описываешь задачу, AI реализует, ты итерируешь. Скорость ×10.',
  },
  {
    q: 'Сколько времени нужно в неделю?',
    a: '30–60 минут на модуль + практика. Курс самостоятельный, без дедлайнов.',
  },
  {
    q: 'Чем отличается от других AI-курсов?',
    a: 'Мы не обзор нейросетей. Мы — практический стек: Claude Code, MCP, агенты, деплой, автоматизация.',
  },
]

export default function HomePage() {
  const lessons = getAllLessons()

  return (
    <>
      <Nav />

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
          ⬡ Открытый курс · Бесплатно
        </div>
        <h1 style={{
          fontSize: 'var(--display-size)',
          fontWeight: 900,
          lineHeight: 0.95,
          color: 'var(--text-primary)',
          marginBottom: '2rem',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
        }}>
          Точка<br />Сборки
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '560px',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
        }}>
          Курс по vibe-кодингу в потоке. От нонкодера до AI-generalist&apos;а — Claude Code, агенты, автоматизация, деплой.
        </p>

        {/* Stats bar */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          flexWrap: 'wrap',
          marginBottom: '2.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          {[
            ['7', 'модулей'],
            ['~12', 'часов'],
            ['8', 'упражнений'],
            ['$0', 'стоимость'],
          ].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-accent)', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            </div>
          ))}
        </div>

        <Link href="/login/" style={{
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
          Начать →
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
            Для кого
          </div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            marginBottom: '3rem',
            lineHeight: 1,
          }}>
            Этот курс для тебя, если...
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {FOR_WHO.map(item => (
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

      {/* ── ПРОГРАММА (ELVTR syllabus) ───────────────────────── */}
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
            Программа курса · {lessons.length} модулей
          </div>
          {lessons.map(lesson => (
            <Link key={lesson.slug} href={`/lessons/${lesson.slug}/`} style={{
              display: 'grid',
              gridTemplateColumns: '6rem 1fr auto',
              gap: '1.5rem',
              alignItems: 'start',
              padding: '1.5rem 0',
              borderBottom: '1px solid var(--border-color)',
              color: 'inherit',
              transition: 'opacity 0.2s',
            }}>
              <span style={{
                fontSize: 'var(--number-size)',
                fontWeight: 900,
                color: 'var(--border-color)',
                lineHeight: 0.85,
                letterSpacing: '-0.04em',
                userSelect: 'none',
              }}>
                {String(lesson.level).padStart(2, '0')}
              </span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--section-label-size)',
                  color: 'var(--text-accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: '0.4rem',
                }}>
                  Level {lesson.level} · {lesson.duration}
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.4rem',
                }}>
                  {lesson.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{lesson.description}</p>
              </div>
              <span style={{ color: 'var(--text-accent)', fontSize: '1.5rem', lineHeight: 1 }}>+</span>
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
            Вопросы
          </div>
          {FAQ.map(item => (
            <details key={item.q} style={{
              borderBottom: '1px solid var(--border-color)',
              padding: '1.25rem 0',
            }}>
              <summary style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                listStyle: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                {item.q}
                <span style={{ color: 'var(--text-accent)', fontSize: '1.25rem' }}>+</span>
              </summary>
              <p style={{
                marginTop: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                fontSize: '0.9rem',
              }}>
                {item.a}
              </p>
            </details>
          ))}
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
              Об авторе
            </div>
            <h2 style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              lineHeight: 0.95,
              marginBottom: '1.5rem',
            }}>
              Александр<br />Мамаев
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '1rem' }}>
              Vibe coder, AI builder, коуч. Строю системы на Claude Code + агентах. Курс — дистилляция того, что работает на практике.
            </p>
            <Link href="/feedback/" style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--text-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Оставить фидбек →
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
              alt="Александр Мамаев"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
            />
          </div>
        </div>
      </section>
    </>
  )
}
