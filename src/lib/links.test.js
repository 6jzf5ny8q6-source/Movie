import { describe, it, expect } from 'vitest'
import { imdbUrl, rtUrl } from './links.js'

describe('links', () => {
  it('deep-links to IMDb when a verified id exists', () => {
    expect(imdbUrl({ title: 'Parasite', year: 2019, imdbId: 'tt6751668' }))
      .toBe('https://www.imdb.com/title/tt6751668/')
  })

  it('falls back to an IMDb title+year search', () => {
    expect(imdbUrl({ title: 'Parasite', year: 2019 }))
      .toBe('https://www.imdb.com/find/?s=tt&q=Parasite%202019')
  })

  it('builds a Rotten Tomatoes search link', () => {
    expect(rtUrl({ title: 'The Bear' }))
      .toBe('https://www.rottentomatoes.com/search?search=The%20Bear')
  })
})
