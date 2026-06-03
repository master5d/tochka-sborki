import styles from '../Prologue.module.css'
import { IntelligenceCurves } from '../PrologueDiagrams'

type Props = { locale: 'ru' | 'en' }

export function ActTwo({ locale }: Props) {
  if (locale === 'en') {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Act II. The Monolith Will Lose</h2>

        <IntelligenceCurves />

        <p>
          {'When the word "AI" comes up, you probably picture the same image every time. The'}
          {" OpenAI logo. Endless threads about Sam Altman. Elon's voice. Chinese labs no one has"}
          {' seen in person. Server farms somewhere in Oregon, humming like hives. And over all of'}
          {" it — the feeling that you're on one side of a door, and they're over there, behind it,"}
          {" doing something enormous, alien, and they're not asking you. This equation — AI ="}
          {' OpenAI = Silicon Valley = someone else\'s corporate thing — feels natural. Not because'}
          {" you're lazy about thinking. But because that exact image runs in the news from morning"}
          {" to evening, in your acquaintances' posts, in the voices of people you've learned to"}
          {' trust. When ninety percent of the signal about AI is news about five corporations, the'}
          {' brain honestly concludes: AI is those five corporations. That\'s not stupidity. That\'s'}
          {' normal operation of attention in an overloaded environment. I thought the same way'}
          {' until a couple of years ago.'}
        </p>

        <p>{'The common assumption: AI is five companies. The reality: two curves, running in opposite directions. The arithmetic here is simple. And counterintuitive.'}</p>

        <p>
          {'The first curve. The S-curve of centralized AI is flattening. That\'s a fact, not a'}
          {' forecast. Each successive leap — from GPT-3 to GPT-4, from GPT-4 to the next model —'}
          {' costs not twice as much but orders of magnitude more than the previous one. Training a'}
          {' single large model today costs hundreds of millions of dollars; tomorrow it will cost'}
          {' billions. The companies themselves acknowledge this in their filings. The progress'}
          {' curve of large monolithic models is bending not because engineers are tired, but'}
          {' because physics and economics are pressing from the other side. The further you go, the'}
          {' more expensive each next step. And the fewer companies in the world that physically'}
          {' have the money to take it.'}
        </p>

        <p>
          {'The second curve. The cost of a local "person+machine" node is falling along the'}
          {" opposite trajectory — exponentially downward. What required a data center five years"}
          {' ago fits in a home server for a thousand dollars today. The model running at my house'}
          {" is not inferior to last year's ChatGPT on most of the tasks I give it. In a year it"}
          {" will be smarter. In two — it will know me the way no service ever will. People who"}
          {" have the desire and a thousand dollars for hardware — there aren't ten or a hundred"}
          {' of them in the world, there are hundreds of millions. Soon there will be billions.'}
        </p>

        <p>
          {"The crossover point. What wins there isn't one super-intelligence in a California data"}
          {' center. What wins is a network. A network of millions of intimate, personal nodes,'}
          {' where each node is a specific person with their own model, their own memory, their own'}
          {" voice, their own map of knowledge. Not one great brain from above. Countless warm"}
          {" nodes from below. That's not utopia and not science fiction. That's the arithmetic of"}
          {' two exponentials.'}
        </p>

        <p>
          {"I'm saying this not from a textbook — I'm building such a node with my own hands."}
          {' Local models that answer in my voice and remember my conversations; a map of'}
          {" everything I've ever read and said. Not a corporate product and not a startup under"}
          {" a funding round. Just a workshop — what used to be called a notebook and a circle of"}
          {' students, now living on my hardware.'}
        </p>

        <p>{'So — directly, without hedging.'}</p>

        <p>
          <strong>
            {'AI can become your personal instrument — assembled around your practice, living on'}
            {' your hardware, reflecting your voice. That is already technically possible today.'}
          </strong>{' '}
          {"Not in five years. Not \"when the kids grow up.\" Today, for the price of a used car,"}
          {" you put a helper at home that knows you better than any corporation and belongs to"}
          {" you. The one big door you were standing in front of — it isn't the only one."}
          {" There are many, and some lead into your own room, not into someone else's server farm."}
        </p>

        <p>{'But even a personal AI is useless if the person it amplifies is fragmented.'}</p>

        <p>
          {"And this is where everything hits a wall. You can build the most refined assistant, the"}
          {' most precise knowledge map, the most elegant set of agents — and discover that inside'}
          {' you there are two people looking at each other without recognition. The tool amplifies'}
          {' whoever is using it. Assembled inside — it amplifies the assembly. A wall inside —'}
          {" it amplifies the wall, makes it thicker and more opaque. The next question isn't"}
          {' technological. It isn\'t "which model to run." It\'s internal: what you need to become'}
          {" so that what you build with your hands doesn't split you apart for good. That's what"}
          {' the next act is about.'}
        </p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHeading}>Акт II. Монолит проиграет</h2>

      <IntelligenceCurves />

      <p>
        {'Когда звучит слово «AI», у тебя в голове, скорее всего, всплывает одна и та же картинка.'}
        {' Логотип OpenAI. Бесконечные ленты про Сэма Альтмана. Голос Маска. Китайские'}
        {' лаборатории, которых никто живьём не видел. Серверные где-то в Орегоне, гудящие,'}
        {' как ульи. И поверх всего — ощущение, что ты с одной стороны двери, а они там,'}
        {' за дверью, делают что-то огромное, чужое, и тебя не спрашивают. Это равенство —'}
        {' AI = OpenAI = Кремниевая долина = чужая корпоративная штука — кажется естественным.'}
        {' Не потому что ты ленишься думать. А потому что именно эта картинка с утра до вечера'}
        {' крутится в новостях, в постах знакомых, в голосах тех, кому ты привык верить. Если'}
        {' девяносто процентов сигнала про AI — это новости про пять корпораций, мозг'}
        {' честно делает вывод: AI и есть пять корпораций. Это не глупость. Это нормальная работа'}
        {' внимания в перегруженной среде. Я сам так думал ещё пару лет назад.'}
      </p>

      <p>{'Принято считать, что AI — это пять компаний. Реально — две кривые, и они идут в разные стороны. Здесь арифметика проста. И контринтуитивна.'}</p>

      <p>
        {'Первая кривая. S-кривая централизованного AI выравнивается. Это факт, не прогноз.'}
        {' Каждый следующий рывок — от GPT-3'}
        {' к GPT-4, от GPT-4 к следующей модели — стоит уже не в разы, а в порядки дороже'}
        {' предыдущего. Тренировка одной большой модели сегодня стоит сотни миллионов долларов;'}
        {' завтра — миллиарды. Это признают сами компании в своих отчётах.'}
        {' Кривая прогресса больших монолитных моделей загибается не потому, что инженеры устали,'}
        {' а потому что физика и экономика давят с другой стороны. Чем дальше — тем'}
        {' дороже каждый следующий шаг. И тем меньше остаётся компаний в мире, у которых физически'}
        {' есть деньги его сделать.'}
      </p>

      <p>
        {'Вторая кривая. Стоимость локального узла «человек+машина» падает по противоположной траектории'}
        {' — экспоненциально вниз. То, для чего пять лет назад нужен был дата-центр, сегодня'}
        {' помещается в домашний сервер за тысячу долларов. Модель, которая работает у меня дома,'}
        {' не уступает прошлогоднему ChatGPT в большинстве задач, которые я ей даю. Через год она'}
        {' будет умнее. Через два — будет помнить меня так, как ни один сервис никогда не будет'}
        {' помнить. Таких людей, у которых есть желание и тысяча долларов на железо —'}
        {' в мире не десять и не сто, а сотни миллионов. Скоро будут миллиарды.'}
      </p>

      <p>
        {'Точка пересечения. В ней побеждает не один сверх-разум в калифорнийском дата-центре.'}
        {' Побеждает сеть. Сеть из миллионов интимных, личных узлов, где каждый узел — конкретный'}
        {' человек со своей моделью, своей памятью, своим голосом, своей картой знаний.'}
        {' Не один великий мозг сверху. Множество тёплых узлов снизу.'}
        {' Это не утопия и не фантастика. Это арифметика двух экспонент.'}
      </p>

      <p>
        {'Я говорю это не из учебника — я сам собираю такой узел руками. Локальные модели, которые'}
        {' отвечают моим голосом и помнят мои разговоры; карта всего, что я когда-либо читал и'}
        {' говорил. Не корпоративный продукт и не стартап под раунд. Просто мастерская — то, что'}
        {' раньше называлось бы записной книжкой и кругом учеников, а сейчас живёт на моём железе.'}
      </p>

      <p>{'Поэтому — прямо, без обтеканий.'}</p>

      <p>
        <strong>
          {'AI может стать твоим личным инструментом — собранным под твою практику, живущим'}
          {' на твоём железе, отражающим твой голос. Это уже инженерно возможно сегодня.'}
        </strong>{' '}
        {'Не через пять лет. Не «когда вырастут дети». Сегодня, за стоимость подержанной машины,'}
        {' ты ставишь дома помощника, который знает тебя лучше любой корпорации и принадлежит тебе.'}
        {' Большая дверь, перед которой ты стоял — не одна.'}
        {' Их много, и часть ведёт в твою собственную комнату, не в чужую серверную.'}
      </p>

      <p>{'Но даже личный AI бесполезен, если человек, которым он усиливается, расщеплён.'}</p>

      <p>
        {'И вот здесь всё утыкается в стену. Можно собрать самого тонкого помощника, самую точную'}
        {' карту знаний, самый красивый набор агентов — и обнаружить, что внутри тебя два человека'}
        {' смотрят друг на друга и не узнают. Инструмент усиливает того, кто им пользуется.'}
        {' Внутри собранность — усиливает собранность.'}
        {' Внутри стенка — усиливает стенку, делает её толще и непрозрачнее.'}
        {' Следующий вопрос — не технологический. Не «какую модель ставить».'}
        {' Внутренний: чем тебе стать, чтобы то, что ты собираешь руками, не разорвало тебя окончательно. Об этом — следующий акт.'}
      </p>
    </section>
  )
}
