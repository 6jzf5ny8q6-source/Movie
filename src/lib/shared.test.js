import { describe, it, expect } from 'vitest'
import { compactFromDetails, expandShared, mergeCatalog, graphFrom } from './shared.js'
import { buildCatalog } from '../../scripts/build-catalog.mjs'

const details = {
  id: 1396,
  name: 'Breaking Bad',
  first_air_date: '2008-01-20',
  vote_average: 8.92,
  genres: [{ id: 80 }, { id: 18 }],
  episode_run_time: [47],
  overview: 'A chemistry teacher...',
  poster_path: '/bb.jpg',
  external_ids: { imdb_id: 'tt0903747' },
  'watch/providers': {
    results: {
      US: { flatrate: [{ provider_name: 'Netflix', logo_path: '/n.jpg' }] },
      GB: { rent: [{ provider_name: 'Apple TV' }] },
    },
  },
  recommendations: { results: [{ media_type: 'tv', name: 'Better Call Saul', first_air_date: '2015-02-08' }] },
}

describe('compact + expand', () => {
  const rec = compactFromDetails(details, 'tv', ['US', 'GB', 'CA'])

  it('packs the essentials compactly', () => {
    expect(rec.k).toBe('show:breaking bad:2008')
    expect(rec.g).toEqual(['Crime', 'Drama'])
    expect(rec.id).toBe('tt0903747')
    expect(rec.w).toEqual({ US: [['Netflix', '/n.jpg']], GB: 'r' })
    expect(rec.rc).toEqual(['show:better call saul:2015'])
  })

  it('expands per region: provider + logo + watch link', () => {
    const [us] = expandShared({ items: [rec] }, 'US')
    expect(us.service).toBe('Netflix')
    expect(us.providers[0].logo).toMatch(/w45\/n\.jpg$/)
    expect(us.watchLink).toBe('https://www.themoviedb.org/tv/1396/watch?locale=US')
    expect(us.imdbId).toBe('tt0903747')
    const [gb] = expandShared({ items: [rec] }, 'GB')
    expect(gb.service).toBe('Rent or buy')
    const [ca] = expandShared({ items: [rec] }, 'CA')
    expect(ca.service).toBe('Not on streaming in CA')
    expect(ca.watchLink).toBeNull()
  })
})

describe('mergeCatalog', () => {
  const curated = { id: 'local-1', type: 'show', title: 'Breaking Bad', year: 2008, imdb: 9.5, rt: 96, service: 'Netflix', genres: ['Crime'] }
  const shared = { id: 'shared-x', source: 'shared', type: 'show', title: 'Breaking Bad', year: 2008, imdb: 8.9, ratingSource: 'TMDB', rt: null, service: 'Max', recs: ['a'] }

  it('keeps the real IMDb score and RT, takes fresh provider + graph', () => {
    const [m] = mergeCatalog([curated], [shared])
    expect(m.imdb).toBe(9.5)
    expect(m.rt).toBe(96)
    expect(m.service).toBe('Max')
    expect(m.recs).toEqual(['a'])
    expect(m.id).toBe('local-1')
  })

  it('builds the graph from recs', () => {
    expect(graphFrom(mergeCatalog([curated], [shared]))).toEqual({ 'show:breaking bad:2008': ['a'] })
  })
})

describe('build-catalog script', () => {
  const fakeFetch = async (url) => {
    const json = (b) => ({ ok: true, status: 200, json: async () => b })
    if (url.includes('/discover/movie') || url.includes('/movie/top_rated')) {
      return json({ results: [{ id: 27205, vote_average: 8.4, vote_count: 9000 }] })
    }
    if (url.includes('/discover/tv') || url.includes('/tv/top_rated')) {
      return json({ results: [{ id: 1396, vote_average: 8.9, vote_count: 12000 }] })
    }
    if (url.includes('/movie/27205?')) {
      return json({ id: 27205, title: 'Inception', release_date: '2010-07-15', vote_average: 8.4, genres: [{ id: 878 }], runtime: 148, imdb_id: 'tt1375666' })
    }
    if (url.includes('/tv/1396?')) return json(details)
    if (url.includes('omdbapi.com')) return json({ Response: 'True', imdbRating: '9.5', Ratings: [{ Source: 'Rotten Tomatoes', Value: '96%' }] })
    return { ok: false, status: 404, json: async () => ({}) }
  }

  it('builds a deduped snapshot with OMDb scores and known-only graph edges', async () => {
    const out = await buildCatalog({
      tmdbKey: 'K', omdbKey: 'O', fetchFn: fakeFetch,
      pages: { discoverMovie: 2, topMovie: 1, discoverTv: 1, topTv: 1 },
    })
    expect(out.count).toBe(2)
    const bb = out.items.find((x) => x.n === 'Breaking Bad')
    expect(bb.i).toBe(9.5)
    expect(bb.rt).toBe(96)
    // Better Call Saul is in the bundled catalog, so the edge is kept.
    expect(bb.rc).toEqual(['show:better call saul:2015'])
    expect(out.items.find((x) => x.n === 'Inception').r).toBe(148)
  })

  it('refuses to run without a key', async () => {
    await expect(buildCatalog({ tmdbKey: '' })).rejects.toThrow(/TMDB_API_KEY/)
  })

  it('reuses previous OMDb results instead of re-spending quota', async () => {
    let omdbCalls = 0
    const counting = async (url) => { if (url.includes('omdbapi')) omdbCalls++; return fakeFetch(url) }
    const prev = { items: [{ k: 'show:breaking bad:2008', i: 9.5, rt: 96, om: 1 }, { k: 'movie:inception:2010', i: 8.8, rt: 87, om: 1 }] }
    await buildCatalog({ tmdbKey: 'K', omdbKey: 'O', fetchFn: counting, prev, pages: { discoverMovie: 1, topMovie: 0, discoverTv: 1, topTv: 0 } })
    expect(omdbCalls).toBe(0)
  })
})
