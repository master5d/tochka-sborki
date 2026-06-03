import styles from '../Prologue.module.css'
import { PhaseShiftDiagram } from '../PrologueDiagrams'

type Props = { locale: 'ru' | 'en' }

export function ActOne({ locale }: Props) {
  if (locale === 'en') {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionHeading}>Act I. The Great Transition</h2>

        <PhaseShiftDiagram />

        <p>
          {"There's a man named Jordan Hall. He writes about civilizational phase shift — the kind"}
          {' of phase change that happens to water when it stops being liquid and becomes steam. Not'}
          {' a reform, not a crisis, not another economic cycle. The very way the world holds itself'}
          {' together changes state. Eleven years ago he wrote about "the coming great transition."'}
          {" Recently he came back out and said: the transition is no longer coming. It's inside."}
          {" We're breathing it. And if there's been that quiet hum in your chest — you're not"}
          {' going crazy alone. The ground really is moving under everyone at once.'}
        </p>

        <blockquote className={styles.blockquote}>
          <em>
            {"\"The Great Transition is not an improvement of the old world. It is the birth of a new"}
            {" way of being, where the question 'how do I survive?' gives way to the question 'what"}
            {" am I living for?'\""}
          </em>
          <span className={styles.blockquoteAttrib}>— Jordan Hall</span>
        </blockquote>

        <p>{'The map is tearing along three axes. Lay this frame over what you see around you — in others and in yourself. The axes come through clearly.'}</p>

        <p>
          {'The first — institutions of meaning have stopped holding meaning. Education, expertise,'}
          {" media, professional guilds — all these large buildings we've been depositing our"}
          {" confusion into for centuries so they'd give back orientation. They're still standing,"}
          {" but hollow inside. Diplomas are issued, but trust in the diploma is gone. Experts speak"}
          {" from screens, but listening to them the way we used to — it just doesn't land anymore."}
          {" The walls are there, but there's a draft running through. That draft isn't malice."}
          {' The buildings were simply built for a different climate.'}
        </p>

        <p>
          {'The second — the map of the world has stopped matching the terrain. Explanations that'}
          {' worked for thirty years — about career, about family, about "get established first,'}
          {' then live" — no longer explain what happens on an ordinary Tuesday. People now come in'}
          {" not with a problem but with torn scraps of map in their hands. They don't understand"}
          {' what logic their life follows now. And none of the elders can give them that logic,'}
          {' because the elders have the same scraps. This is the first time in a long while that'}
          {' a generation of teachers cannot pass a working model on to their students — because'}
          {' nobody has one.'}
        </p>

        <p>
          {'The third — the question itself has changed. It used to sound like "how." How to earn,'}
          {" how to hold a relationship, how to break through a ceiling. Now it's \"why.\" Not how,"}
          {" but what for. That's a different depth of inquiry, and the old tools have no bottom"}
          {' for it. Hall frames this as a shift in the basic existential question; on the ground'}
          {' it shows up as a shift in the register of conversation itself — from transactional to'}
          {' almost devotional.'}
        </p>

        <p>
          {"I see this shift in my work every week: over recent years people's requests have moved"}
          {' from acute pain — pain has a shape — to confusion, which has none. Pain you can hold.'}
          {' Confusion you can only live through, in the fog, together. And in that shared blindness'}
          {' right now there is more honesty than in any confident speech from a podium.'}
        </p>

        <p>And here is the key point — the reason for this whole section.</p>

        <p>
          <strong>{'The map tore before AI arrived. AI came in when the tearing was already underway.'}</strong>
        </p>

        <p>
          {"The timeline misleads. AI has been on everyone's screens since 2022, the rupture of"}
          {' meaning is felt at about the same time — and the hand reaches naturally to connect one'}
          {' to the other as cause and effect. But look deeper: the institutions were no longer'}
          {' holding long before ChatGPT, the young stopped trusting their elders well before that,'}
          {' the question "what for" had been rising from beneath the surface for years, just without'}
          {" words. AI didn't break the world. It walked into a world that was already drifting and"}
          {" became the visible part of a movement that began before it. It's not the driver."}
          {" It's a passenger in a car whose brakes failed long ago."}
        </p>

        <p>
          {'This changes the target of the anger. If the map is tearing not because of AI — there'}
          {" is nothing to blame it for. Resisting it as a cause is pointless: it isn't the cause."}
          {' And the question stops being "let it in or not." The question becomes — which AI to let'}
          {' in, and into which version of yourself.'}
        </p>

        <p>
          {"That's what the next act is about. It's not about technology. It's about what inside"}
          {' you chooses what this technology will become.'}
        </p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHeading}>Акт I. Великий переход</h2>

      <PhaseShiftDiagram />

      <p>
        {'Есть человек по имени Джордан Холл. Он пишет про civilizational phase shift — смену фазы'}
        {' цивилизации, как у воды, когда она перестаёт быть жидкой и становится паром. Не реформа,'}
        {' не кризис, не очередной экономический цикл. Сам способ, которым мир держит себя, меняет'}
        {' агрегатное состояние. Одиннадцать лет назад он написал про «грядущий великий переход».'}
        {' А недавно вышел и сказал: переход уже не грядущий. Он внутри. Мы в нём дышим. И если у тебя'}
        {' в груди стоит тот самый гул — это не ты сходишь с ума в одиночку. Это земля действительно'}
        {' движется под ногами у всех сразу.'}
      </p>

      <blockquote className={styles.blockquote}>
        <em>
          «Великий переход — это не улучшение старого мира. Это рождение нового способа бытия,
          где вопрос „как мне выжить?" сменяется вопросом „ради чего мне жить?"»
        </em>
        <span className={styles.blockquoteAttrib}>— Джордан Холл</span>
      </blockquote>

      <p>{'Карта рвётся по трём осям. Наложи эту рамку на то, что видишь вокруг — и у других, и у себя. Оси проступают отчётливо.'}</p>

      <p>
        {'Первая — институты смысла перестают держать смысл. Образование, экспертиза, медиа,'}
        {' профессиональные гильдии — все эти большие здания, в которые мы веками сдавали свою'}
        {' растерянность, чтобы они нам обратно выдавали ориентир. Они ещё стоят, но внутри пусто.'}
        {' Дипломы выдают, а доверия к диплому нет. Эксперты говорят с экранов, а слушать их так,'}
        {' как слушали раньше, уже не получается. Стенки на месте, а внутри сквозит. Этот сквозняк'}
        {' — не злая воля. Здания просто построены под другой климат.'}
      </p>

      <p>
        {'Вторая — карта мира перестала совпадать с местностью. Объяснения, которые работали тридцать'}
        {' лет — про карьеру, про семью, про «сначала состояться, потом жить» — больше не'}
        {' объясняют, что происходит в обычный вторник. Люди теперь приходят не с проблемой, а с'}
        {' обрывками карты в руках. Они не понимают, по какой логике теперь раскладывается их жизнь.'}
        {' И никто из старших не может им эту логику дать, потому что у старших обрывки те же.'}
        {' Это первый раз за долгое время, когда поколение учителей не может передать'}
        {' ученикам работающую модель — её нет ни у кого.'}
      </p>

      <p>
        {'Третья — изменился сам вопрос. Раньше он звучал как «как». Как заработать,'}
        {' как удержать отношения, как пробить потолок. Сейчас — «зачем». Не как, а ради'}
        {' чего. Это другая глубина запроса, и под неё у старых инструментов нет дна. Холл формулирует'}
        {' это через смену базового экзистенциального вопроса; на земле это видно как смену самого'}
        {' регистра разговора — из делового в почти молитвенный.'}
      </p>

      <p>
        {'Я вижу этот сдвиг в своей работе каждую неделю: за последние годы запрос людей сместился'}
        {' с острой боли — у боли есть форма — на растерянность, у которой формы нет. Боль можно'}
        {' держать. Растерянность только проживается, в тумане, вместе. И в этой совместной слепоте'}
        {' сейчас больше честности, чем в любой уверенной речи с трибуны.'}
      </p>

      <p>И вот ключевое — то, ради чего весь этот раздел.</p>

      <p>
        <strong>{'Карта порвалась не из-за AI. AI пришёл, когда карта уже рвалась.'}</strong>
      </p>

      <p>
        {'Хронология сбивает с толку. AI у всех на экранах с 2022-го, разрыв смыслов чувствуется'}
        {' примерно тогда же — рука сама тянется связать одно с другим причинной связью. Но загляни'}
        {' глубже: институты не держали уже давно, молодые не верили старшим задолго до ChatGPT,'}
        {' вопрос «зачем» поднимался из-под спуда годами, только без слов. AI не сломал мир. Он вошёл'}
        {' в мир, который уже плыл, и стал видимой частью движения, которое шло до него. Он не'}
        {' водитель. Он попутчик в машине, у которой давно отказали тормоза.'}
      </p>

      <p>
        {'Это меняет адресата гнева. Если карта рвётся не из-за AI — винить его не за что.'}
        {' Сопротивляться ему как причине бессмысленно: он не причина.'}
        {' И вопрос перестаёт быть «впускать или не впускать». Вопрос — какой AI впускать, и в какого себя.'}
      </p>

      <p>
        {'Об этом — следующий акт. Он не про технологию. Он про то, что в тебе выбирает, чем эта технология станет.'}
      </p>
    </section>
  )
}
