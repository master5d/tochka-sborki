import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function Charter({ locale }: Props) {
  if (locale === 'en') {
    return (
      <div className={styles.prose}>
        <p className={styles.lead}>
          {"Every morning you open the chat and explain who you are all over again. Who you write for, in what voice, what you can't stand. By lunch it's a blank slate again. You're not using an assistant — you're meeting a new intern every single time."}
        </p>

        <p>
          {'This is the quiet exhaustion that almost no one names out loud. AI sort of helps,'}
          {' but you spend half your energy hauling it back into context. "No, not that formal."'}
          {' "I asked for no marketing-speak." "You rewrote the whole thing — I only wanted'}
          {' it shorter." Tomorrow, back to square one. The tool is powerful, but the feeling is'}
          {' like carrying water in a sieve.'}
        </p>

        <h2>Why this keeps happening</h2>
        <p>
          {'Because a one-off prompt is a conversation with no memory. You hold everything in'}
          {" your head: who you are, what you're about, where the red lines are. It holds nothing."}
          {' Every request starts from zero, and all your context has to be loaded by hand — again'}
          {' and again, in the same words. The more often you do it, the more AI seems "dumb."'}
          {" It isn't dumb. No one ever gave it a standing frame."}
        </p>

        <h2>What one sheet changes</h2>
        <p>
          {"Let's use a composite story — a private tutor. We'll call her Nina. For two months"}
          {' Nina wrestled ChatGPT into lesson plans, and every time she had to fight to explain'}
          {" that her method isn't \"drill the grammar rules\" but get the student talking from the"}
          {' very first session. Then she did something odd: instead of yet another long prompt,'}
          {' she wrote one sheet about who her assistant is. Not "give me a plan" — but who it'}
          {' is when it sits down to work alongside her.'}
        </p>

        <p>
          {'The sheet fit into seven short blocks, without a single technical word:'}
        </p>

        <div className={styles.boundary}>
          <b>Who it is</b> — a co-planning assistant that protects her method instead of pushing internet templates.<br />
          <b>What it knows about her</b> — adult learners, conversational approach, allergic to bureaucratic stiffness.<br />
          <b>What it believes</b> — living speech first, grammar second; a student's mistake is material, not a verdict.<br />
          <b>When to step in, when not to</b> — step in for a lesson-plan draft; stay back until she's found the topic herself.<br />
          <b>How it works in a single pass</b> — asks about the student's level and goal first, then suggests, then leaves the final call to her.<br />
          <b>Never</b> — writes "correct answers" for the student, doesn't collapse into dry tables.<br />
          <b>Why it exists</b> — so Nina has energy left in the evening, and the student manages to speak by the very first lesson.
        </div>

        <p>
          {"That's not magic and not code. It's a charter — a description not of a task but of a"}
          {' character. Nina pastes it as the first message (or puts it in the assistant settings)'}
          {' — and from then on she never explains herself again. The assistant already knows who'}
          {"it's working with."}
        </p>

        <h2>What changed</h2>
        <p>
          {'Before: every lesson plan meant twenty minutes of arguing to pull something actually hers'}
          {' out of the AI. Now: she writes "eighth lesson, student is too shy to speak" — and gets'}
          {' a draft already in her logic, by her rules, without the stiffness. She edits it rather'}
          {' than rebuilds from scratch. Twenty minutes of argument turned into three minutes of'}
          {" polish. And — more important than the plans — she stopped feeling like she was at war"}
          {" with the tool. It's finally on her side."}
        </p>

        <div className={styles.boundary}>
          <b>AI takes:</b> the draft, the structure, the memory of your rules between sessions.<br />
          <b>Stays yours:</b> the method, the voice, the final word — and the decision about what matters at all.
        </div>

        <h2>Why this works for any craft</h2>
        <p>
          {'Nina is a teacher, but the sheet lands just as well for a coach, an editor, a craftsperson,'}
          {" or someone running a small business. The content of the blocks changes; the idea doesn't."}
          {' Everywhere the same shift happens: you stop treating AI like a vending machine you feed'}
          {' a coin for a one-off answer, and start treating it like a partner who has a charter.'}
          {" A partner who remembers who you are — that's already a different level of relationship"}
          {' with a tool.'}
        </p>

        <p>
          <strong>{"You don't have to introduce yourself from scratch every morning. One sheet — and your AI has a memory of who you are."}</strong>
        </p>

        <p>
          {"If you're curious how such a sheet is built block by block and how to keep it alive —"}
          {" that's something we go deep on in the course. And nearby: "}
          <a href="/en/blog/horizons/">what you can actually do with AI</a>{" if you're not a techie, and "}
          <a href="/en/blog/prologue/">the prologue</a>{' — why the tool started feeling like the enemy in the first place.'}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.prose}>
      <p className={styles.lead}>
        {'Каждое утро ты открываешь чат и снова объясняешь, кто ты. Кому пишешь, каким голосом, чего терпеть не можешь. К обеду он опять чистый лист. Ты не пользуешься помощником — ты каждый раз знакомишься с новым стажёром.'}
      </p>

      <p>
        {'Это и есть та тихая усталость, которую почти никто не называет вслух. AI вроде помогает,'}
        {' но ты тратишь половину сил на то, чтобы заново втащить его в контекст. «Нет, не так'}
        {' официально». «Я же просил без этих маркетинговых слов». «Ты опять переписал за меня,'}
        {' а я просил только сократить». Завтра — всё по новой. Инструмент мощный, а ощущение —'}
        {' будто таскаешь воду решетом.'}
      </p>

      <h2>Почему так выходит</h2>
      <p>
        {'Потому что разовый промпт — это разговор без памяти. Ты держишь в голове всё: кто ты,'}
        {' ради чего, где красные линии. А он не держит ничего. Каждая просьба стартует с нуля,'}
        {' и весь твой контекст приходится докидывать руками — снова и снова, одними и теми же'}
        {' словами. Чем чаще ты это делаешь, тем сильнее кажется, что AI «тупой». Он не тупой.'}
        {' Ему просто никто не выдал постоянную рамку.'}
      </p>

      <h2>Что меняет один лист</h2>
      <p>
        {'Возьмём собирательную историю — пусть будет репетитор, частный преподаватель. Назовём её'}
        {' Ниной. Нина два месяца гоняла ChatGPT по планам уроков и каждый раз с боем объясняла,'}
        {' что её метод — это не «зубрить правила», а разговорить ученика с первого занятия. Потом'}
        {' она сделала странную вещь: вместо очередного длинного промпта написала один лист о том,'}
        {' кто её помощник. Не «сделай мне план», а — кто он, когда садится работать рядом с ней.'}
      </p>

      <p>
        {'Лист уместился в семь коротких блоков, без единого технического слова:'}
      </p>

      <div className={styles.boundary}>
        <b>Кто он</b> — со-планирующий ассистент, который бережёт её метод, а не подсовывает шаблоны из интернета.<br />
        <b>Что про неё знает</b> — взрослые ученики, разговорный подход, ненавидит казёнщину.<br />
        <b>Во что верит</b> — сначала живая речь, потом грамматика; ошибка ученика — материал, не приговор.<br />
        <b>Когда звать, когда нет</b> — звать на черновик плана; не звать, пока она сама не нащупала тему урока.<br />
        <b>Как работает за один заход</b> — сначала спрашивает уровень и цель ученика, потом предлагает, в конце оставляет выбор за ней.<br />
        <b>Чего никогда</b> — не пишет «правильные ответы» за ученика, не сваливается в сухие таблицы.<br />
        <b>Ради чего он есть</b> — чтобы у Нины вечером оставались силы, а у ученика на первом же занятии получилось заговорить.
      </div>

      <p>
        {'Это не магия и не код. Это устав — описание не задачи, а характера. Нина вставляет его'}
        {' первым сообщением (или кладёт в настройки помощника) — и дальше не объясняет себя'}
        {' заново. Помощник уже знает, кто перед ним.'}
      </p>

      <h2>Что стало другим</h2>
      <p>
        {'Раньше: каждый план — это двадцать минут препирательств, чтобы вытащить из AI что-то'}
        {' своё. Теперь: она пишет «восьмой урок, ученик стесняется говорить» — и получает черновик'}
        {' уже в её логике, по её правилам, без казёнщины. Она его правит, а не переделывает с нуля.'}
        {' Двадцать минут спора превратились в три минуты доводки. И — это важнее планов — она'}
        {' перестала чувствовать, что воюет с инструментом. Он наконец на её стороне.'}
      </p>

      <div className={styles.boundary}>
        <b>AI берёт:</b> черновик, структуру, память о твоих правилах между заходами.<br />
        <b>Остаётся твоим:</b> метод, голос, последнее слово — и решение, что вообще важно.
      </div>

      <h2>Почему это работает на любом ремесле</h2>
      <p>
        {'Нина — преподаватель, но лист одинаково ложится на коуча, редактора, мастера, того, кто'}
        {' ведёт маленькое дело. Меняется содержание блоков, не сама идея. Везде один и тот же'}
        {' сдвиг: ты перестаёшь относиться к AI как к автомату, в который кидаешь монетку за разовый'}
        {' ответ, и начинаешь относиться как к напарнику, у которого есть устав. Напарник, который'}
        {' помнит, кто ты, — это уже другой уровень отношений с инструментом.'}
      </p>

      <p>
        <strong>{'Ты не обязан каждое утро знакомиться заново. Один лист — и у твоего AI появляется память о том, кто ты.'}</strong>
      </p>

      <p>
        {'Если интересно, из чего собирается такой лист по блокам и как его держать живым — это мы'}
        {' разбираем на курсе вплотную. А рядом — соседние тексты: '}
        <a href="/blog/horizons/">что вообще можно делать с AI</a>{', если ты не технарь, и '}
        <a href="/blog/prologue/">пролог</a>{' — почему инструмент вообще стал казаться врагом.'}
      </p>
    </div>
  )
}
