import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function Echo({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>{"A thought is always faster than fingers. You catch the exact phrasing — and lose it while you finish typing the sentence."}</p>
        <h2>What hurt</h2>
        <p>{"I think out loud better than I type. But the dictation tools at hand kept letting me down: some need the internet and ship your voice to someone else's server; others stumble the moment an English word lands inside a Russian phrase. And for me every other sentence is bilingual."}</p>
        <h2>What I built</h2>
        <p>{"Echo — a desktop app that listens and turns speech into text right on your own machine. Offline, no cloud. It doesn't break when you switch Russian↔English mid-sentence, and it runs on the GPU, so it isn't slow. It can even sit in on a meeting and write the brief itself — who said what, and what was agreed."}</p>
        <h2>How — without a team</h2>
        <p>{"I don't \"know\" the Rust and Tauri it's built on. I took an open-source base and from there described to an agent, in words, what I wanted: \"let it switch languages,\" \"let it save the note to a file.\" It wrote the code, I tested it on myself. That's how a tool that would once have needed a whole team grew solo."}</p>
        <div className={styles.boundary}>
          <b>AI takes:</b> speech recognition, translating intent into code, the rough meeting brief.<br />
          <b>Stays yours:</b> what exactly to say — and the final word on the text.
        </div>
        <p><strong>{"I now dictate emails, notes and code — typing took a back seat."}</strong></p>
        <p>{"This is one of the four \"doors\" I wrote about in "}<a href="/en/blog/horizons/">horizons</a>{". If you want to build your own tool for your own task — that's where the course begins."}</p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>{"Мысль всегда быстрее пальцев. Ты ловишь точную формулировку — и теряешь её, пока добиваешь предложение на клавиатуре."}</p>
      <h2>Что болело</h2>
      <p>{"Я думаю вслух лучше, чем печатаю. Но диктовки, что были под рукой, всё время подводили: одни требуют интернет и отправляют твой голос на чужой сервер, другие спотыкаются, как только в русскую фразу влетает английское слово. А у меня каждое второе предложение — двуязычное."}</p>
      <h2>Что я собрал</h2>
      <p>{"Echo — настольное приложение, которое слушает и превращает речь в текст прямо на твоём компьютере. Офлайн, без облака. Оно не ломается на переключении русский↔английский посреди фразы и работает на видеокарте, так что не тормозит. А ещё умеет сидеть на встрече и сам писать конспект — кто что сказал и о чём договорились."}</p>
      <h2>Как — без команды</h2>
      <p>{"Я не «знаю» Rust и Tauri, на которых оно собрано. Я взял открытую заготовку и дальше описывал агенту словами, что хочу: «пусть переключает языки», «пусть сохраняет заметку в файл». Он писал код, я проверял на себе. Так в одиночку вырос инструмент, который раньше требовал бы целой команды."}</p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> распознавание речи, перевод намерения в код, черновой конспект встречи.<br />
        <b>Остаётся твоим:</b> что именно сказать — и финальное слово в тексте.
      </div>
      <p><strong>{"Письма, заметки и код теперь надиктовываю — печать ушла на второй план."}</strong></p>
      <p>{"Это одна из четырёх «дверей», о которых я писал в "}<a href="/blog/horizons/">горизонтах</a>{". Если хочешь собрать свой инструмент под свою задачу — с этого начинается курс."}</p>
    </div>
  )
}
