import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function SecondBrain({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>{"You have hundreds of notes — and you remember less than a tenth of them. The archive exists; the use of it doesn't."}</p>
        <h2>What hurt</h2>
        <p>{"I write down thoughts, save articles, keep notes — and almost never come back to them. The knowledge sits as dead weight: to find something you have to remember where it is, and remembering is exactly what fails."}</p>
        <h2>What I built</h2>
        <p>{"A knowledge graph — a second brain. It takes in my notes, sources and experience, links them to each other, and answers questions from them. Not a word search, but a conversation with my own archive — one that remembers what I forgot."}</p>
        <h2>How — without a team</h2>
        <p>{"Vibe-coding again: I didn't build search engines by hand, I explained to an agent how it should work — indexing, links, retrieval fell to the machine. My part is deciding what's worth putting in there in the first place."}</p>
        <div className={styles.boundary}>
          <b>AI takes:</b> indexing, the connections, retrieval.<br />
          <b>Stays yours:</b> what counts as important — and the thoughts themselves.
        </div>
        <p><strong>{"Stopped losing ideas — I query my own archive like a living interlocutor."}</strong></p>
        <p>{"This is one of the four doors from "}<a href="/en/blog/horizons/">horizons</a>{": the machine extending the reach of your mind without replacing it."}</p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>{"У тебя сотни заметок — и ты не помнишь и десятой части. Архив есть, а толку от него мало."}</p>
      <h2>Что болело</h2>
      <p>{"Я записываю мысли, сохраняю статьи, веду конспекты — и почти никогда к ним не возвращаюсь. Знание лежит мёртвым грузом: чтобы что-то найти, надо вспомнить, где оно, а вспомнить как раз и не получается."}</p>
      <h2>Что я собрал</h2>
      <p>{"Граф знаний — второй мозг. Он вбирает мои заметки, источники и опыт, связывает их между собой и отвечает на вопросы по ним же. Не поиск по словам, а разговор с собственным архивом, который помнит то, что забыл я."}</p>
      <h2>Как — без команды</h2>
      <p>{"Снова vibe-кодинг: я не строил поисковые движки руками, а объяснял агенту, как это должно работать, — индексация, связи, извлечение легли на машину. Моя часть — решать, что вообще стоит туда класть."}</p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> индексацию, связи, извлечение.<br />
        <b>Остаётся твоим:</b> что считать важным — и сами мысли.
      </div>
      <p><strong>{"Перестал терять идеи — спрашиваю собственный архив как живого собеседника."}</strong></p>
      <p>{"Это одна из четырёх дверей из "}<a href="/blog/horizons/">горизонтов</a>{": машина расширяет охват ума, не подменяя его."}</p>
    </div>
  )
}
