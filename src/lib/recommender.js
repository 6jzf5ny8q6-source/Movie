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

const DAY = 24 * 60 * 60 * 1000

// Recent ratings count more: weight halves every ~6 months, never below 0.35.
// Ratings without a timestamp count fully.
export function recencyWeight(ratedAt, now = Date.now()) {
  if (!ratedAt) return 1
  const ageDays = Math.max(0, (now - ratedAt) / DAY)
  return Math.max(0.35, Math.pow(0.5, ageDays / 180))
}

function addSignal(genres, moods, item, signal) {
  for (const g of item.genres || []) genres[g] = (genres[g] || 0) + signal
  for (const m of item.moods || []) moods[m] = (moods[m] || 0) + signal * MOOD_WEIGHT
}

// Fold the user's own ratings into a base profile. Loved + "watch again"
// titles pull their genres/moods up; disliked titles push them down.
export function applyRatingsToProfile(base, ratings, now = Date.now()) {
  const genres = { ...base.genres }
  const moods = { ...base.moods }
  for (const r of Object.values(ratings || {})) {
    // rating 1-10 -> signal in roughly [-1, +1.5], faded for older ratings
    let signal = (r.rating - 6) / 4
    if (r.watchAgain) signal += 0.5
    signal *= recencyWeight(r.ratedAt, now)
    if (signal === 0) continue
    addSignal(genres, moods, r, signal)
  }
  return { genres, moods }
}

// Lighter signals from everyday actions: hiding a title ("not for me") nudges
// its genres down, saving to the watchlist or tapping 👍 nudges them up.
export const SIGNAL = { dismiss: -0.5, watchlist: 0.35, like: 0.7 }
export function applyActionSignals(taste, { removed = {}, watchlist = {}, feedback = {} } = {}) {
  const genres = { ...taste.genres }
  const moods = { ...taste.moods }
  for (const r of Object.values(removed)) addSignal(genres, moods, r, SIGNAL.dismiss)
  for (const w of Object.values(watchlist)) addSignal(genres, moods, w, SIGNAL.watchlist)
  for (const f of Object.values(feedback)) if (f.vote > 0) addSignal(genres, moods, f, SIGNAL.like)
  return { genres, moods }
}

// Combined taste vector from quiz + ratings + everyday actions.
export function buildTasteProfile(profile, ratings, signals) {
  const base = profile || { genres: {}, moods: {} }
  const rated = applyRatingsToProfile(base, ratings)
  return signals ? applyActionSignals(rated, signals) : rated
}

// ---- "Because you loved ___" -------------------------------------------

function jaccard(a = [], b = []) {
  if (!a.length || !b.length) return 0
  const sa = new Set(a)
  let inter = 0
  for (const x of b) if (sa.has(x)) inter++
  return inter / (sa.size + b.length - inter)
}

// How similar two titles are by their tags (0..1).
export function tagSimilarity(a, b) {
  return 0.65 * jaccard(a.genres, b.genres) + 0.35 * jaccard(a.moods, b.moods)
}

// The titles the user loves most become "seeds": 8+ ratings, watch-again
// titles, and anything they gave a 👍. Most-loved and most-recent first.
export function pickSeeds(ratings = {}, feedback = {}, max = 6) {
  const seeds = new Map()
  for (const r of Object.values(ratings)) {
    if (r.rating >= 8 || r.watchAgain) {
      const strength = r.rating + (r.watchAgain ? 1 : 0)
      seeds.set(r.key, { ...r, strength, at: r.ratedAt || 0 })
    }
  }
  for (const f of Object.values(feedback)) {
    if (f.vote > 0 && !seeds.has(f.key)) seeds.set(f.key, { ...f, strength: 8, at: f.at || 0 })
  }
  return [...seeds.values()]
    .sort((a, b) => b.strength - a.strength || b.at - a.at)
    .slice(0, max)
}

// Affinity between a candidate and one seed. Tag overlap, plus a strong bonus
// when real viewing data (the "people also watched" graph) links them.
export function seedAffinity(item, seed, graph = {}) {
  const linked = (graph[seed.key] || []).includes(titleKey(item))
  return tagSimilarity(item, seed) + (linked ? 0.8 : 0)
}

// ---- Variety ------------------------------------------------------------

// Re-rank the head of a list so neighbours don't all share the same genres
// (maximal-marginal-relevance style). Keeps the incoming order as relevance.
export function diversify(list, lambda = 0.3, head = 40) {
  if (lambda <= 0 || list.length < 3) return list
  const pool = list.slice(0, head)
  const rest = list.slice(head)
  const n = pool.length
  const rel = new Map(pool.map((x, i) => [x, 1 - i / n]))
  const picked = []
  while (pool.length) {
    let best = 0
    let bestVal = -Infinity
    const recent = picked.slice(-4)
    for (let i = 0; i < pool.length; i++) {
      const c = pool[i]
      const overlap = recent.length
        ? Math.max(...recent.map((p) => jaccard(c.item.genres, p.item.genres)))
        : 0
      const val = rel.get(c) - lambda * overlap
      if (val > bestVal) { bestVal = val; best = i }
    }
    picked.push(pool.splice(best, 1)[0])
  }
  return [...picked, ...rest]
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
    seeds = [],      // loved titles (see pickSeeds)
    graph = {},      // titleKey -> [titleKey] "people also watched"
    diversity = 0,   // 0..1 variety re-rank strength
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
    .map((item) => {
      let score = scoreItem(item, taste, ratingPrefs)
      // Seed boost: titles close to something the user loves rise, and we
      // remember which favourite they came from for the explanation.
      let because = null
      if (seeds.length) {
        let best = 0
        for (const s of seeds) {
          const a = seedAffinity(item, s, graph)
          if (a > best) { best = a; because = s.title }
        }
        score *= 1 + 0.6 * best
        if (best < 0.55) because = null
      }
      return { item: because ? { ...item, because } : item, score }
    })
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

  if (diversity > 0) scored = diversify(scored, diversity)

  const out = limit === Infinity ? scored : scored.slice(0, limit)
  return out.map(({ item, score }) => ({ ...item, score: Math.round(score * 100) / 100 }))
}

// A short, human explanation of why an item was recommended.
export function explain(item, taste) {
  if (item.because) return `Because you loved ${item.because}.`
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
