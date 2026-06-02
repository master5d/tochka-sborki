import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function DesOpsHub({ locale }: Props) {
  if (locale === 'en') throw new Error('EN translation pending')

  return (
    <div className={styles.prose}>
      <div style={{ 
        padding: '1.25rem', 
        borderLeft: '4px solid var(--text-accent)', 
        background: 'var(--bg-secondary)',
        marginBottom: '2.5rem',
        fontSize: '0.95rem',
        fontFamily: 'var(--font-mono)',
        lineHeight: 1.5
      }}>
        <b>Rationale:</b> Дизайн для инженера — это не декор, а интерфейс управления сложностью. В этой статье я раскрываю архитектуру DesOps Hub, которая легла в основу NAUTILUS. Это путь от «рисования кнопок» к программированию визуальных смыслов.
      </div>

      <p className={styles.lead}>
        {'Дизайн всегда был узким горлышком для инженеров. Вы можете собрать сложнейший бэкенд, но если ваш интерфейс выглядит как «привет из 2012-го», доверие пользователя испаряется раньше, чем загрузится первый чанк данных.'}
      </p>

      <p>
        {'Последние месяцы я строил DesOps Hub — систему, которая превращает дизайн из «творческой муки» в исполняемую инженерную спецификацию. Это мой отчет о том, как перестать двигать пиксели и начать ими дирижировать.'}
      </p>

      <h2>1. Архитектура DesOps: Порядок против Свалки</h2>
      <p>
        {'Главная ошибка при создании дизайн-системы — смешивание глобальных правил и рабочих файлов проектов. В NAUTILUS мы внедрили гибридную модель:'}
      </p>
      <ul>
        <li><b>Centralized Governance:</b> Все токены (цвета, сетки, шрифты) живут в ядре системы (`GLOBAL_DESIGN.md`).</li>
        <li><b>Decentralized Execution:</b> Каждый проект (например, Echo) хранит свои макеты, логи и специфичные стили у себя. Это исключает превращение системы в «свалку».</li>
      </ul>

      <h2>2. Дизайн-обвязка (The Design Harness)</h2>
      <p>
        {'Согласно модели Нитана У, мы не пытаемся «стать дизайнерами». Мы инсталлируем «обвязку», которая дает результат экспертного уровня силами одного инженера.'}
      </p>

      <div className={styles.boundary} style={{ margin: '2rem 0' }}>
        <h3>Layer 1: Skills (Экспертиза как код)</h3>
        <p>Мы «прошиваем» вкус топ-дизайнеров в AI-агентов. Команды вроде `/polish` заставляют ИИ проверять вёрстку на анти-паттерны:</p>
        <ul style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          <li>❌ <b>No Pure Blacks:</b> Запрет на `#000000`. Используем глубокие системные оттенки.</li>
          <li>❌ <b>Contrast Check:</b> Автоматический линтинг на соответствие WCAG.</li>
          <li>❌ <b>Nested Cards:</b> Борьба с избыточной вложенностью, которая выдает «дешевый» ИИ-дизайн.</li>
        </ul>

        <h3>Layer 2: Canvas (Агентные поверхности)</h3>
        <p>Дизайн происходит там, где ИИ является ядром (Kernel). Мы используем <b>Paper</b> для живого HTML/CSS кода и <b>Pencil</b> для JSON-based векторной точности. Никаких «handoffs» — дизайн и код едины.</p>

        <h3>Layer 3: The Eye (Визуальное ДНК)</h3>
        <p>Мы тренируем «насмотренность» системы, извлекая визуальный ритм и плотность данных из лучших продуктов мира. Это процесс <b>Visual DNA Extraction</b>.</p>
      </div>

      <h2>3. Архитектурный Элитизм: Pretext и Type Color</h2>
      <p>
        {'Мы отказались от ограничений стандартного DOM. Используя принципы алгоритма <b>Pretext</b> от Чэнлоу, мы перешли к измерению текста в «userland» (на стороне TS).'}
      </p>
      <p>
        {'Это позволяет нам управлять <b>Type Color</b> — равномерностью плотности текста. Теперь наши интерфейсы выглядят как дорогая швейцарская вёрстка, а не как хаотичный набор блоков. Мы целимся в производительность: 100,000+ элементов при 120fps.'}
      </p>

      <div style={{ margin: '2.5rem 0', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', background: 'var(--bg-primary)' }}>
        <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.25rem', color: 'var(--text-accent)' }}>DesOps Efficiency Metrics</h3>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          <li style={{ marginBottom: '0.5rem' }}>⚡ <b>Time to Market:</b> -40% (устранение разрыва дизайн-код)</li>
          <li style={{ marginBottom: '0.5rem' }}>🎯 <b>Visual Consistency:</b> 100% (driven by Master Tokens)</li>
          <li style={{ marginBottom: '0.5rem' }}>🦾 <b>Agent Autonomy:</b> High (управление через MCP)</li>
          <li>📖 <b>Type Color Stability:</b> LaTeX-grade (алгоритм Кнута-Пласса)</li>
        </ul>
      </div>

      <h2>4. Суверенная Hypermedia (SHA)</h2>
      <p>
        {'Мы внедрили <b>Sovereign Hypermedia Architecture</b>. Это возврат к мощи чистого веба через <b>htmx</b> и <b>Hyperview</b>.'}
      </p>
      <ul>
        <li><b>Locality of Behavior (LoB):</b> Вся логика компонента видна сразу в HTML. Никаких гигантских «app.js» с лапшой кода.</li>
        <li><b>Server-Driven Mobile:</b> Наши мобильные приложения — это «тонкие оболочки». Мы обновляем UI мгновенно, просто меняя код на сервере, в обход проверок в App Store.</li>
      </ul>

      <h2>5. Оркестрация: От смыслов до презентаций</h2>
      <p>
        {'Дизайн — это не только картинки, но и коммуникация. Наш хаб включает <b>Presenton (Presentation Orchestrator)</b>. Теперь архитектурные планы автоматически превращаются в профессиональные деки `.pptx`.'}
      </p>
      <p>
        {'Мы также внедрили <b>Asset Orchestration</b> для иллюстраций. Мы используем только модульные SVG-библиотеки (Humaaans, UnDraw), цвета в которых автоматически синхронизируются с нашими глобальными токенами.'}
      </p>

      <p style={{ marginTop: '3rem' }}>
        <strong>Будущее дизайна — это не Figma. Это DESIGN.md.</strong>
      </p>
      <p>
        {'Это единый источник истины, который одинаково хорошо понимают и люди, и машины. Это переход от «создания страниц» к «оркестрации генов» интерфейса. Добро пожаловать в эпоху суверенного инжиниринга, где ваш масштаб ограничен только глубиной вашей автоматизации.'}
      </p>
    </div>
  )
}
