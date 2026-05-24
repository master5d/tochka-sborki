import { describe, it, expect } from 'vitest'
import { buildDungeon } from './build-dungeon'
import type { DungeonInput } from './types'

function base(over: Partial<DungeonInput> = {}): DungeonInput {
  return {
    locale: 'ru',
    skin: 'slavic-myth',
    niche: 'coach',
    outcome: null,
    isModuleCompleted: () => true,
    ...over,
  }
}

describe('buildDungeon', () => {
  it('maps niche to its module and names from the flavor bank', () => {
    const v = buildDungeon(base())
    expect(v.niche).toBe('coach')
    expect(v.module).toBe('04-prompt-engineering')
    expect(v.dungeonName).toBe('Чертог Резонанса')
    expect(v.boss.name).toBe('Эхо Сомнения')
  })

  it('produces 3 stages at escalating tiers with cs 15', () => {
    const v = buildDungeon(base())
    expect(v.stages.map(s => s.tier)).toEqual(['task', 'process', 'outcome'])
    expect(v.stages.map(s => s.id)).toEqual(['dungeon:coach:s1', 'dungeon:coach:s2', 'dungeon:coach:s3'])
    expect(v.stages.every(s => s.cs === 15)).toBe(true)
    expect(v.stages.every(s => s.body.length > 0)).toBe(true)
  })

  it('boss has cs 50, namespaced id, and slot-filled body', () => {
    const v = buildDungeon(base({ niche: 'coach', outcome: 'more clients' }))
    expect(v.boss.id).toBe('dungeon:coach:boss')
    expect(v.boss.cs).toBe(50)
    expect(v.boss.body).toContain('more clients')
    expect(v.boss.body).not.toContain('{outcome}')
    expect(v.boss.body).not.toContain('{niche}')
  })

  it('is locked when the niche module is not completed', () => {
    expect(buildDungeon(base({ isModuleCompleted: () => false })).locked).toBe(true)
    expect(buildDungeon(base({ isModuleCompleted: () => true })).locked).toBe(false)
  })

  it('falls back to the "other" flavor for an unknown/null niche', () => {
    const v = buildDungeon(base({ niche: null }))
    expect(v.niche).toBe('other')
    expect(v.dungeonName).toBe('Безымянный Предел')
    expect(v.boss.id).toBe('dungeon:other:boss')
  })

  it('is deterministic for the same input', () => {
    expect(buildDungeon(base())).toEqual(buildDungeon(base()))
  })
})
