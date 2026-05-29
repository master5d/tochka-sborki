'use client'

import styles from '../Prologue.module.css'

type Props = { locale: 'ru' | 'en' }

const track = (door: 'telegram' | 'course') => {
  if (typeof window === 'undefined') return
  // @ts-expect-error analytics global is optional
  window.plausible?.('prologue_cta_clicked', { props: { door } })
}

export function DoubleDoor({ locale }: Props) {
  if (locale === 'en') throw new Error('EN translation pending')

  return (
    <div className={styles.doubleDoor}>
      <h2 className={styles.doubleDoorHeading}>Дальше — два входа</h2>

      <div className={styles.doorsGrid}>
        {/* Telegram door */}
        <a
          href="https://t.me/ku_shaman"
          target="_blank"
          rel="noopener"
          className={styles.doorCard}
          onClick={() => track('telegram')}
        >
          <div className={styles.doorLabel}>Telegram</div>
          <div className={styles.doorTitle}>@ku_shaman</div>
          <p className={styles.doorBody}>
            Если хочешь следить за тем, как это разворачивается в реальном времени — я думаю
            вслух в канале. Не сводки результатов и не контент по расписанию, а живой процесс:
            заметки на полях, вопросы без ответов, иногда тупики и откаты. Просто живой человек
            рядом с инструментом, который пробует вслух.
          </p>
        </a>

        {/* Course door */}
        <a
          href="https://ai.mamaev.coach"
          className={styles.doorCard}
          onClick={() => track('course')}
        >
          <div className={styles.doorLabel}>Курс</div>
          <div className={styles.doorTitle}>ai.mamaev.coach</div>
          <p className={styles.doorBody}>
            Если хочешь практику — курс полностью бесплатный и открытый: никакой карточки при
            регистрации, никаких закрытых модулей, никакой идеологической платы за вход. Он
            работает с Claude Code, Codex и Hermes — ты выбираешь инструмент, который уже есть
            рядом или который ближе по духу. Начни с Kickstart — там карта местности, чтобы
            не теряться в начале. Дальше идёшь в своём темпе, в своей тишине.
          </p>
        </a>
      </div>
    </div>
  )
}
