import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { fetchLiveCatalog, enrichProviders, enrichWithImdb } from './tmdb.js'

// Canned TMDB/OMDb responses routed by URL, so we can verify parsing, the
// across-all-years Discover pool, and real provider resolution without a key.
const calls = []
function route(url) {
  calls.push(url)
  if (url.includes('/discover/movie')) {
    return { results: [
      { id: 1, title: 'Old Sci-Fi', release_date: '1982-06-25', genre_ids: [878], vote_average: 8.1, poster_path: '/a.jpg', overview: 'x' },
      { id: 2, title: 'Nineties Pick', release_date: '1994-09-23', genre_ids: [18], vote_average: 8.9, overview: 'y' },
    ] }
  }
  if (url.includes('/movie/top_rated')) {
    return { results: [{ id: 3, title: 'Classic 1972', release_date: '1972-03-24', genre_ids: [80, 18], vote_average: 9.2, overview: 'z' }] }
  }
  if (url.includes('/discover/tv')) {
    return { results: [{ id: 10, name: 'A Show', first_air_date: '2008-01-20', genre_ids: [18], vote_average: 9.0, overview: 't' }] }
  }
  if (url.includes('/tv/top_rated')) {
    return { results: [{ id: 11, name: 'Old Show', first_air_date: '2001-06-03', genre_ids: [80], vote_average: 9.1, overview: 'o' }] }
  }
  if (url.includes('/movie/1/watch/providers')) return { results: { US: { link: 'https://jw/us/movie1', flatrate: [{ provider_name: 'Netflix' }] } } }
  if (url.includes('/movie/2/watch/providers')) return { results: { US: { link: 'https://jw/us/movie2', rent: [{ provider_name: 'Apple TV' }] } } }
  if (url.includes('/movie/3/watch/providers')) return { results: { GB: { flatrate: [{ provider_name: 'Netflix' }] } } } // not in US
  if (url.includes('/watch/providers')) return { results: { US: { link: 'https://jw/us/tv', flatrate: [{ provider_name: 'HBO Max' }] } } }
  if (url.includes('omdbapi.com')) {
    return { Response: 'True', imdbRating: '8.5', Ratings: [{ Source: 'Rotten Tomatoes', Value: '93%' }] }
  }
  return { results: [] }
}

beforeEach(() => {
  calls.length = 0
  global.fetch = vi.fn(async (url) => ({ ok: true, json: async () => route(url) }))
})
afterEach(() => { vi.restoreAllMocks() })

describe('fetchLiveCatalog', () => {
  it('pulls a pool spanning many years, not just recent releases', async () => {
    const items = await fetchLiveCatalog('KEY', { genres: ['Sci-Fi', 'Drama'] })
    const years = items.map((i) => i.year).sort()
    expect(years).toContain(1972)
    expect(years).toContain(1982)
    expect(years).toContain(1994)
    expect(items.some((i) => i.type === 'show')).toBe(true)
  })

  it('biases Discover by the user genres and applies no year filter', async () => {
    await fetchLiveCatalog('KEY', { genres: ['Sci-Fi'] })
    const discover = calls.find((u) => u.includes('/discover/movie'))
    expect(discover).toMatch(/with_genres=878/)
    expect(discover).not.toMatch(/release_date|primary_release_year|first_air_date=/)
  })
})

describe('enrichProviders', () => {
  it('sets the region-specific provider + watch link, with fallbacks', async () => {
    const items = await fetchLiveCatalog('KEY', {})
    await enrichProviders(items, 'KEY', 'US')
    const byId = Object.fromEntries(items.map((i) => [i._tmdbId, i]))
    expect(byId[1].service).toBe('Netflix')
    expect(byId[1].watchLink).toBe('https://jw/us/movie1')
    expect(byId[2].service).toBe('Rent or buy')            // only rent in US
    expect(byId[3].service).toBe('Not on streaming in US') // only available in GB
    expect(byId[3].watchLink).toBeNull()
    expect(byId[10].service).toBe('Max')                   // HBO Max -> Max label
  })
})

describe('enrichWithImdb', () => {
  it('applies true IMDb and Rotten Tomatoes scores', async () => {
    const items = [{ title: 'X', year: 2000, imdb: 7, _tmdbId: 1, _tmdbType: 'movie' }]
    await enrichWithImdb(items, 'OMDBKEY')
    expect(items[0].imdb).toBe(8.5)
    expect(items[0].ratingSource).toBe('IMDb')
    expect(items[0].rt).toBe(93)
  })
})
