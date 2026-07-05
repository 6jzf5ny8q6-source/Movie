import { describe, it, expect } from 'vitest'
import {
  buildProfileFromQuiz,
  applyRatingsToProfile,
  buildTasteProfile,
  scoreItem,
  recommend,
} from './recommender.js'

const answers = {
  q1: { genres: ['Sci-Fi', 'Adventure'], moods: ['epic'] },
  q2: { genres: ['Sci-Fi'], moods: ['epic'], weight: 1.4 },
}

const catalog = [
  { id: 'a', type: 'movie', title: 'Space Epic', year: 2020, imdb: 8.5, genres: ['Sci-Fi', 'Adventure'], moods: ['epic'], service: 'Netflix' },
  { id: 'b', type: 'movie', title: 'Rom Com', year: 2019, imdb: 6.9, genres: ['Romance', 'Comedy'], moods: ['funny', 'romantic'], service: 'Hulu' },
  { id: 'c', type: 'show', title: 'Sci Show', year: 2021, imdb: 8.1, genres: ['Sci-Fi'], moods: ['epic'], service: 'Max' },
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

  it('filters by type', () => {
    const recs = recommend(catalog, taste, { minImdb: 0, type: 'show' })
    expect(recs.every((r) => r.type === 'show')).toBe(true)
  })

  it('excludes already-rated titles', () => {
    const ratings = { 'movie:space epic:2020': { rating: 9, genres: ['Sci-Fi'], moods: ['epic'] } }
    const recs = recommend(catalog, taste, { minImdb: 0, ratings })
    expect(recs.find((r) => r.title === 'Space Epic')).toBeUndefined()
  })

  it('honors the limit', () => {
    const recs = recommend(catalog, taste, { minImdb: 0, limit: 1 })
    expect(recs.length).toBe(1)
  })

  it('scores a matching item positively', () => {
    expect(scoreItem(catalog[0], taste)).toBeGreaterThan(0)
  })
})
