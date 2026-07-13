// Optional live catalog updates. When the user provides a free TMDB API key in
// Settings, CineMatch pulls a broad, taste-relevant pool of titles from across
// all years (not just new releases) and fetches the real streaming provider for
// each. An optional OMDb key enriches results with true IMDb + Rotten Tomatoes
// scores. Everything degrades gracefully to the bundled catalog when offline or
// unkeyed.

import { GENRES, MOODS } from '../data/catalog.js'

const TMDB = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p/w342'
const LOGO = 'https://image.tmdb.org/t/p/w45' // small provider logos

// TMDB genre ids -> our genre vocabulary (for normalizing results).
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'Historical',
  27: 'Horror', 10402: 'Musical', 9648: 'Mystery', 10749: 'Romance',
  878: 'Sci-Fi', 53: 'Thriller', 10752: 'War', 37: 'Historical',
  10759: 'Action', 10765: 'Sci-Fi', 10768: 'War', 10767: 'Comedy',
  10763: 'Documentary', 10764: 'Documentary', 10762: 'Family',
}

// Our genre names -> TMDB genre ids, so we can bias Discover toward the user's
// taste. Movie and TV use different id sets. Unmapped genres are simply omitted.
const MOVIE_GENRE_IDS = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, Historical: 36,
  Horror: 27, Musical: 10402, Mystery: 9648, Romance: 10749, 'Sci-Fi': 878,
  Thriller: 53, War: 10752,
}
const TV_GENRE_IDS = {
  Action: 10759, Adventure: 10759, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Fantasy: 10765, Mystery: 9648,
  'Sci-Fi': 10765, War: 10768,
}

// Common provider names -> tidy, familiar labels.
const PROVIDER_LABELS = {
  'Disney Plus': 'Disney+', 'Amazon Prime Video': 'Prime Video',
  'Amazon Video': 'Prime Video', 'HBO Max': 'Max', 'Apple TV Plus': 'Apple TV+',
  'Apple TV': 'Apple TV+', 'Paramount Plus': 'Paramount+',
  'Paramount+ with Showtime': 'Paramount+', 'Peacock Premium': 'Peacock',
  'Peacock Premium Plus': 'Peacock', 'Netflix Standard with Ads': 'Netflix',
}
const tidyProvider = (name) => PROVIDER_LABELS[name] || name

function inferMoods(genres, imdb) {
  const set = new Set()
  const has = (g) => genres.includes(g)
  if (has('Comedy')) { set.add('funny'); set.add('feel-good') }
  if (has('Family') || has('Animation')) { set.add('feel-good'); set.add('cozy') }
  if (has('Horror')) set.add('scary')
  if (has('Thriller') || has('Mystery')) set.add('suspenseful')
  if (has('Crime')) set.add('dark')
  if (has('Drama') || has('Romance')) set.add('emotional')
  if (has('Sci-Fi') || has('Fantasy')) set.add('epic')
  if (has('War') || has('Historical')) set.add('thought-provoking')
  if (has('Action') || has('Adventure')) set.add('intense')
  if (imdb >= 8.3) set.add('thought-provoking')
  return [...set].filter((m) => MOODS.includes(m))
}

function mapGenres(ids = []) {
  const out = []
  for (const id of ids) {
    const g = GENRE_MAP[id]
    if (g && GENRES.includes(g) && !out.includes(g)) out.push(g)
  }
  return out.length ? out : ['Drama']
}

const POSTER_COLORS = ['#3a4a63', '#5b7c99', '#7a6f5b', '#6a3b3b', '#4a7a5a', '#8a5a2a', '#3a3a5a']
function colorFor(title) {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0
  return POSTER_COLORS[h % POSTER_COLORS.length]
}

function normalize(raw, type) {
  const title = type === 'movie' ? raw.title : raw.name
  const dateStr = type === 'movie' ? raw.release_date : raw.first_air_date
  const year = dateStr ? Number(dateStr.slice(0, 4)) : undefined
  const genres = mapGenres(raw.genre_ids || [])
  const imdb = Math.round((raw.vote_average || 0) * 10) / 10
  return {
    id: `tmdb-${type}-${raw.id}`,
    source: 'tmdb',
    _tmdbId: raw.id,
    _tmdbType: type, // 'movie' | 'tv'
    type: type === 'movie' ? 'movie' : 'show',
    title,
    year,
    imdb, // TMDB community score; replaced by true IMDb if OMDb key present
    ratingSource: 'TMDB',
    genres,
    moods: inferMoods(genres, imdb),
    service: 'Streaming (checking…)',
    poster: colorFor(title || 'x'),
    image: raw.poster_path ? `${IMG}${raw.poster_path}` : null,
    overview: raw.overview || '',
  }
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

// Live-check a TMDB v3 API key against the API.
export async function validateTmdbKey(key) {
  if (!key) return { ok: false, message: 'No TMDB key entered.' }
  try {
    const res = await fetch(`${TMDB}/configuration?api_key=${encodeURIComponent(key)}`)
    if (res.ok) return { ok: true, message: 'TMDB key is working ✓' }
    if (res.status === 401) {
      return { ok: false, message: 'TMDB rejected this key (401). Make sure it’s the v3 “API Key”, not the v4 Read Access Token.' }
    }
    return { ok: false, message: `TMDB returned an error (${res.status}).` }
  } catch {
    return { ok: false, message: 'Couldn’t reach TMDB (network/CORS). Try again on your normal connection.' }
  }
}

// Live-check an OMDb key against the API.
export async function validateOmdbKey(key) {
  if (!key) return { ok: null, message: 'No OMDb key entered (optional).' }
  try {
    const data = await fetchJson(`https://www.omdbapi.com/?apikey=${encodeURIComponent(key)}&t=inception`)
    if (data.Response === 'True') return { ok: true, message: 'OMDb key is working ✓' }
    return { ok: false, message: data.Error || 'OMDb rejected this key.' }
  } catch {
    return { ok: false, message: 'Couldn’t reach OMDb (network). Try again on your normal connection.' }
  }
}

// Run an async worker over items with a bounded concurrency so we don't hammer
// the API (TMDB throttles heavy bursts).
async function mapPool(items, worker, concurrency = 12) {
  const queue = items.map((it, i) => [it, i])
  const run = async () => {
    while (queue.length) {
      const [item, i] = queue.shift()
      try { await worker(item, i) } catch { /* ignore per-item failure */ }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run))
}

function genreParam(names, idMap) {
  const ids = [...new Set((names || []).map((n) => idMap[n]).filter(Boolean))]
  return ids.length ? `&with_genres=${ids.join('|')}` : '' // '|' = any of these genres
}

// Pull a broad, taste-relevant pool of titles from across all years. `genres`
// are the user's preferred genre names (from their taste profile).
export async function fetchLiveCatalog(tmdbKey, opts = {}) {
  if (!tmdbKey) throw new Error('No TMDB API key set')
  const { genres = [] } = opts
  const k = `api_key=${tmdbKey}`
  const mg = genreParam(genres, MOVIE_GENRE_IDS)
  const tg = genreParam(genres, TV_GENRE_IDS)

  // Discover is sorted by popularity across ALL years (no date filter), then
  // the recommender re-ranks by how well each matches the user's taste.
  const endpoints = [
    [`${TMDB}/discover/movie?${k}&include_adult=false&sort_by=popularity.desc&vote_count.gte=300${mg}&page=1`, 'movie'],
    [`${TMDB}/discover/movie?${k}&include_adult=false&sort_by=popularity.desc&vote_count.gte=300${mg}&page=2`, 'movie'],
    [`${TMDB}/movie/top_rated?${k}&page=1`, 'movie'],
    [`${TMDB}/discover/tv?${k}&include_adult=false&sort_by=popularity.desc&vote_count.gte=150${tg}&page=1`, 'tv'],
    [`${TMDB}/discover/tv?${k}&include_adult=false&sort_by=popularity.desc&vote_count.gte=150${tg}&page=2`, 'tv'],
    [`${TMDB}/tv/top_rated?${k}&page=1`, 'tv'],
  ]

  const results = await Promise.allSettled(endpoints.map(([url]) => fetchJson(url)))

  const items = []
  const seen = new Set()
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return
    const type = endpoints[i][1]
    for (const raw of r.value.results || []) {
      const item = normalize(raw, type)
      if (!item.title || item.imdb <= 0) continue
      const key = `${item.type}:${item.title.toLowerCase()}:${item.year}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push(item)
    }
  })
  if (!items.length) throw new Error('No results returned from TMDB')
  return items
}

// Fetch the real streaming location for each title in the user's region from
// TMDB's watch/providers, and capture the deep link to the title's watch page.
// Region-specific: a title that isn't offered in the user's region is marked as
// such rather than pretending it's available elsewhere.
export async function enrichProviders(items, tmdbKey, region = 'US') {
  if (!tmdbKey) return items
  await mapPool(items, async (item) => {
    if (!item._tmdbId) return
    const url = `${TMDB}/${item._tmdbType}/${item._tmdbId}/watch/providers?api_key=${tmdbKey}`
    const data = await fetchJson(url)
    const rd = (data.results || {})[region]

    const toProvider = (p) => ({
      name: tidyProvider(p.provider_name),
      logo: p.logo_path ? `${LOGO}${p.logo_path}` : null,
    })

    item.watchRegion = region
    item.providers = []
    if (rd?.flatrate?.length) {
      // Subscription streaming — show up to two providers with their logos.
      const list = rd.flatrate.slice(0, 2).map(toProvider)
      item.providers = list
      item.service = [...new Set(list.map((p) => p.name))].join(' · ')
      item.watchLink = rd.link || null
    } else if (rd?.free?.length || rd?.ads?.length) {
      const p = toProvider((rd.free || rd.ads)[0])
      item.providers = [p]
      item.service = `${p.name} (free)`
      item.watchLink = rd.link || null
    } else if (rd?.rent?.length || rd?.buy?.length) {
      item.service = 'Rent or buy'
      item.watchLink = rd.link || null
    } else {
      item.service = `Not on streaming in ${region}`
      item.watchLink = null
    }
  })
  return items
}

// Optionally replace TMDB scores with true IMDb ratings and add Rotten
// Tomatoes scores via OMDb.
export async function enrichWithImdb(items, omdbKey, max = 48) {
  if (!omdbKey) return items
  const targets = items.slice(0, max)
  await mapPool(targets, async (item) => {
    const url = `https://www.omdbapi.com/?apikey=${omdbKey}&t=${encodeURIComponent(item.title)}${item.year ? `&y=${item.year}` : ''}`
    const data = await fetchJson(url)
    if (data.Response !== 'True') return
    const rating = Number(data.imdbRating)
    if (!Number.isNaN(rating) && rating > 0) {
      item.imdb = rating
      item.ratingSource = 'IMDb'
    }
    if (data.imdbID) item.imdbId = data.imdbID // verified -> exact IMDb link
    const rt = (data.Ratings || []).find((r) => r.Source === 'Rotten Tomatoes')
    if (rt) {
      const pct = Number(String(rt.Value).replace('%', ''))
      if (!Number.isNaN(pct)) item.rt = pct
    }
    if (data.Poster && data.Poster !== 'N/A') item.image = data.Poster
  })
  return items
}
