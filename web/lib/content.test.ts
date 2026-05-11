import { describe, it, expect } from 'vitest'
import { getAllLessons, getLessonBySlug, getPageContent } from './content'

describe('getAllLessons', () => {
  it('returns only numbered lesson files (00-06)', () => {
    const lessons = getAllLessons()
    expect(lessons.length).toBe(7)
    for (const lesson of lessons) {
      expect(lesson.slug).toMatch(/^\d{2}-/)
    }
  })

  it('lessons are sorted by order ascending', () => {
    const lessons = getAllLessons()
    for (let i = 1; i < lessons.length; i++) {
      expect(lessons[i].order).toBeGreaterThan(lessons[i - 1].order)
    }
  })

  it('each lesson has required fields', () => {
    const lessons = getAllLessons()
    for (const lesson of lessons) {
      expect(typeof lesson.slug).toBe('string')
      expect(typeof lesson.title).toBe('string')
      expect(typeof lesson.description).toBe('string')
      expect(typeof lesson.order).toBe('number')
      expect(typeof lesson.duration).toBe('string')
      expect(typeof lesson.level).toBe('number')
    }
  })
})

describe('getLessonBySlug', () => {
  it('returns content and meta for 01-introduction', () => {
    const result = getLessonBySlug('01-introduction')
    expect(result.content).toBeTruthy()
    expect(result.meta.title).toBe('Meeting 1: Знакомство')
    expect(result.meta.order).toBe(1)
  })

  it('throws for unknown slug', () => {
    expect(() => getLessonBySlug('99-nonexistent')).toThrow()
  })
})

describe('getPageContent', () => {
  it('returns content and meta for cheatsheet', () => {
    const result = getPageContent('cheatsheet')
    expect(result.content).toBeTruthy()
    expect(result.meta.title).toBeTruthy()
  })

  it('returns content and meta for roadmap', () => {
    const result = getPageContent('roadmap')
    expect(result.content).toBeTruthy()
  })
})
