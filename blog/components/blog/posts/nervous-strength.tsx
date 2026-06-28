import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function NervousStrength({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>
          {"We got the button. Knowledge, one press away: ask anything and a second later you have an answer thorough enough for a thesis. Exactly what was promised. So where does the low, background hum come from — the sense that you're always slightly not coping?"}
        </p>

        <h2>Someone predicted this thirty years ago</h2>
        <p>
          {"In 1996 a teacher named Yogi Bhajan said something to his students that sounded like mysticism then and reads like a news bulletin now:"}
        </p>
        <p className={styles.quote}>
          {"In the computerized Age of Aquarius you will have four mega-billion units of knowledge at the press of a button. I pray you have the nervous strength to hold yourself, or we'll be depressed all the time."}
        </p>
        <p className={styles.quoteSource}>{"— Yogi Bhajan, 1996"}</p>
        <p>{"Not as scripture. As a forecast — and it has aged strangely well."}</p>

        <h2>He got the first half word for word</h2>
        <p>
          {"Four mega-billion units of knowledge at the press of a button is no longer a metaphor. It's your feed, your search, your model answering faster than you finish the question. Access to knowledge stopped being the problem within our lifetime. Everyone has the button."}
        </p>

        <h2>{"Here's the part everyone skips"}</h2>
        <p>
          {"\"The nervous strength to hold yourself.\" That's where he saw further. Knowledge was never the bottleneck — there's a glut of it now. The bottleneck is holding yourself when knowledge is infinite. Staying yourself while someone else's context, someone else's urgency, someone else's answer pours into you every second."}
        </p>
        <p><strong>{"We scaled knowledge. We never scaled the strength to hold it."}</strong></p>

        <h2>{"That's why there are two axes here, not one"}</h2>
        <p>
          {"Точка Сборки stands on two axes. The first is capability: use the button, co-think with the agent, carry an intent through to a result. Everyone teaches that. The second is inner sovereignty — the nervous strength itself. It doesn't come from one more article or one more tool. It comes from practice: repeatable, bodily, a little boring, the kind that gathers you back into a single point."}
        </p>
        <p>
          {"The course's name isn't poetry. An assembly point is the place you look at the world from without falling apart. Under four mega-billion units of knowledge, that's not a luxury anymore — it's a survival skill."}
        </p>

        <h2>What to do with this</h2>
        <p>
          {"You don't need his cosmology — not the Age of Aquarius, not the epochs. You need the practice that returns you to the point from which you can see which of this knowledge is yours and which is merely loud. That's the course — not more knowledge (it's already one button away) but the strength to hold yourself beside it."}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>
        {'Кнопку нам выдали. Знание — по нажатию: спроси что угодно, и через секунду перед тобой развёрнут ответ, которого хватило бы на диссертацию. Ровно то, что обещали. Откуда тогда этот ровный, фоновый гул — будто ты всё время немного не справляешься?'}
      </p>

      <h2>Это предсказали тридцать лет назад</h2>
      <p>
        {'В 1996-м учитель по имени Йоги Бхаджан сказал своим ученикам фразу, которая тогда звучала как мистика, а сейчас — как сводка новостей:'}
      </p>
      <p className={styles.quote}>
        {'В компьютеризированную эпоху Водолея у тебя будет четыре мега-миллиарда единиц знания по нажатию кнопки. Молюсь, чтобы у тебя хватило нервной силы удержать себя — иначе мы будем подавлены всё время.'}
      </p>
      <p className={styles.quoteSource}>{'— Йоги Бхаджан, 1996'}</p>
      <p>{'Не как писание. Как прогноз — и он постарел странно точно.'}</p>

      <h2>Первую половину он угадал дословно</h2>
      <p>
        {'Четыре мега-миллиарда единиц знания по нажатию — это уже не метафора. Это твоя лента, твой поиск, твоя модель, отвечающая быстрее, чем ты дочитываешь вопрос. Доступ к знанию перестал быть проблемой ещё на нашем веку. Кнопка есть у каждого.'}
      </p>

      <h2>А вот часть, которую все пропускают</h2>
      <p>
        {'„Нервная сила, чтобы удержать себя.“ Вот где он смотрел дальше. Узким горлышком никогда не было знание — его теперь в избытке. Узкое горлышко — удержать себя, когда знания бесконечно. Остаться собой, когда в тебя ежесекундно льётся чужой контекст, чужая срочность, чужой ответ.'}
      </p>
      <p><strong>{'Знание мы масштабировали. Способность его удержать — нет.'}</strong></p>

      <h2>Поэтому здесь две оси, а не одна</h2>
      <p>
        {'Точка Сборки стоит на двух осях. Первая — способность: умей пользоваться кнопкой, со-мыслить с агентом, доводить замысел до результата. Этому учат везде. Вторая — внутренний суверенитет: та самая нервная сила. Она не приходит от ещё одной статьи или ещё одного инструмента. Она приходит от практики — повторяемой, телесной, скучноватой, которая собирает тебя обратно в одну точку.'}
      </p>
      <p>
        {'Имя курса — не поэзия. Точка сборки — место, из которого ты смотришь на мир и не рассыпаешься. Под четырьмя мега-миллиардами единиц знания это уже не роскошь, а навык выживания.'}
      </p>

      <h2>Что с этим делать</h2>
      <p>
        {'Тебе не нужна его космология — ни Водолей, ни эпохи. Нужна практика, которая возвращает тебя в точку, откуда видно: что из этого знания — твоё, а что просто громкое. Это и есть курс — не больше знания (его и так по кнопке), а сила удержать себя рядом с ним.'}
      </p>
    </div>
  )
}
