#!/usr/bin/env node
// feedback/scripts/fb.mjs — CLI triage-конвейера.
// Команды:
//   node fb.mjs add            — тикет-JSON из stdin → идемпотентный append + rebuild canvas
//   node fb.mjs status <id|префикс> <status> — смена статуса + rebuild
//   node fb.mjs build          — пересборка board.canvas из feedback.jsonl
// Директория данных: $FEEDBACK_DIR или ../ относительно скрипта (= feedback/).
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ticketId, parseJsonl, buildCanvas } from './lib.mjs'

const DIR = process.env.FEEDBACK_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '..')
const JSONL = join(DIR, 'feedback.jsonl')
const CANVAS = join(DIR, 'board.canvas')
const STATUSES = ['idle', 'pending', 'active', 'done', 'blocked']

const readTickets = () =>
  parseJsonl(existsSync(JSONL) ? readFileSync(JSONL, 'utf8') : '', w => console.warn('⚠', w))

const rebuild = tickets =>
  writeFileSync(CANVAS, JSON.stringify(buildCanvas(tickets), null, 2) + '\n')

const [cmd, ...args] = process.argv.slice(2)

switch (cmd) {
  case 'add': {
    const input = JSON.parse(readFileSync(0, 'utf8')) // stdin
    const id = ticketId(input.content)
    const tickets = readTickets()
    if (tickets.some(t => t.id === id)) {
      console.log(`duplicate: ${id} уже в feedback.jsonl — пропущено`)
      break
    }
    const ticket = { id, created: new Date().toISOString(), status: 'idle', ...input }
    appendFileSync(JSONL, JSON.stringify(ticket) + '\n')
    rebuild([...tickets, ticket])
    console.log(`added: ${id}`)
    break
  }
  case 'status': {
    const [prefix, status] = args
    if (!STATUSES.includes(status)) {
      console.error(`невалидный статус «${status}»; допустимо: ${STATUSES.join(', ')}`)
      process.exit(1)
    }
    const tickets = readTickets()
    const matches = tickets.filter(t => t.id.startsWith(prefix))
    if (matches.length !== 1) {
      console.error(matches.length === 0 ? `тикет «${prefix}» не найден` : `«${prefix}» неоднозначен (${matches.length} совпадений)`)
      process.exit(1)
    }
    matches[0].status = status
    writeFileSync(JSONL, tickets.map(t => JSON.stringify(t)).join('\n') + '\n')
    rebuild(tickets)
    console.log(`status: ${matches[0].id} → ${status}`)
    break
  }
  case 'build': {
    const tickets = readTickets()
    rebuild(tickets)
    console.log(`built: ${tickets.length} тикетов → board.canvas`)
    break
  }
  default:
    console.error('usage: fb.mjs add|status <id> <status>|build')
    process.exit(1)
}
