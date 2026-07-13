// The recommendation engine. It builds a taste vector from the quiz and the
// user's own ratings, then scores candidate titles against it. Pure functions
// so the scoring logic is unit-testable.

import { titleKey } from './storage.js'

const MOOD_WEIGHT = 0.6 // moods count a bit less than hard genre matches

// Runtime buckets for the movie length filter.
export function runtimeBucket(minutes) {
  if (minutes == null) return null
  if (minutes < 90) return 'short'
  if (minutes <= 130) return 'medium'
  return 'long'
}

// Small deterministic PRNG so "explore" reshuffles are stable per seed.
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

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
// `ratingPrefs` controls which rating systems inform the quality tie-breaker.
export function scoreItem(item, taste, ratingPrefs = { useImdb: true, useRt: true }) {
  const { useImdb = true, useRt = true } = ratingPrefs
  let genreScore = 0
  for (const g of item.genres || []) genreScore += taste.genres[g] || 0

  let moodScore = 0
  for (const m of item.moods || []) moodScore += (taste.moods[m] || 0) * MOOD_WEIGHT

  // Matching tags add up (so a title that hits more of your preferences ranks
  // higher). A gentle exponent keeps titles with many *irrelevant* tags from
  // running away with the score.
  const tagCount = (item.genres?.length || 1) + (item.moods?.length || 0) * 0.5
  const affinity = (genreScore + moodScore) / Math.pow(tagCount, 0.25)

  // Quality nudge: taste dominates, ratings gently break ties. Average the
  // normalized scores of whichever enabled systems have a value for the title.
  const parts = []
  if (useImdb && item.imdb) parts.push(item.imdb / 10)
  if (useRt && item.rt) parts.push(item.rt / 100)
  const q = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0.65
  const quality = 0.7 + 0.3 * q

  return affinity * quality
}

// Produce ranked recommendations.
//   opts: { ratings, useImdb, minImdb, useRt, minRt, type, services, limit }
// A rating filter only applies when its system is enabled AND the title has a
// value for it — titles missing a score are never excluded by that filter.
export function recommend(catalog, taste, opts = {}) {
  const {
    ratings = {},
    removed = {},
    watchlist = {},
    useImdb = true,
    minImdb = 0,
    useRt = true,
    minRt = 0,
    type = 'all',
    services = [],
    moods = [],
    runtime = 'any',
    limit = Infinity,
  } = opts

  // Exclude titles the user has already rated, saved to their watchlist, or
  // explicitly dismissed — none of those belong in "new" recommendations.
  const seen = new Set([
    ...Object.keys(ratings),
    ...Object.keys(removed),
    ...Object.keys(watchlist),
  ])
  const serviceSet = new Set(services)
  const moodSet = new Set(moods)
  const ratingPrefs = { useImdb, useRt }

  const passesImdb = (item) => !useImdb || item.imdb == null || item.imdb >= minImdb
  const passesRt = (item) => !useRt || item.rt == null || item.rt >= minRt
  const passesMood = (item) => moodSet.size === 0 || (item.moods || []).some((m) => moodSet.has(m))
  // Runtime only constrains movies that have a known runtime; everything else passes.
  const passesRuntime = (item) =>
    runtime === 'any' || item.type !== 'movie' || item.runtime == null || runtimeBucket(item.runtime) === runtime

  let scored = catalog
    .filter((item) => type === 'all' || item.type === type)
    .filter(passesImdb)
    .filter(passesRt)
    .filter(passesMood)
    .filter(passesRuntime)
    .filter((item) => serviceSet.size === 0 || serviceSet.has(item.service))
    .filter((item) => !seen.has(titleKey(item)))
    .map((item) => ({ item, score: scoreItem(item, taste, ratingPrefs) }))
    .sort((a, b) => b.score - a.score || (b.item.imdb || 0) - (a.item.imdb || 0))

  // Explore: gently jostle the ranking (seeded, so it's stable within a visit
  // but different between visits). Items drift up to explore*10 positions, so
  // strong matches stay near the top while the mix stays fresh.
  const { explore = 0, seed = 1 } = opts
  if (explore > 0 && scored.length > 1) {
    const rng = mulberry32(seed)
    scored = scored
      .map((s, i) => ({ ...s, _k: i + rng() * explore * 10 }))
      .sort((a, b) => a._k - b._k)
  }

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
