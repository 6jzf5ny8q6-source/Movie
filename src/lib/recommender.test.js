import { describe, it, expect } from 'vitest'
import {
  buildProfileFromQuiz,
  applyRatingsToProfile,
  buildTasteProfile,
  scoreItem,
  recommend,
  explain,
  recencyWeight,
  applyActionSignals,
  pickSeeds,
  seedAffinity,
  diversify,
} from './recommender.js'

const answers = {
  q1: { genres: ['Sci-Fi', 'Adventure'], moods: ['epic'] },
  q2: { genres: ['Sci-Fi'], moods: ['epic'], weight: 1.4 },
}

const catalog = [
  { id: 'a', type: 'movie', title: 'Space Epic', year: 2020, imdb: 8.5, rt: 92, runtime: 160, genres: ['Sci-Fi', 'Adventure'], moods: ['epic'], service: 'Netflix' },
  { id: 'b', type: 'movie', title: 'Rom Com', year: 2019, imdb: 6.9, rt: 55, runtime: 95, genres: ['Romance', 'Comedy'], moods: ['funny', 'romantic'], service: 'Hulu' },
  { id: 'c', type: 'show', title: 'Sci Show', year: 2021, imdb: 8.1, rt: 80, genres: ['Sci-Fi'], moods: ['epic'], service: 'Max' },
]

describe('buildProfileFromQuiz', () => {
  it('sums genre and mood weights, honoring per-option weight', () => {
    const p = buildProfileFromQuiz(answers)
    expect(p.genres['Sci-Fi']).toBeCloseTo(2.4) // 1 + 1.4
    expect(p.genres['Adventure']).toBe(1)
    expect(p.moods['epic']).toBeCloseTo(2.4)
  })

  it('handles empty input', () => {
    const p = buildProfileFromQuiz(null)
    expect(p).toEqual({ genres: {}, moods: {} })
  })
})

describe('applyRatingsToProfile', () => {
  it('loved + watch-again titles increase affinity', () => {
    const base = { genres: {}, moods: {} }
    const ratings = { k: { rating: 10, watchAgain: true, genres: ['Horror'], moods: ['scary'] } }
    const p = applyRatingsToProfile(base, ratings)
    expect(p.genres['Horror']).toBeGreaterThan(0)
  })

  it('disliked titles decrease affinity', () => {
    const base = { genres: { Horror: 1 }, moods: {} }
    const ratings = { k: { rating: 2, watchAgain: false, genres: ['Horror'], moods: [] } }
    const p = applyRatingsToProfile(base, ratings)
    expect(p.genres['Horror']).toBeLessThan(1)
  })
})

describe('scoreItem + recommend', () => {
  const taste = buildTasteProfile(buildProfileFromQuiz(answers), {})

  it('ranks on-taste titles above off-taste ones', () => {
    const recs = recommend(catalog, taste, { minImdb: 0 })
    expect(recs[0].title).toBe('Space Epic')
    expect(recs[recs.length - 1].title).toBe('Rom Com')
  })

  it('respects the minimum IMDb filter', () => {
    const recs = recommend(catalog, taste, { minImdb: 8.0 })
    expect(recs.find((r) => r.title === 'Rom Com')).toBeUndefined()
    expect(recs.length).toBe(2)
  })

  it('respects the minimum Rotten Tomatoes filter', () => {
    const recs = recommend(catalog, taste, { useImdb: false, useRt: true, minRt: 70 })
    expect(recs.find((r) => r.title === 'Rom Com')).toBeUndefined() // rt 55
    expect(recs.length).toBe(2)
  })

  it('ignores the IMDb filter when IMDb is disabled', () => {
    const recs = recommend(catalog, taste, { useImdb: false, minImdb: 9.9, useRt: false })
    expect(recs.length).toBe(3) // nothing excluded by a disabled system
  })

  it('does not exclude titles missing a score for an active filter', () => {
    const noRt = [{ id: 'd', type: 'movie', title: 'No RT', imdb: 8, genres: ['Sci-Fi'], moods: ['epic'], service: 'Max' }]
    const recs = recommend(noRt, taste, { useRt: true, minRt: 90 })
    expect(recs.length).toBe(1)
  })

  it('filters by type', () => {
    const recs = recommend(catalog, taste, { minImdb: 0, type: 'show' })
    expect(recs.every((r) => r.type === 'show')).toBe(true)
  })

  it('excludes already-rated titles', () => {
    const ratings = { 'movie:space epic:2020': { rating: 9, genres: ['Sci-Fi'], moods: ['epic'] } }
    const recs = recommend(catalog, taste, { minImdb: 0, ratings })
    expect(recs.find((r) => r.title === 'Space Epic')).toBeUndefined()
  })

  it('excludes dismissed (removed) titles', () => {
    const removed = { 'movie:space epic:2020': { key: 'movie:space epic:2020', title: 'Space Epic' } }
    const recs = recommend(catalog, taste, { minImdb: 0, removed })
    expect(recs.find((r) => r.title === 'Space Epic')).toBeUndefined()
    expect(recs.length).toBe(2)
  })

  it('excludes watchlisted titles', () => {
    const watchlist = { 'movie:space epic:2020': { key: 'movie:space epic:2020', title: 'Space Epic' } }
    const recs = recommend(catalog, taste, { minImdb: 0, watchlist })
    expect(recs.find((r) => r.title === 'Space Epic')).toBeUndefined()
    expect(recs.length).toBe(2)
  })

  it('honors the limit', () => {
    const recs = recommend(catalog, taste, { minImdb: 0, limit: 1 })
    expect(recs.length).toBe(1)
  })

  it('filters by mood', () => {
    const recs = recommend(catalog, taste, { minImdb: 0, moods: ['funny'] })
    expect(recs.map((r) => r.title)).toEqual(['Rom Com'])
  })

  it('explore keeps the same titles but is deterministic per seed', () => {
    const base = recommend(catalog, taste, { minImdb: 0 })
    const a1 = recommend(catalog, taste, { minImdb: 0, explore: 0.5, seed: 42 })
    const a2 = recommend(catalog, taste, { minImdb: 0, explore: 0.5, seed: 42 })
    expect(a1.map((r) => r.id)).toEqual(a2.map((r) => r.id)) // same seed -> same order
    expect(new Set(a1.map((r) => r.id))).toEqual(new Set(base.map((r) => r.id))) // same set
  })

  it('explore=0 leaves the ranking untouched', () => {
    const base = recommend(catalog, taste, { minImdb: 0 })
    const same = recommend(catalog, taste, { minImdb: 0, explore: 0, seed: 7 })
    expect(same.map((r) => r.id)).toEqual(base.map((r) => r.id))
  })

  it('filters movies by runtime bucket, leaving shows unaffected', () => {
    const recs = recommend(catalog, taste, { minImdb: 0, runtime: 'long' })
    const titles = recs.map((r) => r.title)
    expect(titles).toContain('Space Epic') // 160 min = long
    expect(titles).toContain('Sci Show')   // show: no runtime, passes
    expect(titles).not.toContain('Rom Com') // 95 min = medium
  })

  it('scores a matching item positively', () => {
    expect(scoreItem(catalog[0], taste)).toBeGreaterThan(0)
  })
})

describe('learning from actions', () => {
  const flat = { genres: { Horror: 1, Comedy: 1 }, moods: {} }

  it('dismissing a title lowers its genres', () => {
    const t = applyActionSignals(flat, { removed: { k: { genres: ['Horror'], moods: [] } } })
    expect(t.genres.Horror).toBeLessThan(flat.genres.Horror)
    expect(t.genres.Comedy).toBe(1)
  })

  it('watchlisting and 👍 raise genres', () => {
    const t = applyActionSignals(flat, {
      watchlist: { a: { genres: ['Comedy'], moods: [] } },
      feedback: { b: { vote: 1, genres: ['Comedy'], moods: [] } },
    })
    expect(t.genres.Comedy).toBeGreaterThan(1.9)
  })
})

describe('recency', () => {
  const now = Date.UTC(2026, 10, 1)
  it('fresh ratings count fully, year-old ones less, never below 0.35', () => {
    expect(recencyWeight(now, now)).toBeCloseTo(1)
    expect(recencyWeight(now - 365 * 864e5, now)).toBeLessThan(0.5)
    expect(recencyWeight(now - 5000 * 864e5, now)).toBe(0.35)
    expect(recencyWeight(undefined, now)).toBe(1)
  })
  it('an old rave moves taste less than a new one', () => {
    const base = { genres: {}, moods: {} }
    const fresh = applyRatingsToProfile(base, { a: { rating: 10, genres: ['War'], ratedAt: now } }, now)
    const old = applyRatingsToProfile(base, { a: { rating: 10, genres: ['War'], ratedAt: now - 400 * 864e5 } }, now)
    expect(fresh.genres.War).toBeGreaterThan(old.genres.War)
  })
})

describe('because you loved', () => {
  const ratings = {
    'show:breaking bad:2008': { key: 'show:breaking bad:2008', title: 'Breaking Bad', rating: 10, genres: ['Crime', 'Drama'], moods: ['dark'] },
    'movie:meh:2000': { key: 'movie:meh:2000', title: 'Meh', rating: 5, genres: ['Comedy'], moods: [] },
  }
  const pool = [
    { id: 'x', type: 'show', title: 'Crime Show', year: 2015, imdb: 8, genres: ['Crime', 'Drama'], moods: ['dark'] },
    { id: 'y', type: 'movie', title: 'Kids Film', year: 2010, imdb: 8, genres: ['Family'], moods: ['cozy'] },
    { id: 'z', type: 'movie', title: 'Linked Gem', year: 2012, imdb: 8, genres: ['Romance'], moods: ['romantic'] },
  ]

  it('picks only loved titles as seeds', () => {
    const seeds = pickSeeds(ratings, { 'movie:liked:2001': { key: 'movie:liked:2001', title: 'Liked', vote: 1, genres: [] } })
    expect(seeds.map((s) => s.title)).toEqual(['Breaking Bad', 'Liked'])
  })

  it('labels close matches with the seed they came from', () => {
    const seeds = pickSeeds(ratings, {})
    const recs = recommend(pool, { genres: {}, moods: {} }, { seeds })
    const crime = recs.find((r) => r.title === 'Crime Show')
    expect(crime.because).toBe('Breaking Bad')
    expect(explain(crime, { genres: {}, moods: {} })).toBe('Because you loved Breaking Bad.')
    expect(recs.find((r) => r.title === 'Kids Film').because).toBeUndefined()
  })

  it('the "people also watched" graph links titles with no shared tags', () => {
    const seed = pickSeeds(ratings, {})[0]
    const graph = { [seed.key]: ['movie:linked gem:2012'] }
    expect(seedAffinity(pool[2], seed, graph)).toBeGreaterThan(seedAffinity(pool[2], seed, {}))
    const recs = recommend(pool, { genres: {}, moods: {} }, { seeds: [seed], graph })
    expect(recs.find((r) => r.title === 'Linked Gem').because).toBe('Breaking Bad')
  })
})

describe('diversify', () => {
  it('breaks up runs of the same genre', () => {
    const mk = (id, g) => ({ item: { id, genres: [g] }, score: 1 })
    const list = [mk(1, 'Crime'), mk(2, 'Crime'), mk(3, 'Crime'), mk(4, 'Comedy'), mk(5, 'Sci-Fi')]
    const out = diversify(list, 0.6).map((s) => s.item.genres[0])
    expect(out[0]).toBe('Crime')          // best match still first
    expect(out[1]).not.toBe('Crime')      // but not three crime picks in a row
    expect(out).toHaveLength(5)
  })
  it('is a no-op at zero strength', () => {
    const list = [1, 2, 3].map((id) => ({ item: { id, genres: ['A'] }, score: 1 }))
    expect(diversify(list, 0)).toEqual(list)
  })
})
