import { describe, it, expect } from 'vitest'
import { STORE_PRODUCTS } from './products.data'

describe('STORE_PRODUCTS', () => {
  it('has unique ids and positive integer prices', () => {
    const ids = STORE_PRODUCTS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of STORE_PRODUCTS) {
      expect(Number.isInteger(p.priceCents)).toBe(true)
      expect(p.priceCents).toBeGreaterThan(0)
    }
  })
})
