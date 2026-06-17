import styles from '../Prologue.module.css'

type Props = { locale: 'ru' | 'en' }

export function Opening({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.opening}>
        <p className={styles.lead}>
          {'You open ChatGPT twenty times a day. You sit down to it assembled — almost never.'}
        </p>

        <p>
          {"Let's be honest, just between us, no one's listening. For the past couple of years"}
          {" there's been a quiet hum in the chest. Something broke — not in you specifically, but"}
          {' in the air itself. The old answers stopped answering. And you did what everyone does:'}
          {' found something to hide your confusion behind. People used to hide behind the expert,'}
          {" the diploma, the \"it'll make sense eventually.\" Now they hide behind a machine that"}
          {" produces confident text faster than you can feel that you don't understand what's"}
          {' happening at all. Convenient. And exactly for that reason — dangerous.'}
        </p>

        <p>
          {"Or maybe it's the opposite for you. You have a craft — you heal with your hands or"}
          {' your words, you lead groups, you write, you hold a paintbrush, you train a voice.'}
          {' Behind you are your own teachers, your own subtlety, gathered not from books but'}
          {' through the body, through years and mistakes. And you look at this wave — the speed,'}
          {' the interfaces, the people who say "prompt" with the same intonation people once'}
          {" reserved for \"prayer\" — and what washes over you isn't curiosity but a quiet dread."}
          {' That your craft will become useless. That the live contact you came for in the first'}
          {' place will dissolve into screens. And you decided the choice is simple: either you'}
          {" stay faithful to your work, or you betray it and climb into this new world. No middle"}
          {" ground. Between these two fears the space is very narrow, and there's no air to breathe."}
        </p>

        <p>
          {"I know this place — not from a book. I'm a life coach, I've been sitting with people"}
          {' in exactly this confusion for thirteen years, and in the evenings I build my own AI'}
          {" with my own hands. So let me be direct: the choice you've drawn for yourself is false."}
          {' There is no door with "faithful to your craft" on one side and "in the new world" on'}
          {" the other. The wall you feel doesn't run between you and the technology. It runs inside"}
          {" you. And as long as you treat it as external, you'll either hide behind the machine or"}
          {' hide from it — and both split you apart equally.'}
        </p>

        <p>I thought it was the end too. Here are three things that flip the picture.</p>

        <p>{'First: the map tore before AI arrived — it came in when the tearing was already underway.'}</p>

        <p>{"Second: AI doesn't have to be someone else's system behind a wall."}</p>

        <p>{"Third: whether you're assembled inside or fragmented is what decides what the tool becomes in your hands."}</p>
      </div>
    )
  }

  return (
    <div className={styles.opening}>
      <p className={styles.lead}>
        {'Ты открываешь ChatGPT по двадцать раз на дню. А садишься к нему собранным — почти никогда.'}
      </p>

      <p>
        {'Давай честно, наедине, никто не слышит. Последние пару лет в груди стоит тихий гул.'}
        {' Что-то сломалось — не у тебя конкретно, а вообще, в самом воздухе. Старые ответы перестали'}
        {' отвечать. И ты сделал то, что делают все: нашёл, за кого спрятать растерянность. Раньше'}
        {' прятали за экспертом, за дипломом, за «вот станет понятнее со временем». Теперь — за машиной,'}
        {' которая выдаёт уверенный текст быстрее, чем ты успеваешь почувствовать, что не понимаешь,'}
        {' что вообще происходит. Удобно. И ровно поэтому — опасно.'}
      </p>

      <p>
        {'А может, у тебя наоборот. У тебя есть ремесло — ты лечишь руками или словом, ведёшь группы,'}
        {' пишешь, держишь кисть, ставишь голос. За плечами свои учителя, своя тонкость, собранная не'}
        {' из книг, а телом, через годы и ошибки. И ты смотришь на эту волну — на скорость, на'}
        {' интерфейсы, на людей, которые говорят «промпт» с той интонацией, с какой раньше говорили'}
        {' «молитва», — и тебя накрывает не любопытство, а тихий ужас. Что твоё ремесло станет никому'}
        {' не нужно. Что живой контакт, ради которого ты вообще пришёл, растворится в экранах. И ты'}
        {' решил, что выбор простой: либо ты остаёшься верен своему делу, либо предаёшь его и лезешь'}
        {' в этот новый мир. Середины нет. Между этими двумя страхами очень узко, и там нечем дышать.'}
      </p>

      <p>
        {'Я знаю это место — не из книжки. Я лайф-коуч, тринадцать лет сижу с людьми ровно в этой'}
        {' растерянности, и сам по вечерам собираю свой AI руками. Так вот, прямо: выбор, который ты'}
        {' себе нарисовал, — фальшивый. Нет такой двери, по одну сторону которой ты честен своему делу,'}
        {' а по другую — в новом мире. Стена, которую ты чувствуешь, проходит не между тобой и'}
        {' технологией. Она проходит внутри тебя. И пока ты держишь её за внешнюю, ты будешь либо'}
        {' прятаться за машиной, либо прятаться от неё — и то, и другое расщепляет одинаково.'}
      </p>

      <p>Я тоже думал, что это конец. Дальше — три вещи, которые переворачивают картинку.</p>

      <p>{'Первая: карта порвалась не из-за AI — он пришёл, когда она уже рвалась.'}</p>

      <p>{'Вторая: AI не обязан быть чужой системой за стеной.'}</p>

      <p>{'Третья: то, собран ты внутри или расщеплён, и решает, чем станет инструмент в твоих руках.'}</p>
    </div>
  )
}
