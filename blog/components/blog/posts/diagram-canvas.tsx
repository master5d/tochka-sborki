import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function DiagramCanvas({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>{"The idea is clear in your head — and the canvas is still empty, because you've spent an hour nudging rectangles."}</p>
        <h2>What hurt</h2>
        <p>{"Any diagram editor turns a simple thought into busywork: draw a box, align it, run an arrow, fix it when everything shifts. By the time the diagram is ready the idea has gone cold and you've forgotten half the nuances."}</p>
        <h2>What I built</h2>
        <p>{"A canvas where you don't draw — you describe the meaning, and the layout and the shapes themselves get drawn by generators running in the background. The same material can be seen as a diagram, as an outline, or as calm reading text. You move meaning, not rectangles."}</p>
        <h2>How — without a team</h2>
        <p>{"I built it the same way I describe in the course: I didn't sit down to learn graph engines, I explained to an agent what should happen, and it laid out the shapes. The boring part — alignment, coordinates — the machine does itself."}</p>
        <div className={styles.boundary}>
          <b>AI takes:</b> layout, drawing, alignment.<br />
          <b>Stays yours:</b> the meaning, and how things connect.
        </div>
        <p><strong>{"Diagrams that took an hour in an editor now appear in minutes."}</strong></p>
        <p>{"It's one of the doors from "}<a href="/en/blog/horizons/">horizons</a>{" — the tool stepping in where the work was a tax on your attention, not the attention itself."}</p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>{"Идея ясная в голове — а на холсте всё ещё пусто, потому что ты час двигаешь прямоугольники."}</p>
      <h2>Что болело</h2>
      <p>{"Любой редактор схем превращает простую мысль в возню: нарисуй блок, выровняй, проведи стрелку, поправь, когда всё съехало. К моменту, когда схема готова, идея уже остыла, а половину нюансов ты забыл."}</p>
      <h2>Что я собрал</h2>
      <p>{"Холст, где ты не рисуешь, а описываешь смысл — а раскладку и сами фигуры дорисовывают генераторы, работающие в фоне. Один и тот же материал можно смотреть как схему, как план-структуру или как спокойный текст для чтения. Ты двигаешь смысл, а не прямоугольники."}</p>
      <h2>Как — без команды</h2>
      <p>{"Я собрал это тем же способом, что описываю в курсе: не садился учить графовые движки, а объяснял агенту, что должно происходить, и он раскладывал фигуры. Скучную часть — выравнивание, координаты — машина делает сама."}</p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> раскладку, рисование, выравнивание.<br />
        <b>Остаётся твоим:</b> смысл и то, как связаны вещи.
      </div>
      <p><strong>{"Схемы, на которые уходил час в редакторе, рождаются за минуты."}</strong></p>
      <p>{"Это одна из дверей из "}<a href="/blog/horizons/">горизонтов</a>{" — инструмент заходит туда, где работа была налогом на внимание, а не самим вниманием."}</p>
    </div>
  )
}
