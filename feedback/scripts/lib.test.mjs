import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ticketId, parseJsonl, ticketToNode, buildCanvas } from './lib.mjs'

test('ticketId: детерминирован и нечувствителен к whitespace/регистру', () => {
  const a = ticketId('Аватар  падает на PNG')
  const b = ticketId('  аватар падает на png \n')
  assert.equal(a, b)
  assert.match(a, /^fb_[0-9a-f]{12}$/)
})

test('ticketId: разный контент → разный id', () => {
  assert.notEqual(ticketId('текст один'), ticketId('текст два'))
})

test('parseJsonl: парсит строки, скипает битые с warning', () => {
  const warnings = []
  const out = parseJsonl('{"id":"fb_1","title":"a"}\nне json\n{"id":"fb_2","title":"b"}\n', w => warnings.push(w))
  assert.equal(out.length, 2)
  assert.equal(out[1].id, 'fb_2')
  assert.equal(warnings.length, 1)
})

test('parseJsonl: пустой файл → пустой массив', () => {
  assert.deepEqual(parseJsonl('', () => {}), [])
})

const sample = {
  id: 'fb_abc123def456', source: 'paste', created: '2026-06-09T12:00:00Z',
  content: 'Аватар-генератор падает на PNG', title: 'Аватар падает на PNG', status: 'idle',
  triage: { category: 'bug', severity: 'high', area: 'lms', impact: 8, urgency: 7, confidence: 0.9, reason: 'crash в core flow' },
}

test('ticketToNode: маппит тикет в canvas-ноду со всеми sovern:* полями', () => {
  const node = ticketToNode(sample, 0)
  assert.equal(node.id, 'fb_abc123def456')
  assert.equal(node.type, 'text')
  assert.equal(node.text, '🐛 Аватар падает на PNG')
  assert.equal(node.color, '#f97316') // high
  assert.equal(node.metadata['sovern:layer'], 'lms')
  assert.equal(node.metadata['sovern:status'], 'idle')
  assert.equal(node.metadata['sovern:impact'], 8)
  assert.equal(node.metadata['sovern:urgency'], 7)
  assert.deepEqual(node.metadata['feedback'], sample.triage)
})

test('buildCanvas: area-корни + edges корень→тикет', () => {
  const canvas = buildCanvas([sample])
  const root = canvas.nodes.find(n => n.id === 'area_lms')
  assert.ok(root, 'есть корневая нода area_lms')
  assert.equal(root.metadata['sovern:layer'], 'lms')
  const edge = canvas.edges.find(e => e.fromNode === 'area_lms' && e.toNode === 'fb_abc123def456')
  assert.ok(edge, 'есть edge от area-корня к тикету')
})

test('buildCanvas: area-корень не создаётся для пустых area', () => {
  const canvas = buildCanvas([sample])
  assert.equal(canvas.nodes.filter(n => n.id.startsWith('area_')).length, 1)
})

test('buildCanvas: детерминирован (одинаковый вход → одинаковый JSON)', () => {
  const a = JSON.stringify(buildCanvas([sample]))
  const b = JSON.stringify(buildCanvas([sample]))
  assert.equal(a, b)
})
