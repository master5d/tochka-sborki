import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function AssemblyPoint({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>{'TODO: cold-open — the essay hook.'}</p>
        <h2>TODO: section 1</h2>
        <p>{'TODO'}</p>
        <h2>TODO: section 2</h2>
        <p>{'TODO'}</p>
        <h2>TODO: section 3</h2>
        <p>{'TODO'}</p>
      </div>
    )
  }

  return (
      <div className={styles.prose}>
        <p className={styles.lead}>{'TODO: cold-open — крючок эссе.'}</p>
        <h2>TODO: раздел 1</h2>
        <p>{'TODO'}</p>
        <h2>TODO: раздел 2</h2>
        <p>{'TODO'}</p>
        <h2>TODO: раздел 3</h2>
        <p>{'TODO'}</p>
      </div>
  )
}
