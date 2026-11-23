import { describe, it, expect } from 'vitest'
import { resolveRegion, watchSearchUrl, regionName } from './region.js'

describe('region helpers', () => {
  it('resolves an explicit region code as-is', () => {
    expect(resolveRegion('GB')).toBe('GB')
  })

  it('falls back to US for unknown codes', () => {
    expect(resolveRegion('ZZ')).toBe('US')
  })

  it("resolves 'auto' to a valid two-letter region", () => {
    expect(resolveRegion('auto')).toMatch(/^[A-Z]{2}$/)
  })

  it('builds a region-scoped watch search link', () => {
    expect(watchSearchUrl('The Bear', 'GB')).toBe('https://www.justwatch.com/gb/search?q=The%20Bear')
  })

  it('names known regions', () => {
    expect(regionName('US')).toBe('United States')
  })
})
