import { describe, it, expect } from 'vitest'
import { fmtTokens, fmtCost, fmtDelta } from '@/lib/format'

describe('fmtTokens', () => {
  it('億', () => { expect(fmtTokens(1198684700)).toBe('11.99億') })
  it('万', () => { expect(fmtTokens(1024339)).toBe('102.43万') })
  it('small', () => { expect(fmtTokens(5000)).toBe('5,000') })
})

describe('fmtCost', () => {
  it('usd', () => { expect(fmtCost(837.5)).toBe('$837.50') })
})

describe('fmtDelta', () => {
  it('null', () => { expect(fmtDelta(null)).toBe('—') })
  it('plus', () => { expect(fmtDelta(200)).toBe('+200%') })
  it('minus', () => { expect(fmtDelta(-90)).toBe('-90%') })
})
