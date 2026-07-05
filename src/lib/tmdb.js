// Optional live catalog updates. When the user provides a free TMDB API key in
// Settings, CineMatch fetches trending / now-playing / on-the-air titles so the
// library stays current. An optional OMDb key enriches results with true IMDb
// ratings. Everything degrades gracefully to the bundled catalog when offline
// or unkeyed.

import { GENRES, MOODS } from '../data/catalog.js'

const TMDB = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p/w342'

// TMDB genre ids -> our genre vocabulary.
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'Historical',
  27: 'Horror', 10402: 'Musical', 9648: 'Mystery', 10749: 'Romance',
  878: 'Sci-Fi', 53: 'Thriller', 10752: 'War', 37: 'Historical',
  10759: 'Action', 10765: 'Sci-Fi', 10768: 'War', 10767: 'Comedy',
  10763: 'Documentary', 10764: 'Documentary', 10762: 'Family',
}

// Infer a couple of mood tags from genres + rating so live titles still slot
// into the recommender's mood dimension.
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
    type: type === 'movie' ? 'movie' : 'show',
    title,
    year,
    imdb, // TMDB community score; replaced by true IMDb if OMDb key present
    ratingSource: 'TMDB',
    genres,
    moods: inferMoods(genres, imdb),
    service: 'Streaming',
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

// Pull a fresh batch of current movies and shows from TMDB.
export async function fetchLiveCatalog(tmdbKey) {
  if (!tmdbKey) throw new Error('No TMDB API key set')
  const endpoints = [
    [`${TMDB}/trending/movie/week?api_key=${tmdbKey}`, 'movie'],
    [`${TMDB}/movie/now_playing?api_key=${tmdbKey}&page=1`, 'movie'],
    [`${TMDB}/trending/tv/week?api_key=${tmdbKey}`, 'tv'],
    [`${TMDB}/tv/on_the_air?api_key=${tmdbKey}&page=1`, 'tv'],
  ]
  const results = await Promise.allSettled(
    endpoints.map(([url]) => fetchJson(url)),
  )

  const items = []
  const seen = new Set()
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return
    const type = endpoints[i][1]
    for (const raw of r.value.results || []) {
      const item = normalize(raw, type)
      if (!item.title || item.imdb <= 0) continue
      const key = `${item.type}:${item.title}:${item.year}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push(item)
    }
  })
  if (!items.length) throw new Error('No results returned from TMDB')
  return items
}

// Optionally replace TMDB scores with true IMDb ratings and add Rotten
// Tomatoes scores via OMDb.
export async function enrichWithImdb(items, omdbKey, max = 20) {
  if (!omdbKey) return items
  const targets = items.slice(0, max)
  await Promise.allSettled(
    targets.map(async (item) => {
      try {
        const url = `https://www.omdbapi.com/?apikey=${omdbKey}&t=${encodeURIComponent(item.title)}${item.year ? `&y=${item.year}` : ''}`
        const data = await fetchJson(url)
        if (data.Response !== 'True') return
        const rating = Number(data.imdbRating)
        if (!Number.isNaN(rating) && rating > 0) {
          item.imdb = rating
          item.ratingSource = 'IMDb'
        }
        // Rotten Tomatoes arrives in the Ratings array, e.g. "94%".
        const rt = (data.Ratings || []).find((r) => r.Source === 'Rotten Tomatoes')
        if (rt) {
          const pct = Number(String(rt.Value).replace('%', ''))
          if (!Number.isNaN(pct)) item.rt = pct
        }
        if (data.Poster && data.Poster !== 'N/A') item.image = data.Poster
      } catch {
        /* leave the TMDB score in place */
      }
    }),
  )
  return items
}
