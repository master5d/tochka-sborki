#!/usr/bin/env node
// feedback/scripts/fb.mjs — CLI triage-конвейера.
// Команды:
//   node fb.mjs add            — тикет-JSON из stdin → идемпотентный append + rebuild canvas
//   node fb.mjs status <id|префикс> <status> — смена статуса + rebuild
//   node fb.mjs build          — пересборка board.canvas из feedback.jsonl
// Директория данных: $FEEDBACK_DIR или ../ относительно скрипта (= feedback/).
import {
  readFileSync, writeFileSync, appendFileSync, existsSync, renameSync, rmSync,
  openSync, closeSync, statSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ticketId, parseJsonlRecords, buildCanvas, foreignCanvasParts } from './lib.mjs'

const DIR = process.env.FEEDBACK_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '..')
const JSONL = join(DIR, 'feedback.jsonl')
const CANVAS = join(DIR, 'board.canvas')
const STATUSES = ['idle', 'pending', 'active', 'done', 'blocked']

const usage = () => 'usage: fb.mjs add | status <id|prefix> <status> [--verified] | build'

const failUsage = message => {
  if (message) console.error(message)
  console.error(usage())
  process.exit(2)
}

const atomicWriteFile = (file, data) => {
  const tmp = `${file}.tmp`
  try {
    writeFileSync(tmp, data)
    renameSync(tmp, file)
  } catch (error) {
    try {
      rmSync(tmp, { force: true })
    } catch {}
    throw error
  }
}

const readRecords = () => {
  const warnings = []
  const records = parseJsonlRecords(existsSync(JSONL) ? readFileSync(JSONL, 'utf8') : '', w => warnings.push(w))
  if (warnings.length) {
    console.warn(`⚠ ${warnings.length} битых строк feedback.jsonl сохранено без изменений`)
    for (const warning of warnings) console.warn('⚠', warning)
  }
  return records
}

const ticketsFrom = records => records.filter(r => r.ok).map(r => r.value)

const serializeRecords = records =>
  records.map(r => r.ok ? JSON.stringify(r.value) : r.raw).join('\n') + (records.length ? '\n' : '')

// Лок-протокол ОБЯЗАН совпадать с MCP-сервером sovern-canvas
// (MindMapping/src/mcp/canvasFileStore.ts): та же доска, тот же `<файл>.lock`,
// те же пороги. Разойдутся — лок перестанет что-либо защищать.
const LOCK_TIMEOUT_MS = 5_000
const LOCK_STALE_MS = 30_000

const withCanvasLock = fn => {
  const lockPath = `${CANVAS}.lock`
  const deadline = Date.now() + LOCK_TIMEOUT_MS
  let fd
  for (;;) {
    try {
      fd = openSync(lockPath, 'wx')
      break
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      let ageMs
      try {
        ageMs = Date.now() - statSync(lockPath).mtimeMs
      } catch {
        continue // держатель освободил лок между open и stat
      }
      if (ageMs > LOCK_STALE_MS) {
        rmSync(lockPath, { force: true })
        continue
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `board.canvas занят другим процессом (${lockPath}, ${Math.round(ageMs)} мс) — ` +
            `пересборка отменена, чтобы не затереть чужую запись`
        )
      }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 15)
    }
  }
  try {
    return fn()
  } finally {
    closeSync(fd)
    rmSync(lockPath, { force: true })
  }
}

// Пересборка сохраняет чужие узлы (их пишет MCP sovern-canvas в ту же доску):
// полная перегенерация из feedback.jsonl их стирала.
const rebuild = tickets =>
  withCanvasLock(() => {
    const ours = buildCanvas(tickets)
    let existing = null
    if (existsSync(CANVAS)) {
      try {
        existing = JSON.parse(readFileSync(CANVAS, 'utf8'))
      } catch (error) {
        // Не отказ: из нечитаемого файла чужие узлы не спасти ничем, а `build` —
        // это и есть команда восстановления битой доски. Но потеря должна быть
        // громкой, а не молчаливой.
        console.warn(
          `⚠ board.canvas не разбирается (${error.message}) — доска пересобирается с нуля; ` +
            `чужие узлы (MCP/ручные), если они там были, восстановить неоткуда`
        )
      }
    }
    const foreign = foreignCanvasParts(existing, ours)
    if (foreign.nodes.length) {
      console.warn(`⚠ сохранено чужих узлов на доске: ${foreign.nodes.length} (MCP/ручные)`)
    }
    const merged = {
      ...ours,
      nodes: [...ours.nodes, ...foreign.nodes],
      edges: [...ours.edges, ...foreign.edges],
    }
    atomicWriteFile(CANVAS, JSON.stringify(merged, null, 2) + '\n')
  })

const [cmd, ...args] = process.argv.slice(2)

switch (cmd) {
  case 'add': {
    if (args.length) failUsage(`unknown add argument: ${args[0]}`)
    let input
    try {
      input = JSON.parse(readFileSync(0, 'utf8'))
    } catch {
      console.error('add: stdin должен быть JSON-тикетом')
      process.exit(1)
    }
    if (typeof input.content !== 'string' || !input.content.trim()) {
      console.error('add: поле content (строка) обязательно')
      process.exit(1)
    }
    const id = ticketId(input.content)
    const records = readRecords()
    const tickets = ticketsFrom(records)
    if (tickets.some(t => t.id === id)) {
      console.log(`duplicate: ${id} уже в feedback.jsonl — пропущено`)
      break
    }
    const ticket = { status: 'idle', ...input, id, created: new Date().toISOString() }
    appendFileSync(JSONL, JSON.stringify(ticket) + '\n')
    rebuild([...tickets, ticket])
    console.log(`added: ${id}`)
    break
  }
  case 'status': {
    const unknownFlag = args.find(a => a.startsWith('--') && a !== '--verified')
    if (unknownFlag) failUsage(`unknown flag: ${unknownFlag}`)
    // --verified снимает reopen-guard при закрытии переоткрытого тикета.
    const verified = args.includes('--verified')
    const [prefix, status] = args.filter(a => a !== '--verified')
    if (!prefix || !status || args.filter(a => a !== '--verified').length !== 2) failUsage()
    if (!STATUSES.includes(status)) {
      console.error(`невалидный статус «${status}»; допустимо: ${STATUSES.join(', ')}`)
      process.exit(1)
    }
    const records = readRecords()
    const tickets = ticketsFrom(records)
    const matches = tickets.filter(t => t.id.startsWith(prefix))
    if (matches.length !== 1) {
      console.error(matches.length === 0 ? `тикет «${prefix}» не найден` : `«${prefix}» неоднозначен (${matches.length} совпадений)`)
      process.exit(1)
    }
    const ticket = matches[0]
    const wasDone = ticket.status === 'done'
    // Переоткрытие: бывший-done (или уже-reopened) уводят в открытый статус → метим reopened.
    if (status !== 'done' && (wasDone || ticket.reopened)) {
      ticket.reopened = true
      if (wasDone) ticket.reopen_count = (ticket.reopen_count ?? 0) + 1
    }
    // Reopen-guard: закрыть переоткрытый тикет можно только после проверки исполнения (--verified).
    if (status === 'done' && ticket.reopened && !verified) {
      console.error(`«${ticket.id}» переоткрывался (reopen_count=${ticket.reopen_count ?? 1}) — проверь исполнение, затем закрывай: fb.mjs status ${prefix} done --verified`)
      process.exit(1)
    }
    if (status === 'done' && verified) delete ticket.reopened
    ticket.status = status
    atomicWriteFile(JSONL, serializeRecords(records))
    rebuild(tickets)
    const tag = ticket.reopened ? ' 🔁 reopened' : verified ? ' (verified)' : ''
    console.log(`status: ${ticket.id} → ${status}${tag}`)
    break
  }
  case 'build': {
    if (args.length) failUsage(`unknown build argument: ${args[0]}`)
    const tickets = ticketsFrom(readRecords())
    rebuild(tickets)
    console.log(`built: ${tickets.length} тикетов → board.canvas`)
    break
  }
  default:
    failUsage(cmd ? `unknown command: ${cmd}` : undefined)
}
