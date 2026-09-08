// Narrative of the mamaev.coach home page. Distribution copy of Logos Foundry canon:
//   en — piece #262 seq 11 (id 372, accepted by the owner 2026-09-08)
//   ru — piece #263 seq 3  (id 375, human base, derived from the EN canon)
// Wording changes happen in Logos Foundry first, then get re-transcribed here.
import type { Locale } from '../dictionaries'
import type { SceneId } from './scenes'

export type Guide = 'scroller' | 'builder'
export interface Cta { label: string; href: string }
export interface Outcome { guide: Guide; value: string; text: string; source: string }
export interface PathBlock { guide: Guide; title: string; paragraphs: string[]; ctas?: Cta[] }
export interface Fork {
  id: 'boulder' | 'temple' | 'gates'
  scene: SceneId
  eyebrow: string
  obstacle: string
  setup: string[]
  habit: PathBlock
  detour: PathBlock
  outcomesTitle: string
  outcomes: [Outcome, Outcome]
  cta?: Cta
  bridge: string
}
export interface QuestContent {
  seo: { title: string; description: string }
  hero: { scene: SceneId; lines: string[]; name: string; role: string; bio: string }
  intro: { scene: SceneId; eyebrow: string; heading: string; paragraphs: string[] }
  forks: [Fork, Fork, Fork]
  finale: { scene: SceneId; eyebrow: string; heading: string; paragraphs: string[]; closing: string; cta: Cta }
  about: {
    scene: SceneId
    author: { heading: string; text: string; cta: Cta; links: Cta[] }
    course: { heading: string; text: string; href: string }
  }
  labels: { habit: string; detour: string; scroller: string; builder: string; plaques: [string, string]; skipToText: string }
  footer: string
}

const COURSE_EN = 'https://ai.synergify.com/en/'
const COURSE_RU = 'https://ai.synergify.com/'
const MENTOR_EN = 'https://mentor.mamaev.coach/en/'
const MENTOR_RU = 'https://mentor.mamaev.coach/'

const en: QuestContent = {
  seo: {
    title: 'Side quest or fast track: picking a path in the age of AI',
    description: 'Feed or terminal? A map of the mamaev.coach home page: three forks, real numbers, and a free course where your first agent gets built in 1 h 47 min.',
  },
  hero: {
    scene: '01-map',
    lines: [
      'Two years of side quests, sexology, hypnosis, robotaxi work, now agents.',
      "Seventh-degree shaman, if we're honest, I never mapped a route, I kept taking exits that felt alive.",
      'Scroll or build, feed or terminal, watch it or make it.',
      'This page is that map drawn after the fact; where to go is your call.',
    ],
    name: 'Alexander Mamaev',
    role: 'Vibe coder, AI builder, coach.',
    bio: 'I build agent systems on Claude Code + n8n. I teach others to do the same.',
  },
  intro: {
    scene: '02-camp',
    eyebrow: 'From quick wins to long ones',
    heading: 'Quick wins are gone by morning',
    paragraphs: [
      "A side quest, for those who skipped the games, is the road that isn't the main one, and it took me two years to notice I was living on it. The endless feed has a perfect interface and zero leftovers. Dopamine paid out, battery drained, nothing in your hands. The build has a worse interface (a terminal, errors, \"why doesn't it work\"), but the leftovers grow every evening: a working thing you can show someone.",
      'Here is the claim of this page: AI agents made "build it yourself" cheaper than "watch someone build it" for the first time. I did the math, and the math is short. Your first agent with project memory gets built in 1 hour 47 minutes of the course, shorter than two evening episodes. The whole road to a production agent is 9 modules, 44 lessons, $0, cheaper than any streaming subscription. The detour got shorter than the highway, the maps just haven\'t been updated yet.',
      'One strong fact: a person spends 18 hours 36 minutes a week in social and video feeds, about 2 hours 39 minutes every day (DataReportal × GWI, Digital 2026, October 2025). I checked my own screen time before writing this, and I am not going to quote it here, not that anyone asked. The number stays.',
    ],
  },
  forks: [
    {
      id: 'boulder',
      scene: '03-boulder',
      eyebrow: 'Fork 1: a replacement for the binge',
      obstacle: 'Obstacle 1. The boulder',
      setup: [
        "Binge-watching and the endless feed pay in dopamine, and after it there is nothing. The boulder blocks any forward motion because the brain stays glued to the reward loop instead of allocating resources to creation. Vibe coding pays the same charge, but by morning you have a working thing in your hands instead of a dead battery. I ran both experiments on myself, the second one is the only one I kept, if we're honest.",
      ],
      habit: {
        guide: 'scroller',
        title: 'The habit road',
        paragraphs: [
          'The habit road circles the boulder. One more episode. One more "how I built an agent in an evening" review. One more course in the bookmarks. Every step feels like motion, feeds are good at that. By morning the landscape is the same: same room, same phone, zero artifacts. The boulder sits where it sat.',
        ],
      },
      detour: {
        guide: 'builder',
        title: 'The detour',
        paragraphs: [
          "The detour spends the same energy on a build. Not studying it, building it: a script that sorts the mail, an agent that answers questions from my notes, a bot that does the boring part. Terminal, prompt, error, another prompt, the same reward loop, only a thing is left at the end. My first script sorted the mail badly and still beat the feed on leftovers, to be fair. The boulder doesn't get walked around, it gets broken into steps.",
        ],
      },
      outcomesTitle: 'Outcomes',
      outcomes: [
        { guide: 'scroller', value: '38 %', text: 'of US adults say evening scrolling hurts their sleep, and among 18-to-24-year-olds it is 46 %', source: 'AASM, Atomik Research survey, n=2007, June 2025' },
        { guide: 'builder', value: '1 hour 47 minutes', text: 'into the course your first agent with project memory arrives', source: 'modules 0-2 of the Assemblage Point, lesson "First project", by the published lesson durations' },
      ],
      cta: { label: 'Swap the scroll for a build →', href: COURSE_EN },
      bridge: 'The steps are laid. And the first agent brings a question right away: who leads whom, you it or it you? The second stone on the trail is older than the phone.',
    },
    {
      id: 'temple',
      scene: '04-temple',
      eyebrow: "Fork 2: amplify the voice, don't replace it",
      obstacle: 'Obstacle 2. The teacher',
      setup: [
        'I used to teach kundalini yoga, with a spiritual name (Ravi Angad Singh), mantras, a lineage, teacher trainings. That was a world of devotion to the guru. I left the model of dependence on a teacher on purpose: a strong teacher grows another teacher, not a follower. The toolkit needs everything, and that one I had to put down, apparently.',
      ],
      habit: {
        guide: 'scroller',
        title: 'The habit road',
        paragraphs: [
          'The habit road finds a new guru, and now its name is "AI". It gets handed the text, the decision, the taste: "write it for me", "come up with it for me", "decide for me". Comfortable, like sitting at a teacher\'s feet: zero responsibility, answers always there. A year later the voice isn\'t yours, the style isn\'t yours, the projects aren\'t yours. The lineage just switched servers.',
        ],
      },
      detour: {
        guide: 'builder',
        title: 'The detour',
        paragraphs: [
          "The detour takes the same principle from yoga into the tools: AI amplifies your voice, it doesn't replace it. The agent is an apprentice, not a master: it holds the tools, you hold the intent. Sovereignty instead of dependence, that is what the Assemblage Point teaches, and that is how I live myself. My apprentice still breaks things at night and I check its work in the morning, that is the whole limit of the tool, not that I'm counting. A strong tool, like a strong teacher, grows another builder, not a user.",
        ],
      },
      outcomesTitle: 'Outcomes',
      outcomes: [
        { guide: 'scroller', value: '84 %', text: 'of developers use AI in their work, and 3.1 % fully trust its answers', source: 'Stack Overflow Developer Survey, 2025' },
        { guide: 'builder', value: '44 lessons', text: '8.9 hours by the published durations; the finale is module 8 "Agent engineering", lesson "Prototype → Production"', source: 'the Assemblage Point, published lesson durations' },
      ],
      bridge: "Hard hat on, the intent is yours. What's left is where to take it: the trail out of the workshop runs into a wall with gates.",
    },
    {
      id: 'gates',
      scene: '05-gates',
      eyebrow: 'Fork 3: two projects',
      obstacle: 'Obstacle 3. The gates',
      setup: [
        'There are two gates, and this is not "pick one": the left is for you, the right is for your team.',
      ],
      habit: {
        guide: 'scroller',
        title: 'The habit road',
        paragraphs: [
          'The habit road stops at the gates: the link saved "for later", the trailer watched, the free module dropped halfway for the tool that "is about to change everything". I have done this with three tools I could name, and I won\'t, to be fair. The castle seen from twenty angles, never once from inside.',
        ],
      },
      detour: {
        guide: 'builder',
        title: 'The detour',
        paragraphs: [
          'Walk through the gate that is about you. ⬡ The Assemblage Point is an open course on vibe coding, entry from module one.',
          '⚙ Agent engineering is production agent systems for teams.',
        ],
        ctas: [
          { label: 'Start the course →', href: COURSE_EN },
          { label: 'Learn more →', href: MENTOR_EN },
        ],
      },
      outcomesTitle: 'Outcomes',
      outcomes: [
        { guide: 'scroller', value: '3.13 %', text: 'of those who enroll finish an online course', source: 'edX, 2017–18; Reich & Ruipérez-Valiente, Science, 2019' },
        { guide: 'builder', value: '9 modules', text: '$0, the price of entry at the first gate', source: 'the Assemblage Point, ai.synergify.com' },
      ],
      bridge: 'The gates are open. From the castle wall behind them the whole road is visible, and "made it" on this map means something different from what it means on the highway.',
    },
  ],
  finale: {
    scene: '06-wall',
    eyebrow: 'Redefining "made it"',
    heading: '"Made it" is not "watched it all"',
    paragraphs: [
      'On the highway the finish is "watched to the end". On the detour it is "built it and showed it". The first disappears by morning, the second stays. Two guides still stand, and the Scroller lives in each of us. I still catch mine on the cushion about once a week, to be fair. The only difference is who holds the map.',
      'The choice is still yours. The steps are marked now, and the first one is 1 hour 47 minutes from here.',
    ],
    closing: 'Hard hat on. Your move.',
    cta: { label: 'Swap the scroll for a build →', href: COURSE_EN },
  },
  about: {
    scene: '07-signs',
    author: {
      heading: 'About the author',
      text: 'Alexander Mamaev — vibe coder, AI builder, coach. Builds agent systems on Claude Code + n8n and teaches others to do the same. A former kundalini yoga teacher who carried the main principle from the hall into code: a strong teacher grows another teacher. For teams, ⚙ Agent engineering: production agent systems from spec to n8n + observability, b2b · on request.',
      cta: { label: 'Learn more →', href: MENTOR_EN },
      links: [
        { label: 'GitHub', href: 'https://github.com/master5d' },
        { label: 'Email', href: 'mailto:sasha@mamaev.coach' },
        { label: 'Blog', href: '/en/blog/' },
        { label: 'Events', href: '/en/events/' },
      ],
    },
    course: {
      heading: 'About the Assemblage Point',
      text: 'An open, free course on vibe coding and agents: 9 modules, 44 lessons, RU · EN, agent-agnostic. Entry via ai.synergify.com, from module one.',
      href: COURSE_EN,
    },
  },
  labels: {
    habit: 'The habit road',
    detour: 'The detour',
    scroller: 'the Scroller',
    builder: 'the Builder',
    plaques: ['open · free', 'b2b · on request'],
    skipToText: 'Skip to text',
  },
  footer: '© 2026 · mamaev.coach · ⬡ vibe in motion',
}

const ru: QuestContent = {
  seo: {
    title: 'Side quest или fast track: выбор пути в мире ИИ',
    description: 'Лента или терминал? Карта главной mamaev.coach: три развилки, настоящие числа и бесплатный курс, где первый агент собирается за 1 ч 47 мин.',
  },
  hero: {
    scene: '01-map',
    lines: [
      "Два года по side quest'ам: сексология, гипноз, роботакси, теперь агенты.",
      'Шаман в седьмой степени, маршрут я не строил ни разу, просто сворачивал на съезды, где было живо)',
      'Скроллить или собирать, лента или терминал, смотреть чужое или делать своё.',
      'Эта страница и есть та карта, нарисованная задним числом; куда по ней идти, решаешь ты.',
    ],
    name: 'Александр Мамаев',
    role: 'Vibe coder, AI builder, коуч.',
    bio: 'Строю agent-системы на Claude Code + n8n. Учу других делать то же самое.',
  },
  intro: {
    scene: '02-camp',
    eyebrow: 'От быстрых побед к долгим',
    heading: 'Быстрые победы кончаются к утру',
    paragraphs: [
      'Side quest, для тех, кто пропустил игры, это дорога, которая не главная, и мне понадобилось два года, чтобы заметить, что я на ней живу. У бесконечной ленты идеальный интерфейс и нулевой остаток. Дофамин выплачен, батарея села, в руках ничего. У сборки интерфейс хуже (терминал, ошибки, «а почему не работает»), зато остаток растёт каждый вечер: работающая штука, которую можно кому-то показать.',
      'Тезис этой страницы: ИИ-агенты впервые сделали «собрать самому» дешевле, чем «посмотреть, как собирают». Я посчитал, и счёт у меня вышел короткий. Первый агент с памятью проекта собирается за 1 час 47 минут курса, это короче двух вечерних серий. Вся дорога до production-агента это 9 модулей, 44 урока, 0 ₽, дешевле любой подписки на стриминг. Обходная тропа стала короче быстрой дороги, просто карты об этом ещё не обновили.',
      'Один сильный факт: в соцсетях и видеолентах человек проводит 18 часов 36 минут в неделю, около 2 часов 39 минут каждый день (DataReportal × GWI, Digital 2026, октябрь 2025). Своё экранное время я проверил перед тем, как это писать, и цифру оставлю при себе, никто её и не спрашивал). Число остаётся.',
    ],
  },
  forks: [
    {
      id: 'boulder',
      scene: '03-boulder',
      eyebrow: 'Развилка 1: замена залипанию',
      obstacle: 'Препятствие 1. Валун',
      setup: [
        'Бинж-вотчинг и бесконечная лента платят дофамином, а после него пусто. Валун перекрывает любое движение вперёд, потому что мозг сидит на петле награды и на сборку ничего не выделяет. Vibe coding платит тем же зарядом, но к утру у тебя в руках работающая штука, а не севшая батарея. Оба эксперимента я поставил на себе, оставил только второй, кофе остыл в обоих)',
      ],
      habit: {
        guide: 'scroller',
        title: 'Привычная дорога',
        paragraphs: [
          'Привычная дорога обходит валун по кругу. Ещё одна серия. Ещё один обзор «как я собрал агента за вечер». Ещё один курс в закладки. Каждый шаг ощущается как движение, ленты умеют это лучше любого тренера. К утру пейзаж тот же: та же комната, тот же телефон, ноль артефактов. Валун сидит где сидел.',
        ],
      },
      detour: {
        guide: 'builder',
        title: 'Обходная тропа',
        paragraphs: [
          'Обходная тропа тратит ту же энергию на сборку. Не изучить, а собрать: скрипт, который разбирает мою почту, агент, который отвечает на вопросы по моим заметкам, бот, который делает за меня скучное. Терминал, промпт, ошибка, ещё промпт, тот же цикл награды, только в конце остаётся вещь. Мой первый скрипт разбирал почту плохо и всё равно обошёл ленту по остатку). Валун не обходят, его разбирают на ступени.',
        ],
      },
      outcomesTitle: 'Исходы',
      outcomes: [
        { guide: 'scroller', value: '38 %', text: 'взрослых в США говорят, что вечерний скролл ухудшает им сон, а среди 18-24-летних таких 46 %', source: 'AASM, опрос Atomik Research, n=2007, июнь 2025' },
        { guide: 'builder', value: '1 час 47 минут', text: 'первый агент с памятью проекта приходит через 1 час 47 минут курса', source: 'модули 0-2 «Точки Сборки», урок «Первый проект», по объявленным длительностям уроков' },
      ],
      cta: { label: 'Поменяй скролл на сборку →', href: COURSE_RU },
      bridge: 'Ступени выложены. И первый агент сразу приносит вопрос: кто кого ведёт, ты его или он тебя? Второй камень на тропе старше телефона.',
    },
    {
      id: 'temple',
      scene: '04-temple',
      eyebrow: 'Развилка 2: усиливать голос, не заменять',
      obstacle: 'Препятствие 2. Учитель',
      setup: [
        'Раньше я учил кундалини-йоге, с духовным именем (Рави Ангад Синх), мантрами, линией передачи, тренингами для учителей. Это был мир преданности гуру. Из модели зависимости от учителя я ушёл намеренно: сильный учитель растит другого учителя, а не последователя. В арсенале нужно всё, а этот инструмент мне пришлось отложить)',
      ],
      habit: {
        guide: 'scroller',
        title: 'Привычная дорога',
        paragraphs: [
          'Привычная дорога находит нового гуру, и теперь его зовут «ИИ». Ему отдают текст, решение, вкус: «напиши за меня», «придумай за меня», «реши за меня». Удобно, как сидеть у ног учителя: ответственности ноль, ответы всегда есть. Через год голос не твой, стиль не твой, проекты не твои. У линии передачи просто сменился сервер.',
        ],
      },
      detour: {
        guide: 'builder',
        title: 'Обходная тропа',
        paragraphs: [
          'Обходная тропа переносит тот же принцип из йоги в инструменты: ИИ усиливает твой голос, а не заменяет его. Агент это подмастерье, не мастер: он держит инструменты, ты держишь замысел. Суверенность вместо зависимости, этому учит Точка Сборки, и так я живу сам. Мой подмастерье по ночам всё ещё ломает вещи, а я по утрам проверяю его работу, вот и весь предел инструмента). Первый агент за 1 час 47 минут это вход в ремесло, а не production, и границу эту я держу в голове каждый раз, когда он ночью что-то чинит сам. Сильный инструмент, как сильный учитель, растит другого сборщика, а не пользователя.',
        ],
      },
      outcomesTitle: 'Исходы',
      outcomes: [
        { guide: 'scroller', value: '84 %', text: 'разработчиков используют ИИ в работе, а полностью доверяют его ответам 3,1 %', source: 'Stack Overflow Developer Survey, 2025' },
        { guide: 'builder', value: '44 урока', text: '8,9 часа по объявленным длительностям; финал это модуль 8 «Агентский инжиниринг», урок «Prototype → Production»', source: 'Точка Сборки, по объявленным длительностям уроков' },
      ],
      bridge: 'Каска надета, замысел твой. Осталось понять, куда его нести: тропа из мастерской упирается в стену с воротами.',
    },
    {
      id: 'gates',
      scene: '05-gates',
      eyebrow: 'Развилка 3: два проекта',
      obstacle: 'Препятствие 3. Ворота',
      setup: [
        'Ворот двое, и это не «выбери одни»: левые для тебя одного, правые для твоей команды и её продакшна.',
      ],
      habit: {
        guide: 'scroller',
        title: 'Привычная дорога',
        paragraphs: [
          'Привычная дорога останавливается у ворот: ссылка сохранена «на потом», трейлер посмотрен, бесплатный модуль брошен на половине ради инструмента, который «вот-вот всё изменит». Я так делал с тремя инструментами, названия помню, называть не буду). Замок увиден с двадцати ракурсов, изнутри ни разу.',
        ],
      },
      detour: {
        guide: 'builder',
        title: 'Обходная тропа',
        paragraphs: [
          'Войти в те ворота, что про тебя. ⬡ Точка Сборки это открытый курс по vibe-кодингу, вход с первого модуля.',
          '⚙ Агентский инжиниринг это production agent-системы для команд.',
        ],
        ctas: [
          { label: 'Начни курс →', href: COURSE_RU },
          { label: 'Узнай больше →', href: MENTOR_RU },
        ],
      },
      outcomesTitle: 'Исходы',
      outcomes: [
        { guide: 'scroller', value: '3,13 %', text: 'до конца онлайн-курса доходят 3,13 % записавшихся', source: 'edX, 2017–18; Reich & Ruipérez-Valiente, Science, 2019' },
        { guide: 'builder', value: '9 модулей', text: '0 ₽, цена входа в первые ворота', source: 'Точка Сборки, ai.synergify.com' },
      ],
      bridge: 'Ворота открыты. С крепостной стены за ними виден весь путь, и «дошёл» на этой карте значит не то, что на быстрой дороге.',
    },
  ],
  finale: {
    scene: '06-wall',
    eyebrow: 'Переопределяя «дошёл»',
    heading: '«Дошёл» это не «досмотрел»',
    paragraphs: [
      'На быстрой дороге финиш это «досмотрел до конца». На обходной тропе это «собрал и показал». Первое исчезает к утру вместе с историей просмотров, второе остаётся и работает. Проводников по-прежнему двое, и Скроллер живёт в каждом из нас. Своего я ловлю на подушке примерно раз в неделю, подушка мятная). Разница только в том, кто из двоих держит карту.',
      'Выбор всё ещё твой. Ступени теперь размечены, и первая из них в 1 часе 47 минутах отсюда.',
    ],
    closing: 'Каска на голове. Дальше сам.',
    cta: { label: 'Поменяй скролл на сборку →', href: COURSE_RU },
  },
  about: {
    scene: '07-signs',
    author: {
      heading: 'Об авторе',
      text: 'Александр Мамаев — vibe coder, AI builder, коуч. Строит agent-системы на Claude Code + n8n и учит других делать то же самое. Бывший учитель кундалини-йоги, который перенёс главный принцип из зала в код: сильный учитель растит другого учителя. Для команд ⚙ Агентский инжиниринг: production agent-системы от спецификации до n8n + observability, b2b · по запросу.',
      cta: { label: 'Узнай больше →', href: MENTOR_RU },
      links: [
        { label: 'GitHub', href: 'https://github.com/master5d' },
        { label: 'Email', href: 'mailto:sasha@mamaev.coach' },
        { label: 'Блог', href: '/blog/' },
        { label: 'События', href: '/events/' },
      ],
    },
    course: {
      heading: 'О Точке Сборки',
      text: 'Открытый бесплатный курс по vibe-кодингу и агентам: 9 модулей, 44 урока, RU · EN, agent-agnostic. Вход через ai.synergify.com, с первого модуля.',
      href: COURSE_RU,
    },
  },
  labels: {
    habit: 'Привычная дорога',
    detour: 'Обходная тропа',
    scroller: 'Скроллер',
    builder: 'Сборщица',
    plaques: ['open · бесплатно', 'b2b · по запросу'],
    skipToText: 'К тексту',
  },
  footer: '© 2026 · mamaev.coach · ⬡ vibe in motion',
}

export const quest: Record<Locale, QuestContent> = { ru, en }
