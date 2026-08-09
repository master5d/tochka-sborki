import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function AssemblyPoint({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>
          {'Castaneda had a name for the place where a person’s world gets put together: the assembly point. Shift it, he wrote, and the world itself re-assembles. I never expected a term from a sorcery book to become the most precise way to describe what is happening to us with AI. But here we are.'}
        </p>

        <h2>Three ways to hold the same tool</h2>
        <p>
          {'Watch how people actually work with AI and you will see three postures. They are not levels of talent. They are positions of the assembly point.'}
        </p>
        <p>
          {'The first posture is '}<strong>borrowed tools</strong>{'. You open a chat window somebody else built, type a question, copy the answer, close the tab. The tool remembers nothing about you, and tomorrow you will introduce yourself again. The market has a flattering name for the far end of this road — “AI Native” — but the label matters less than the posture: at this stage the tool is a vending machine. Useful, impersonal, and entirely someone else’s.'}
        </p>
        <p>
          {'The second posture is '}<strong>personal practice</strong>{'. At some point you stop visiting the machine and start furnishing a room. You write down, once, who you are, how you work, what your red lines are — and the tool starts carrying that with you. Your notes become a knowledge base it can read. Your repeating chores become small automations. The conversations stop starting from zero. This is where most of the real gain lives, and almost nobody I meet has crossed into it.'}
        </p>
        <p>
          {'The third posture is '}<strong>sovereign practice</strong>{', and it is quieter than it sounds. The memory, the knowledge base, the automations — they live where you can see them, copy them, move them. Plain files on your own disk, not a subscription’s goodwill. If the vendor disappears tomorrow, your practice does not. Sovereignty is not a bunker; it is simply knowing that the room you furnished is yours.'}
        </p>

        <h2>A Practice OS</h2>
        <p>
          {'The thing you build across these postures has a shape, and I call it a Practice OS: the memory, the knowledge, the helpers and the routines of your work, assembled so that they compound instead of evaporating. For a therapist it might hold intake notes structure, session-prep rituals, the wording she trusts for hard conversations. For a writer, the voice files and the research trails. It is not a product you buy. It is a room you furnish — one honest shelf at a time.'}
        </p>

        <h2>Rough draft first</h2>
        <p>
          {'One rule does most of the work: let the tool take a thing to eighty percent, then take it to a hundred yourself. Never ask it for the final twenty first. The draft is the machine’s job; the judgment, the voice, the signature — those stay yours. People who reverse this order get the uncanny, airbrushed output everyone has learned to distrust. People who keep it produce more of their own work, faster, and it still sounds like them.'}
        </p>

        <h2>Why I care about the sovereignty part</h2>
        <p>
          {'I spent years as a kundalini yoga teacher before I built software. The thing I am proudest of from that life is the students who stopped needing me. A teacher grows teachers — that was the whole ethic. I hold tools to the same standard. An AI setup that deepens your dependence on it has failed you the same way a guru who cultivates followers has. The assembly point should end up in your hands.'}
        </p>
        <p>
          {'That is the frame. The practice of moving the point — that is slower, more personal work, and it is what I do now.'}
        </p>
      </div>
    )
  }

  return (
      <div className={styles.prose}>
        <p className={styles.lead}>
          {'У Кастанеды было имя для места, где собирается мир человека: точка сборки. Сдвинь её — и мир пересоберётся. Я не ожидал, что термин из книги о магии окажется самым точным словом для того, что происходит с нами и AI. Но вот мы здесь.'}
        </p>

        <h2>Три способа держать один и тот же инструмент</h2>
        <p>
          {'Посмотрите, как люди на самом деле работают с AI, и вы увидите три позы. Это не уровни таланта. Это положения точки сборки.'}
        </p>
        <p>
          {'Первая поза — '}<strong>чужие инструменты</strong>{'. Ты открываешь чат, который построил кто-то другой, задаёшь вопрос, копируешь ответ, закрываешь вкладку. Инструмент ничего о тебе не помнит, и завтра ты будешь представляться заново. У рынка есть льстивое имя для дальнего конца этой дороги — «AI Native», — но поза важнее ярлыка: на этой стадии инструмент — торговый автомат. Полезный, безличный и целиком чей-то чужой.'}
        </p>
        <p>
          {'Вторая поза — '}<strong>личная практика</strong>{'. В какой-то момент ты перестаёшь ходить к автомату и начинаешь обставлять комнату. Ты один раз записываешь, кто ты, как работаешь, где твои красные линии, — и инструмент начинает носить это с собой. Твои заметки становятся базой знаний, которую он умеет читать. Повторяющаяся рутина — маленькими автоматизациями. Разговоры перестают начинаться с нуля. Здесь живёт почти вся настоящая выгода — и почти никто из тех, кого я встречаю, сюда не перешёл.'}
        </p>
        <p>
          {'Третья поза — '}<strong>суверенная практика</strong>{', и она тише, чем звучит. Память, база знаний, автоматизации живут там, где ты можешь их увидеть, скопировать, унести. Обычные файлы на твоём диске, а не добрая воля подписки. Если вендор завтра исчезнет — твоя практика нет. Суверенность — не бункер; это просто знание, что обставленная комната — твоя.'}
        </p>

        <h2>Practice OS</h2>
        <p>
          {'У того, что собирается через эти позы, есть форма, и я зову её Practice OS: память, знания, помощники и ритуалы твоей работы, собранные так, чтобы накапливаться, а не испаряться. У терапевта там может жить структура интейк-заметок, ритуал подготовки к сессии, формулировки для трудных разговоров, которым она доверяет. У пишущего — файлы голоса и следы исследований. Это не продукт, который покупают. Это комната, которую обставляют — по одной честной полке.'}
        </p>

        <h2>Сначала черновик</h2>
        <p>
          {'Одно правило делает большую часть работы: дай инструменту довести вещь до восьмидесяти процентов — и доведи до ста сам. Никогда не проси у него последние двадцать первыми. Черновик — работа машины; суждение, голос, подпись — твои. Кто переворачивает порядок, получает тот прилизанный, неживой выхлоп, которому все уже научились не верить. Кто держит порядок — делает больше своей работы, быстрее, и она всё ещё звучит как он сам.'}
        </p>

        <h2>Почему мне важна часть про суверенность</h2>
        <p>
          {'До того как строить софт, я годами преподавал кундалини-йогу. Из той жизни я больше всего горжусь учениками, которым я перестал быть нужен. Учитель растит учителей — в этом была вся этика. К инструментам у меня та же мерка. AI-сетап, углубляющий твою зависимость от себя, подвёл тебя так же, как гуру, выращивающий последователей. Точка сборки должна оказаться в твоих руках.'}
        </p>
        <p>
          {'Это рамка. Сдвигать точку — работа медленнее и личнее, и именно ей я теперь занимаюсь.'}
        </p>
      </div>
  )
}
