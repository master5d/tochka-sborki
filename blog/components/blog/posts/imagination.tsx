import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function Imagination({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>
          {"You have a hundred ideas. A product, an automation, a project you've wanted for years."}
          {' And not one of them reaches the doing. The easy explanation is "I have no imagination."'}
          {" It's the wrong one — and it's the very thing that keeps you on the sidelines."}
        </p>

        <p>
          {'The image of the result is almost always there. You can picture the app, the newsletter,'}
          {' the little machine that would do the boring part for you. Imagination is not the'}
          {" bottleneck. The bottleneck sits one step later — between the image in your head and a"}
          {' task you could hand to someone (or something) and get the result back.'}
        </p>

        <h2>What actually stops you</h2>
        <p>
          {"It's the inability to translate imagination into a written task. Not the dream — the"}
          {' spec. The image is rich and silent; a task is explicit and a little ruthless: what'}
          {' exactly, in what form, done how, and how would I know it worked. Most people never'}
          {' cross that gap, so the idea stays a mood instead of becoming a result.'}
        </p>
        <p>
          {'AI does not remove this skill. This is the part everyone gets backwards. The tool'}
          {" doesn't think the task up for you — it *rewards* the one who can state it. Give it a"}
          {' clear task and it multiplies you. Give it a fog and it returns a bigger, glossier fog.'}
        </p>

        <h2>Three stages, and the order matters</h2>
        <div className={styles.boundary}>
          <b>1. Imagination</b> — you have the image of the result. You always did.<br />
          <b>2. Task</b> — you learn to <i>write</i> that image as a task and carry it out <b>together with the AI</b>, staying in the loop: you check, you fix, you ask again.<br />
          <b>3. Automation</b> — only once writing and verifying a task works reliably do you hand the loop to an agent.
        </div>
        <p>
          {'The trap is skipping straight to stage three. Everyone wants the self-running machine'}
          {' before they can write and check a single task by hand. But automation built on top of'}
          {' a task you can\'t yet verify just runs your confusion faster.'}
        </p>

        <h2>What to do first</h2>
        <p>
          {'Take one idea. Not the biggest — the nearest. Write it as a task: the result you want,'}
          {' the inputs, the shape of the output, the one line that tells you it\'s done. Then do it'}
          {' with the AI, hand in hand — correct it, watch where it drifts, sharpen the task. Do that'}
          {' three times and something shifts: the wall was never imagination. It was a skill you'}
          {' simply hadn\'t practised. Automation is the next horizon. This one comes first.'}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>
        {'У тебя сто идей. Продукт, автоматизация, проект, который ты хотел годами. И ни одна не'}
        {' доходит до дела. Простое объяснение — «у меня нет воображения». Оно неверное — и именно'}
        {' оно держит тебя в стороне.'}
      </p>

      <p>
        {'Образ результата почти всегда есть. Ты можешь представить приложение, рассылку, маленькую'}
        {' машинку, которая делала бы за тебя скучную часть. Воображение — не узкое горлышко. Узкое'}
        {' горлышко на шаг позже — между образом в голове и задачей, которую можно кому-то (или'}
        {' чему-то) отдать и получить результат назад.'}
      </p>

      <h2>Что на самом деле останавливает</h2>
      <p>
        {'Неспособность перевести воображение в написанную задачу. Не мечту — спецификацию. Образ'}
        {' богатый и немой; задача — явная и чуть безжалостная: что именно, в каком виде, как сделать'}
        {' и как я пойму, что получилось. Большинство так и не переходит этот разрыв, и идея остаётся'}
        {' настроением, а не результатом.'}
      </p>
      <p>
        {'AI этот навык не отменяет. Вот что все понимают наоборот. Инструмент не придумывает задачу'}
        {' за тебя — он *вознаграждает* того, кто умеет её поставить. Дай ему чёткую задачу — он'}
        {' умножит тебя. Дай туман — вернёт туман побольше и поглянцевее.'}
      </p>

      <h2>Три ступени, и порядок важен</h2>
      <div className={styles.boundary}>
        <b>1. Воображение</b> — у тебя есть образ результата. Он всегда был.<br />
        <b>2. Задача</b> — ты учишься <i>писать</i> этот образ как задачу и выполнять её <b>вместе с AI</b>, оставаясь в цикле: проверяешь, правишь, снова просишь.<br />
        <b>3. Автоматизация</b> — и только когда писать и проверять задачу получается надёжно, ты отдаёшь цикл агенту.
      </div>
      <p>
        {'Ловушка — перепрыгнуть сразу на третью ступень. Все хотят самоходную машину раньше, чем'}
        {' научатся написать и проверить хотя бы одну задачу руками. Но автоматизация поверх задачи,'}
        {' которую ты ещё не умеешь проверить, просто гоняет твою растерянность быстрее.'}
      </p>

      <h2>С чего начать</h2>
      <p>
        {'Возьми одну идею. Не самую большую — ближайшую. Напиши её как задачу: нужный результат,'}
        {' входные данные, форму ответа, ту самую строчку, по которой поймёшь, что готово. Потом'}
        {' сделай её с AI, рука об руку — правь, смотри, где его уводит, оттачивай задачу. Сделай так'}
        {' три раза — и что-то сместится: стеной было не воображение. Это был навык, который ты'}
        {' просто не тренировал. Автоматизация — следующий горизонт. Этот — первый.'}
      </p>
    </div>
  )
}
