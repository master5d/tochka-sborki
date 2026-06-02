import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function Horizons({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>
          {'You already ask ChatGPT about recipes, horoscopes, and copy — and quietly decided that this is AI. That\'s like buying a grand piano and pressing one key.'}
        </p>

        <p>
          {'Let\'s be honest: you use AI every day and still don\'t know what you can actually do with it.'}
          {' Not because you\'re slow — because nobody showed you the menu. You\'ve seen one corner:'}
          {' "ask — get an answer." But behind that corner there\'s a whole room you\'ve never'}
          {' looked into.'}
        </p>

        <p>
          {'Here are four doors into that room. Not "the revolution" and not "the future is now" —'}
          {' calm, concrete things that people without a single line of code are doing right now.'}
          {' And for each one I\'ll mark separately what the machine takes on, and what stays yours'}
          {' alone. Because that\'s the whole point.'}
        </p>

        <h2>Talking to the tool instead of fighting it</h2>
        <p>
          {'The most maddening thing about any complex software isn\'t the idea — it\'s the two'}
          {' thousand buttons between you and the idea. You catch the mood, you sit down — and you'}
          {' spend two hours hunting for the right button so it records the way you want. AI closes'}
          {' that gap: you describe in words what you\'re after — "a deep rumble, like from underwater,"'}
          {' "light like a room at four in the morning" — and it assembles a draft you then finish'}
          {' by hand. You don\'t adapt to the program. The program learns your language.'}
        </p>
        <div className={styles.boundary}>
          <b>AI takes:</b> translating your words into the tool's actions, the rough assembly.<br />
          <b>Stays yours:</b> what exactly you want to say, and when "enough" is enough.
        </div>

        <h2>Attracting clients without becoming a content factory</h2>
        <p>
          {'The first year in a new profession always comes with the question "where will the people'}
          {' come from." The usual answer — "post every day, run a blog, push the stories" — and'}
          {' you burn out before the first client arrives. AI takes the factory part off your hands:'}
          {' it finds who you can be useful to, prepares draft letters and pitches for your edits,'}
          {' keeps the threads of conversations so no one falls through the cracks. You don\'t turn'}
          {' into a broadcast machine. You free your hands for the reason you got into this'}
          {' profession in the first place.'}
        </p>
        <div className={styles.boundary}>
          <b>AI takes:</b> research, drafts, follow-up, the grind of follow-through.<br />
          <b>Stays yours:</b> who you want to work with and what voice you use with them.
        </div>

        <h2>Putting routine on an agent</h2>
        <p>
          {'There is work that\'s a shame to give your attention to: scheduling, sorting email, the'}
          {' tedious admin of a project or nonprofit you care about. That\'s not creativity — it\'s'}
          {' a tax on creativity. This is where an agent steps in: not a one-off chat reply but a'}
          {' small helper that handles the repeatable on its own, by your rules, and calls you only'}
          {' when a live decision is genuinely needed. You stop being the secretary of your own'}
          {' operation.'}
        </p>
        <div className={styles.boundary}>
          <b>AI takes:</b> the repeatable and the predictable.<br />
          <b>Stays yours:</b> the rules, the exceptions, and everything that needs a real choice.
        </div>

        <h2>Amplifying the craft without replacing the voice</h2>
        <p>
          {'And here is the boundary worth naming out loud, because it\'s the one people fear most.'}
          {' AI doesn\'t have to write for you. If your work is your voice — text, music, the way'}
          {' you hold someone in a session — handing that voice to the machine means stopping being'}
          {' yourself. But amplifying it is something else entirely. Unfolding a thought without'}
          {' losing the thread. Remembering what you yourself said three years ago. Getting the clay'}
          {' you then shape. The tool extends the reach of the craft; it doesn\'t replace the hand.'}
        </p>
        <div className={styles.boundary}>
          <b>AI takes:</b> structure, memory, the raw clay.<br />
          <b>Stays yours:</b> the voice, the taste, the final word — always.
        </div>

        <h2>What all four doors have in common</h2>
        <p>
          {'In none of them does the machine step into your place. It steps alongside you and takes'}
          {' what was eating your time and your nerves — so there\'s more of you, not less.'}
        </p>

        <p>
          <strong>{'A good AI doesn\'t make you someone else. It gives you the space to be yourself at greater scale.'}</strong>
        </p>

        <p>
          {'And yes — you weren\'t supposed to know all this in advance. If you just read this list'}
          {' and thought "wait, that was an option?" — that\'s not a gap in you. That\'s exactly the'}
          {' point everyone starts from. Where all of this comes from, and why the tool started'}
          {' feeling like the enemy — I worked through that in the '}
          <a href="/en/blog/prologue/">prologue</a>{'. Next step: pick one door and push it open.'}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>
        {'Ты уже спрашиваешь ChatGPT про рецепты, гороскоп и тексты — и тихо решил, что это и есть AI. Это как купить рояль и трогать одну клавишу.'}
      </p>

      <p>
        {'Давай честно: ты пользуешься AI каждый день и при этом не знаешь, что им вообще можно.'}
        {' Не потому что глупый — потому что никто не показал меню. Ты видел один угол: «спроси —'}
        {' получи ответ». А за этим углом целая комната, в которую ты просто не заглядывал.'}
      </p>

      <p>
        {'Вот четыре двери в эту комнату. Не «революция» и не «будущее уже здесь» — спокойные,'}
        {' конкретные вещи, которые люди без единой строчки кода делают уже сейчас. И в каждой я'}
        {' отдельно помечу, что берёт на себя машина, а что остаётся только твоим. Потому что'}
        {' в этом весь фокус.'}
      </p>

      <h2>Говорить с инструментом, а не воевать с ним</h2>
      <p>
        {'Самое бесячее в любом сложном софте — это не идея, а две тысячи кнопок между тобой и'}
        {' идеей. Поймал настроение, сел — и два часа ищешь, куда нажать, чтобы записалось как'}
        {' надо. AI убирает этот зазор: ты описываешь словами, что хочешь — «глухой гул, как'}
        {' из-под воды», «свет, как в комнате в четыре утра», — а он собирает заготовку, которую'}
        {' ты дальше доводишь руками. Не ты подстраиваешься под программу. Программа учится'}
        {' твоему языку.'}
      </p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> перевод твоих слов в действия инструмента, черновую сборку.<br />
        <b>Остаётся твоим:</b> что именно ты хочешь сказать и когда сказано «достаточно».
      </div>

      <h2>Привлекать клиентов, не превращаясь в контент-завод</h2>
      <p>
        {'Первый год в новой профессии — это всегда вопрос «откуда возьмутся люди». Привычный'}
        {' ответ — «постись каждый день, веди блог, гони сторис», — и ты выгораешь раньше, чем'}
        {' приходит первый клиент. AI снимает с тебя именно фабрику: находит, кому ты можешь быть'}
        {' полезен, готовит черновики писем и откликов под твою правку, держит хвосты переписок,'}
        {' чтобы никто не потерялся. Ты не превращаешься в автомат рассылки. Ты освобождаешь руки'}
        {' для того, ради чего вообще пришёл в профессию.'}
      </p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> ресёрч, черновики, follow-up, рутину дотягивания.<br />
        <b>Остаётся твоим:</b> с кем ты хочешь работать и каким голосом с ними говоришь.
      </div>

      <h2>Посадить рутину на агента</h2>
      <p>
        {'Есть работа, которую жалко отдавать своему вниманию: расписание, разбор почты, занудная'}
        {' админка проекта или нон-профита, который тебе дорог. Это не творчество — это налог на'}
        {' творчество. Сюда заходит агент: не разовый ответ в чате, а маленький помощник, который'}
        {' делает повторяемое сам, по твоим правилам, и зовёт тебя только когда правда нужно живое'}
        {' решение. Ты перестаёшь быть секретарём собственного дела.'}
      </p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> повторяемое и предсказуемое.<br />
        <b>Остаётся твоим:</b> правила, исключения и всё, где нужен живой выбор.
      </div>

      <h2>Усилить ремесло, не подменив голос</h2>
      <p>
        {'А вот граница, которую важно проговорить вслух, потому что её боятся чаще всего. AI не'}
        {' обязан писать за тебя. Если твоё дело — это голос (текст, музыка, то, как ты держишь'}
        {' человека в сессии), отдать этот голос машине — значит перестать быть собой. Но усилить'}
        {' его — совсем другое. Разложить мысль, не потеряв нить. Вспомнить то, что ты сам говорил'}
        {' три года назад. Получить глину, из которой лепишь ты. Инструмент расширяет охват'}
        {' ремесла, а не заменяет руку.'}
      </p>
      <div className={styles.boundary}>
        <b>AI берёт:</b> структуру, память, черновую глину.<br />
        <b>Остаётся твоим:</b> голос, вкус и последнее слово — всегда.
      </div>

      <h2>Что общего у всех четырёх дверей</h2>
      <p>
        {'Ни в одной из них машина не встаёт на твоё место. Она встаёт рядом и забирает то, что'}
        {' и так съедало твоё время и нервы, — чтобы тебя самого стало больше, а не меньше.'}
      </p>

      <p>
        <strong>{'Хороший AI не делает тебя кем-то другим. Он даёт тебе быть собой в большем масштабе.'}</strong>
      </p>

      <p>
        {'И да — ты не обязан был знать всё это заранее. Если ты сейчас прочитал список и подумал'}
        {' «а так можно было?» — это не пробел в тебе. Это та самая точка, с которой начинают все.'}
        {' Откуда это вообще берётся и почему инструмент стал казаться врагом — я разобрал в'}
        {' '}<a href="/blog/prologue/">прологе</a>{'. А дальше — просто выбрать одну дверь и приоткрыть.'}
      </p>
    </div>
  )
}
