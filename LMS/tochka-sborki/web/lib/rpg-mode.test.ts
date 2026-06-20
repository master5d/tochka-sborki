import { describe, it, expect } from 'vitest'
import { plainLabel, PLAIN_OVERRIDES, SKILL_GATING_NOTE, type OverrideKey } from './rpg-mode'

const KEYS: OverrideKey[] = ['navQuestLog', 'enterQuestLog', 'sheetName', 'currency']

describe('rpg-mode', () => {
  it('plain mode returns the override', () => {
    expect(plainLabel('plain', 'ru', 'navQuestLog', '⬡ Квест-лог')).toBe('Мои уроки')
    expect(plainLabel('plain', 'en', 'currency', 'shards')).toBe('points')
  })

  it('rpg mode returns the fallback unchanged', () => {
    expect(plainLabel('rpg', 'ru', 'navQuestLog', '⬡ Квест-лог')).toBe('⬡ Квест-лог')
    expect(plainLabel('rpg', 'en', 'currency', 'shards')).toBe('shards')
  })

  it('every override key exists for both locales', () => {
    for (const key of KEYS) {
      expect(PLAIN_OVERRIDES.ru[key]).toBeTruthy()
      expect(PLAIN_OVERRIDES.en[key]).toBeTruthy()
    }
  })

  it('skill-gating note exists for both locales', () => {
    expect(SKILL_GATING_NOTE.ru).toBeTruthy()
    expect(SKILL_GATING_NOTE.en).toBeTruthy()
  })
})
