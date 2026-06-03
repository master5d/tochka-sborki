import styles from '../Prologue.module.css'
import { SovereigntyFormula, SystemicIntegrationMindmap } from '../PrologueDiagrams'

type Props = { locale: 'ru' | 'en' }

export function Assembly({ locale }: Props) {
  if (locale === 'en') {
    return (
      <section className={styles.assembly}>
        <h2 className={styles.sectionHeading}>Assembly</h2>

        <SystemicIntegrationMindmap />

        <SovereigntyFormula />

        <p>
          {'Three things are true at the same time. First: outside, the world is changing state,'}
          {' and the old maps no longer lead anywhere. Second: into the middle of that movement'}
          {' came a tool that can be held personally, at home, in your own voice — or handed over'}
          {" to someone else's server farm. Third: between the outside and the tool stands a person"}
          {" who either has a point where they are not fragmented, or doesn't. Great Transition"}
          {' outside + personal instrument in the middle + assembly inside = one practice. The'}
          {' three levels hold each other. Remove one — the other two collapse.'}
        </p>

        <p>
          {'And this practice has a name — the Assembly Point. That same place inside you that you'}
          {' recognized a little earlier, when you remembered how everything once gathered into'}
          {' one. It does one simple thing: returns you to yourself just enough so that the new'}
          {" instrument beside you becomes an extension of your voice, not its replacement. This"}
          {" isn't a methodology or a set of techniques. It's a way of sitting down at the screen"}
          {' without leaving yourself. And that is precisely what answers the question "what for"'}
          {' that grew out of the torn map. Not "how to keep up," not "how to cash in on the new'}
          {' wave," not "how not to fall behind." But — what do I pick up this tool for, and what'}
          {' inside me needs to be assembled for it to work for me, not just through me. '}
          <strong>
            {"This isn't a programming course. It's a course in reassembling yourself in an age"}
            {' of fragmentation — through the very tool that once felt like the enemy.'}
          </strong>
        </p>

        <p>
          {"And immediately, honestly, so there's no pedestal between us: I don't have the ready"}
          {' answer myself. The wall comes back sometimes, the voice gets lost sometimes, and I sit'}
          {" down and reassemble again. I didn't find a way out into the new world. I found a way"}
          {' in. A narrow door through which you can pass without leaving your craft behind, or your'}
          {" subtlety, or thirteen years of listening to people through pauses. And this door isn't"}
          {" mine alone — it's built so that it opens for anyone willing to sit down and try"}
          {' assembling themselves alongside the tool.'}
        </p>

        <p>
          {"The door is open. Whether to walk through — that's yours to decide. Just don't fool"}
          {' yourself with the old choice: "staying on the sidelines to preserve myself" no longer'}
          {" works. You don't preserve yourself on the sidelines. You preserve yourself assembled"}
          {' — anywhere, even right here at this screen.'}
        </p>
      </section>
    )
  }

  return (
    <section className={styles.assembly}>
      <h2 className={styles.sectionHeading}>Сборка</h2>

      <SystemicIntegrationMindmap />

      <SovereigntyFormula />

      <p>
        {'Три вещи верны одновременно. Первая: снаружи земля меняет агрегатное состояние, и старые карты больше не ведут.'}
        {' Вторая: внутрь этого движения вошёл инструмент, который держится в руках лично, у себя дома, своим голосом — или отдаётся чужой серверной.'}
        {' Третья: между внешним и инструментом стоит человек, у которого либо есть точка, в которой он не расщеплён, либо нет.'}
        {' Великий переход снаружи + личный инструмент посередине + собранность внутри = одна практика.'}
        {' Три уровня держат друг друга. Убери один — рассыпаются остальные два.'}
      </p>

      <p>
        {'И у этой практики есть имя — Точка Сборки. То самое место в тебе, которое ты узнал чуть'}
        {' выше, когда вспоминал, как однажды всё внутри сошлось в одно. Оно делает простую вещь:'}
        {' возвращает тебя в себя ровно настолько, чтобы рядом новый инструмент стал продолжением'}
        {' твоего голоса, а не его заменой. Это не методология и не набор техник. Это способ'}
        {' садиться к экрану так, чтобы не уходить из себя. Именно это отвечает на тот вопрос'}
        {' «зачем», который вырос из порванной карты. Не «как успеть», не «как заработать на новой'}
        {' волне», не «как не отстать». А — ради чего я вообще беру этот инструмент в руки и что во'}
        {' мне должно быть собрано, чтобы он работал на меня, а не через меня. '}
        <strong>
          {'Это не курс программирования. Это курс собирания себя в эпоху расщепления — через инструмент, который раньше казался врагом.'}
        </strong>
      </p>

      <p>
        {'И сразу честно, чтобы между нами не было трибуны: у меня самого нет готового ответа. Стена'}
        {' иногда возвращается, голос иногда теряется, и я снова сажусь и собираюсь заново. Я не'}
        {' нашёл выход в новый мир. Я нашёл вход. Узкую дверь, в которую можно пройти, не оставив'}
        {' снаружи ни ремесло, ни тонкость, ни тринадцать лет слушания людей через паузы. И эта'}
        {' дверь не моя личная — она устроена так, что открывается каждому, кто готов сесть и'}
        {' попробовать собраться рядом с инструментом.'}
      </p>

      <p>
        {'Дверь открыта. Войти или нет — теперь твоё дело. Только не обманывай себя прежним выбором:'}
        {' «остаться в стороне, чтобы сохранить себя» больше не работает. Себя сохраняют не в'}
        {' стороне. Себя сохраняют собранным — где угодно, хоть прямо у этого экрана.'}
      </p>
    </section>
  )
}
