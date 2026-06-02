import styles from '../Prologue.module.css'
import { ReflectiveLoop } from '../PrologueDiagrams'

type Props = { locale: 'ru' | 'en' }

export function ActThree({ locale }: Props) {
  if (locale === 'en') {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Act III. Liberationist</h2>

        <p>
          There are two ways to stand before a world that is tearing. The first — resist. Take a
          stance, hold the line, respond to every blow, let nothing unjust pass. This way feels
          honest because it has energy and direction. But it has its own price. The body is always
          on edge. Time shrinks down to the nearest threat. Imagination narrows to whatever you are
          fighting right now. Five years into that life you discover you have become a mirror of what
          you were resisting — the same speeds, the same tone, the same habit of living in alarm.
          Resistance to the world makes you resemble the world. That is its quiet revenge.
        </p>

        <p>
          There is a second way. Not to resist — to assemble. Not to take a stance outward, but to
          stand inward. Then the world can pass through you — with all its speeds, its noise, its
          new instruments — and not break you. Not because you are stronger. But because inside you
          there is a point where you are not fragmented. Wind passes through it; it is not blown
          away. This is different work. It is quieter. There is no adrenaline of battle in it. But
          it is what leaves you alive in ten years, not burned out by the third.
        </p>

        <p>{'Now about technology. The same principle, in new clothes.'}</p>

        <ReflectiveLoop />

        <p>
          <strong>{"AI reflects what came into you before it. That's mechanics, not philosophy."}</strong>
          {' AI is a mirror. Very fast, very responsive. Whatever you brought to it, it will'}
          {' return amplified. Brought fear of falling behind — you get back acceleration and more'}
          {' fear of falling behind. Brought a desire to hide your own confusion behind someone'}
          {" else's intelligence — you get an even more convincing way to hide. Brought"}
          {' fragmentation — you watch fragmentation become glossy, productive, almost beautiful.'}
          {" The tool doesn't replace you. It shows you at larger scale. Fog inside — fog the size"}
          {' of a screen in the mirror.'}
        </p>

        <p>
          {'The assembled person sees something different. They come to AI not to become someone.'}
          {' They come with their own voice and ask the mirror to amplify that voice. Then the tool'}
          {" works as it should: not instead of you, but through you. It doesn't replace the craft"}
          {" — it extends its reach. The difference isn't in the model or the subscription. The"}
          {' difference is in who is sitting in front of the screen. The same Claude Code in the'}
          {' hands of a fragmented person makes them more fragmented, faster, more convincing in'}
          {' their confusion. In the hands of an assembled person — it becomes an extension of the'}
          {' voice that person already had.'}
        </p>

        <p>
          {"And now about that place inside you. You've been there. Remember a moment when"}
          {' everything inside suddenly aligned — body, thoughts, breath, what was around you —'}
          {" didn't blur into noise but gathered into a single point through which you saw"}
          {' everything at once. By a fire. On a summit after a long climb. With a child in your'}
          {" arms at three in the morning. In the silence after something finally let go. You didn't"}
          {' learn this from a book — you simply arrived there once and remembered the place inside'}
          {" you where it happened. And then lost it. Life with its own frequencies pulled you back"}
          {" apart into pieces, and that point stayed somewhere behind, like a dream you can't"}
          {' retell.'}
        </p>

        <p>
          {'That state has a name — the assembly point — and traditions that have worked with it'}
          {' for thousands of years, long before any AI. Kundalini, vipassana, shamanic practices'}
          {' — different roads to the same point. Not to mysticism. To a very concrete state in'}
          {' which you fit inside yourself whole.'}
        </p>

        <p>
          <strong>{"The assembly point isn't a metaphor. It's a concrete state in which you're able to use a tool without losing yourself."}</strong>
        </p>

        <p>
          {"And right away, honestly: this isn't an achievement. Not a diploma you earned once and"}
          {' carry in your pocket. Assembly is a skill. Like any skill, it requires daily practice'}
          {' — different for each person. Cold shower, breathing, forty minutes of silence, running,'}
          {" prayer, a yoga mat — the form doesn't matter. What matters is that you return to that"}
          {' place inside yourself, again and again. The door into the tool passes through it. Not'}
          {' through a subscription, not through a course, not through the right model. Through'}
          {' you, assembled.'}
        </p>

        <p>
          {'How this comes together in practice is a separate conversation, and there is a course'}
          {' for that. Here I want to bring three threads into one.'}
        </p>

        <p>
          The liberation frame was helped into shape by a post from <a href="https://instagram.com/spirit.ofthelion" target="_blank" rel="noopener">@spirit.ofthelion</a>.
        </p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHeading}>Акт III. Liberationist</h2>

      <p>
        Есть два способа стоять перед миром, который рвётся. Первый — сопротивляться. Встать в
        стойку, держать оборону, отвечать на каждый удар, не пропускать ни одной несправедливости
        мимо. Этот способ кажется честным, потому что в нём есть энергия и есть направление. Но
        у него своя цена. Тело всё время на взводе. Время сжимается до
        ближайшей угрозы. Воображение сужается до того, против чего ты сейчас бьёшься. Через пять
        лет такой жизни ты обнаруживаешь, что стал зеркалом того, чему сопротивлялся — те же
        скорости, тот же тон, та же привычка жить в режиме тревоги. Сопротивление миру делает
        тебя похожим на мир. Это его тихая месть.
      </p>

      <p>
        Есть второй способ. Не сопротивляться — собраться. Не встать в стойку, а встать внутри.
        Тогда мир может через тебя пройти — со всеми своими скоростями, со своим грохотом, со
        своими новыми инструментами — и не сломать. Не потому что ты сильнее. А потому что у тебя
        внутри есть точка, в которой ты не расщеплён. Через неё проходит ветер, а её саму не
        сдувает. Это другая работа. Она тише. В ней нет адреналина борьбы. Но именно она оставляет
        тебя живым через десять лет, а не выгоревшим к третьему году.
      </p>

      <p>{'Теперь про технологию. Тот же принцип, в новой одежде.'}</p>

      <ReflectiveLoop />

      <p>
        <strong>{'AI отражает то, что в тебя пришло до него. Это механика, не философия.'}</strong>
        {' AI — зеркало. Очень быстрое, очень отзывчивое. Что ты в него принёс, то оно'}
        {' вернёт усиленным. Принёс страх отстать — получишь обратно ускорение и больше страха'}
        {' отстать. Принёс желание спрятаться от собственной растерянности за чужим интеллектом —'}
        {' получишь ещё более убедительный способ спрятаться. Принёс расщепление — увидишь,'}
        {' как расщепление становится глянцевым, продуктивным, почти красивым. Инструмент не подменяет'}
        {' тебя. Он показывает тебя в большем масштабе. Внутри туман — в зеркале туман'}
        {' величиной с экран.'}
      </p>

      <p>
        {'Собранный видит другое. Он приходит к AI не за тем, чтобы стать кем-то. Он приходит'}
        {' со своим голосом и просит зеркало этот голос усилить. Тогда инструмент работает как должно:'}
        {' не вместо тебя, а через тебя. Он не заменяет ремесло — расширяет его охват. Разница'}
        {' не в модели и не в подписке. Разница в том, кто сидит перед экраном. Один и тот же Claude'}
        {' Code в руках расщеплённого делает его ещё более расщеплённым, более быстрым,'}
        {' более убедительным в своей растерянности. В руках собранного — становится продолжением'}
        {' голоса, который у этого человека и так уже был.'}
      </p>

      <p>
        {'А теперь про само это место в тебе. Ты в нём уже бывал. Вспомни момент, когда всё внутри'}
        {' вдруг сошлось — тело, мысли, дыхание, то, что вокруг — не слилось в кашу, а собралось в'}
        {' одну точку, через которую ты смотрел на всё сразу. У огня. На вершине после долгого'}
        {' подъёма. С ребёнком на руках в три ночи. В тишине после того, как наконец отпустило. Ты'}
        {' не учился этому по книге — ты просто однажды там оказался и запомнил место в себе, где'}
        {' это случилось. А потом потерял. Жизнь со своими частотами растащила тебя обратно по'}
        {' кускам, и точка осталась где-то позади, как сон, который не пересказать.'}
      </p>

      <p>
        {'У этого состояния есть имя — точка сборки — и традиции, которые работали с ним тысячи'}
        {' лет, задолго до всякого AI. Кундалини, випассана, шаманские практики — разные дороги к'}
        {' одной и той же точке. Не к мистике. К очень конкретному состоянию, в котором ты'}
        {' помещаешься в себя целиком.'}
      </p>

      <p>
        <strong>{'Точка сборки — не метафора. Это конкретное состояние, в котором ты способен использовать инструмент, не теряя себя.'}</strong>
      </p>

      <p>
        {'И сразу честно: это не достижение. Не диплом, который ты однажды получил и носишь в'}
        {' кармане. Собранность — навык. Как любой навык, она требует ежедневной возни — у каждого'}
        {' своей. Холодный душ, дыхание, сорок минут тишины, бег, молитва, коврик — форма не важна.'}
        {' Важно, что ты раз за разом возвращаешься в это место внутри. Через него проходит дверь в'}
        {' инструмент. Не через подписку, не через курс, не через правильную модель. Через тебя,'}
        {' собранного.'}
      </p>

      <p>
        {'Как это собирается на практике — отдельный разговор, и для него есть курс.'}
        {' Здесь я хочу свести три нити в одну.'}
      </p>

      <p>
        Рамку liberation помог собрать пост <a href="https://instagram.com/spirit.ofthelion" target="_blank" rel="noopener">@spirit.ofthelion</a>.
      </p>
    </section>
  )
}
