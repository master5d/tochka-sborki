import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function TheSiteItself({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>{"The most honest proof of a course isn't a screenshot or a testimonial. It's the thing you're standing on right now."}</p>
        <h2>What hurt</h2>
        <p>{"Making a real learning product is usually a team: frontend, backend, a designer, someone on content. For one person it never got off the ground — the barrier was too high."}</p>
        <h2>What I built</h2>
        <p>{"The platform you're reading this on: with an AI mentor, a world map, quests, and an intake that tunes the path to you. Not a landing page \"about the course\" — the course itself, as a living product."}</p>
        <h2>How — without a team</h2>
        <p>{"With the same vibe-coding the course teaches. The agents were my team: I held the pedagogy and the voice, they wrote the code and assembled the plumbing. What used to feel \"only for techies with a budget\" came together solo."}</p>
        <div className={styles.boundary}>
          <b>AI takes:</b> the code, the plumbing, executing the design.<br />
          <b>Stays yours:</b> what to teach, in what voice, and why.
        </div>
        <p><strong>{"A whole learning product built solo, without a classic dev team."}</strong></p>
        <p>{"Where all of this began, and why the tool first felt like the enemy — I worked through it in the "}<a href="/en/blog/prologue/">prologue</a>{"."}</p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>{"Самый честный пруф курса — не скриншот и не отзыв. Это то, на чём ты сейчас стоишь."}</p>
      <h2>Что болело</h2>
      <p>{"Сделать настоящий обучающий продукт — это обычно команда: фронтенд, бэкенд, дизайнер, человек на контент. У одного человека до этого не доходили руки — слишком большой порог."}</p>
      <h2>Что я собрал</h2>
      <p>{"Платформу, на которой ты читаешь это: с AI-ментором, картой мира, квестами и анкетой, которая подстраивает путь под тебя. Не лендинг «о курсе», а сам курс как живой продукт."}</p>
      <h2>Как — без команды</h2>
      <p>{"Тем же vibe-кодингом, которому учит курс. Агенты были моей командой: я держал педагогику и голос, они писали код и собирали обвязку. То, что раньше казалось «только для технарей с бюджетом», собралось в одиночку."}</p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> код, обвязку, исполнение дизайна.<br />
        <b>Остаётся твоим:</b> чему учить, каким голосом и зачем.
      </div>
      <p><strong>{"Целый обучающий продукт собран в одиночку, без классической команды разработки."}</strong></p>
      <p>{"С чего всё это началось и почему инструмент сначала казался врагом — в "}<a href="/blog/prologue/">прологе</a>{"."}</p>
    </div>
  )
}
