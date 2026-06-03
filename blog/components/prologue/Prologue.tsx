import styles from './Prologue.module.css'
import { Opening } from './sections/Opening'
import { ActOne } from './sections/ActOne'
import { ActTwo } from './sections/ActTwo'
import { ActThree } from './sections/ActThree'
import { Assembly } from './sections/Assembly'

type Locale = 'ru' | 'en'

export function Prologue({ locale }: { locale: Locale }) {
  return (
    <article lang={locale} className={styles.article}>
      <Opening locale={locale} />
      <ActOne locale={locale} />
      <ActTwo locale={locale} />
      <ActThree locale={locale} />
      <Assembly locale={locale} />
    </article>
  )
}
