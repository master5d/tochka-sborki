// feedback/scripts/lib.mjs
// Pure-функции feedback-конвейера: id, парсинг JSONL, генерация board.canvas.
// Без I/O — всё тестируется node:test без моков. I/O живёт в fb.mjs.
import { createHash } from 'node:crypto'

const SEVERITY_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#64748b' }
const CATEGORY_EMOJI = { bug: '🐛', feature: '✨', ux: '🎨', question: '❓', idea: '💡' }
const AREAS = ['lms', 'blog', 'hub', 'mentor', 'workers', 'course', 'infra']

/** id тикета: fb_<sha256(normalized)[:12]>. Нормализация — trim/collapse/lowercase. */
export function ticketId(content) {
  const normalized = content.trim().replace(/\s+/g, ' ').toLowerCase()
  return 'fb_' + createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 12)
}

/** JSONL → массив тикетов. Битые строки скипаются через onWarn (конвейер не валится). */
export function parseJsonl(text, onWarn) {
  const tickets = []
  for (const [i, line] of text.split('\n').entries()) {
    if (!line.trim()) continue
    try {
      tickets.push(JSON.parse(line))
    } catch {
      onWarn(`feedback.jsonl: битая строка ${i + 1} пропущена`)
    }
  }
  return tickets
}

/** Тикет → JSON Canvas нода. index задаёт детерминированную позицию в grid. */
export function ticketToNode(ticket, index) {
  const t = ticket.triage ?? {}
  return {
    id: ticket.id,
    type: 'text',
    x: 300 + (index % 4) * 280,
    y: 200 + Math.floor(index / 4) * 180,
    width: 240,
    height: 140,
    color: SEVERITY_COLOR[t.severity] ?? '#64748b',
    text: `${ticket.reopened ? '🔁 ' : ''}${CATEGORY_EMOJI[t.category] ?? '📌'} ${ticket.title}`,
    metadata: {
      'sovern:layer': t.area ?? 'infra',
      'sovern:status': ticket.status ?? 'idle',
      'sovern:reopened': ticket.reopened ?? false,
      'sovern:impact': t.impact ?? 5,
      'sovern:urgency': t.urgency ?? 5,
      'sovern:created': ticket.created,
      feedback: t,
    },
  }
}

/** Все тикеты → JSON Canvas: area-корни + тикеты + edges (иерархия для MindMap-вида). */
export function buildCanvas(tickets) {
  const usedAreas = AREAS.filter(a => tickets.some(t => (t.triage?.area ?? 'infra') === a))
  const areaNodes = usedAreas.map((area, i) => ({
    id: `area_${area}`,
    type: 'text',
    x: i * 320,
    y: 0,
    width: 200,
    height: 80,
    text: `📂 ${area.toUpperCase()}`,
    metadata: { 'sovern:layer': area, 'sovern:status': 'idle', 'sovern:impact': 5, 'sovern:urgency': 5 },
  }))
  const ticketNodes = tickets.map((t, i) => ticketToNode(t, i))
  const edges = tickets.map(t => ({
    id: `e_${t.id}`,
    fromNode: `area_${t.triage?.area ?? 'infra'}`,
    toNode: t.id,
  }))
  return { nodes: [...areaNodes, ...ticketNodes], edges }
}
