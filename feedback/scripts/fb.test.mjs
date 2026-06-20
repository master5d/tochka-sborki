import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const CLI = join(dirname(fileURLToPath(import.meta.url)), 'fb.mjs')
let dir

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'fb-'))
  writeFileSync(join(dir, 'feedback.jsonl'), '')
})

const run = (args, input) =>
  execFileSync('node', [CLI, ...args], { cwd: dir, input, encoding: 'utf8', env: { ...process.env, FEEDBACK_DIR: dir } })

const sampleTicket = JSON.stringify({
  source: 'paste', content: 'Аватар падает на PNG', title: 'Аватар падает на PNG', status: 'idle',
  triage: { category: 'bug', severity: 'high', area: 'lms', impact: 8, urgency: 7, confidence: 0.9, reason: 'crash' },
})

test('add: добавляет тикет, проставляет id+created, собирает canvas', () => {
  const out = run(['add'], sampleTicket)
  assert.match(out, /fb_[0-9a-f]{12}/)
  const lines = readFileSync(join(dir, 'feedback.jsonl'), 'utf8').trim().split('\n')
  assert.equal(lines.length, 1)
  const saved = JSON.parse(lines[0])
  assert.match(saved.id, /^fb_[0-9a-f]{12}$/)
  assert.ok(saved.created)
  assert.ok(existsSync(join(dir, 'board.canvas')))
  const canvas = JSON.parse(readFileSync(join(dir, 'board.canvas'), 'utf8'))
  assert.ok(canvas.nodes.some(n => n.id === saved.id))
})

test('add: дубликат по контенту не добавляется (идемпотентность)', () => {
  run(['add'], sampleTicket)
  const out = run(['add'], sampleTicket)
  assert.match(out, /duplicate/i)
  const lines = readFileSync(join(dir, 'feedback.jsonl'), 'utf8').trim().split('\n')
  assert.equal(lines.length, 1)
})

test('status: меняет статус по префиксу id и пересобирает canvas', () => {
  const out = run(['add'], sampleTicket)
  const id = out.match(/fb_[0-9a-f]{12}/)[0]
  run(['status', id.slice(0, 8), 'active'])
  const saved = JSON.parse(readFileSync(join(dir, 'feedback.jsonl'), 'utf8').trim())
  assert.equal(saved.status, 'active')
  const canvas = JSON.parse(readFileSync(join(dir, 'board.canvas'), 'utf8'))
  assert.equal(canvas.nodes.find(n => n.id === id).metadata['sovern:status'], 'active')
})

test('status: невалидный статус → ошибка, файл не тронут', () => {
  const out = run(['add'], sampleTicket)
  const id = out.match(/fb_[0-9a-f]{12}/)[0]
  assert.throws(() => run(['status', id, 'wat']))
  // файл genuinely не тронут — статус остался idle
  const saved = JSON.parse(readFileSync(join(dir, 'feedback.jsonl'), 'utf8').trim())
  assert.equal(saved.status, 'idle')
})

test('build: пересобирает canvas из jsonl с нуля', () => {
  run(['add'], sampleTicket)
  writeFileSync(join(dir, 'board.canvas'), 'мусор')
  run(['build'])
  const canvas = JSON.parse(readFileSync(join(dir, 'board.canvas'), 'utf8'))
  assert.ok(canvas.nodes.length >= 2) // area-корень + тикет
})

test('add: id и created нельзя подделать через входной JSON', () => {
  const forged = JSON.stringify({
    id: 'fb_forged000000',
    created: '1970-01-01T00:00:00Z',
    source: 'paste',
    content: 'Попытка подделки id',
    title: 'Попытка подделки id',
    triage: { category: 'bug', severity: 'low', area: 'lms', impact: 1, urgency: 1, confidence: 0.5, reason: 'test' },
  })
  run(['add'], forged)
  const saved = JSON.parse(readFileSync(join(dir, 'feedback.jsonl'), 'utf8').trim())
  assert.match(saved.id, /^fb_[0-9a-f]{12}$/)
  assert.notEqual(saved.id, 'fb_forged000000')
  assert.notEqual(saved.created, '1970-01-01T00:00:00Z')
})

test('reopen-guard: done→idle метит reopened, закрытие блокируется без --verified, проходит с ним', () => {
  const out = run(['add'], sampleTicket)
  const id = out.match(/fb_[0-9a-f]{12}/)[0]
  const read = () => JSON.parse(readFileSync(join(dir, 'feedback.jsonl'), 'utf8').trim())

  // свежий тикет закрывается свободно
  run(['status', id, 'done'])
  assert.equal(read().status, 'done')

  // увод из done → reopened + 🔁 на доске
  const reopenOut = run(['status', id, 'idle'])
  assert.match(reopenOut, /reopened/)
  let saved = read()
  assert.equal(saved.reopened, true)
  assert.equal(saved.reopen_count, 1)
  const canvas = JSON.parse(readFileSync(join(dir, 'board.canvas'), 'utf8'))
  const node = canvas.nodes.find(n => n.id === id)
  assert.match(node.text, /🔁/)
  assert.equal(node.metadata['sovern:reopened'], true)

  // закрыть reopened без --verified → блок, статус не меняется
  assert.throws(() => run(['status', id, 'done']))
  assert.equal(read().status, 'idle')

  // с --verified → закрывается, флаг снят, счётчик сохранён
  run(['status', id, 'done', '--verified'])
  saved = read()
  assert.equal(saved.status, 'done')
  assert.equal(saved.reopened, undefined)
  assert.equal(saved.reopen_count, 1)
})

test('add: невалидный JSON на stdin → ошибка', () => {
  assert.throws(() => run(['add'], 'не json'))
})

test('add: без content → ошибка', () => {
  assert.throws(() => run(['add'], '{"title":"x"}'))
})
