// The recommendation engine. It builds a taste vector from the quiz and the
// user's own ratings, then scores candidate titles against it. Pure functions
// so the scoring logic is unit-testable.

import { titleKey } from './storage.js'

const MOOD_WEIGHT = 0.6 // moods count a bit less than hard genre matches

// Build a preference vector { genres:{}, moods:{} } from quiz answers.
// `answers` is a map of questionId -> selected option object.
export function buildProfileFromQuiz(answers) {
  const genres = {}
  const moods = {}
  for (const opt of Object.values(answers || {})) {
    if (!opt) continue
    const w = opt.weight || 1
    for (const g of opt.genres || []) genres[g] = (genres[g] || 0) + w
    for (const m of opt.moods || []) moods[m] = (moods[m] || 0) + w
  }
  return { genres, moods }
}

// Fold the user's own ratings into a base profile. Loved + "watch again"
// titles pull their genres/moods up; disliked titles push them down.
export function applyRatingsToProfile(base, ratings) {
  const genres = { ...base.genres }
  const moods = { ...base.moods }
  for (const r of Object.values(ratings || {})) {
    // rating 1-10 -> signal in roughly [-1, +1.5]
    let signal = (r.rating - 6) / 4
    if (r.watchAgain) signal += 0.5
    if (signal === 0) continue
    for (const g of r.genres || []) genres[g] = (genres[g] || 0) + signal
    for (const m of r.moods || []) moods[m] = (moods[m] || 0) + signal * MOOD_WEIGHT
  }
  return { genres, moods }
}

// Combined taste vector from quiz + ratings.
export function buildTasteProfile(profile, ratings) {
  const base = profile || { genres: {}, moods: {} }
  return applyRatingsToProfile(base, ratings)
}

// Score a single item against a taste vector. Higher = better match.
export function scoreItem(item, taste) {
  let genreScore = 0
  for (const g of item.genres || []) genreScore += taste.genres[g] || 0

  let moodScore = 0
  for (const m of item.moods || []) moodScore += (taste.moods[m] || 0) * MOOD_WEIGHT

  // Matching tags add up (so a title that hits more of your preferences ranks
  // higher). A gentle exponent keeps titles with many *irrelevant* tags from
  // running away with the score.
  const tagCount = (item.genres?.length || 1) + (item.moods?.length || 0) * 0.5
  const affinity = (genreScore + moodScore) / Math.pow(tagCount, 0.25)

  // Quality nudge: taste dominates, IMDb gently breaks ties.
  const quality = 0.7 + 0.3 * ((item.imdb || 0) / 10)

  return affinity * quality
}

// Produce ranked recommendations.
//   opts: { ratings, minImdb, type ('movie'|'show'|'all'), services, limit }
export function recommend(catalog, taste, opts = {}) {
  const {
    ratings = {},
    minImdb = 0,
    type = 'all',
    services = [],
    limit = Infinity,
  } = opts

  const seen = new Set(Object.keys(ratings))
  const serviceSet = new Set(services)

  const scored = catalog
    .filter((item) => type === 'all' || item.type === type)
    .filter((item) => (item.imdb || 0) >= minImdb)
    .filter((item) => serviceSet.size === 0 || serviceSet.has(item.service))
    .filter((item) => !seen.has(titleKey(item)))
    .map((item) => ({ item, score: scoreItem(item, taste) }))
    .sort((a, b) => b.score - a.score || (b.item.imdb || 0) - (a.item.imdb || 0))

  const out = limit === Infinity ? scored : scored.slice(0, limit)
  return out.map(({ item, score }) => ({ ...item, score: Math.round(score * 100) / 100 }))
}

// A short, human explanation of why an item was recommended.
export function explain(item, taste) {
  const genreHits = (item.genres || [])
    .map((g) => [g, taste.genres[g] || 0])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g)
    .slice(0, 2)
  const moodHits = (item.moods || [])
    .map((m) => [m, taste.moods[m] || 0])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([m]) => m)
    .slice(0, 2)

  const parts = []
  if (genreHits.length) parts.push(genreHits.join(' & '))
  if (moodHits.length) parts.push(moodHits.join(', '))
  if (!parts.length) return 'A well-loved pick to broaden your taste.'
  return `Matches your love of ${parts.join(' — ')}.`
}
