// The shared library: a daily snapshot of ~1,200 titles built by a GitHub
// Action with the site owner's TMDB key (kept secret), published as a static
// JSON file every visitor loads. Visitors never need their own API key.
//
// The file is compact; `expandShared` turns it into normal catalog items for
// the visitor's region (streaming provider, logos, watch link).

import { titleKey } from './storage.js'
import { IMG, LOGO, colorFor, inferMoods, mapGenres, tidyProvider } from './tmdb.js'

export const SHARED_URL =
  'https://raw.githubusercontent.com/6jzf5ny8q6-source/Movie/data/catalog.json'

const watchPage = (type, tmdbId, region) =>
  `https://www.themoviedb.org/${type === 'movie' ? 'movie' : 'tv'}/${tmdbId}/watch?locale=${region}`

// ---- build side (used by scripts/build-catalog.mjs) ----------------------

// One TMDB details response (with append_to_response=watch/providers,
// recommendations,external_ids) -> one compact record.
export function compactFromDetails(d, tmdbType, regions) {
  const type = tmdbType === 'movie' ? 'movie' : 'show'
  const title = tmdbType === 'movie' ? d.title : d.name
  const date = tmdbType === 'movie' ? d.release_date : d.first_air_date
  const year = date ? Number(date.slice(0, 4)) : undefined
  const vote = Math.round((d.vote_average || 0) * 10) / 10
  const genres = mapGenres((d.genres || []).map((g) => g.id))
  const runtime = tmdbType === 'movie' ? d.runtime || null : d.episode_run_time?.[0] || null
  const imdbId = tmdbType === 'movie' ? d.imdb_id : d.external_ids?.imdb_id

  const w = {}
  const results = d['watch/providers']?.results || {}
  for (const r of regions) {
    const rd = results[r]
    if (!rd) continue
    if (rd.flatrate?.length) {
      w[r] = rd.flatrate.slice(0, 2).map((p) => [tidyProvider(p.provider_name), p.logo_path || ''])
    } else if (rd.free?.length || rd.ads?.length) {
      const p = (rd.free || rd.ads)[0]
      w[r] = [[`${tidyProvider(p.provider_name)} (free)`, p.logo_path || '']]
    } else if (rd.rent?.length || rd.buy?.length) {
      w[r] = 'r'
    }
  }

  const rc = (d.recommendations?.results || [])
    .map((x) => {
      const isMovie = (x.media_type || tmdbType) === 'movie'
      const t = isMovie ? x.title : x.name
      const dt = isMovie ? x.release_date : x.first_air_date
      return t ? titleKey({ type: isMovie ? 'movie' : 'show', title: t, year: dt ? Number(dt.slice(0, 4)) : '' }) : null
    })
    .filter(Boolean)
    .slice(0, 15)

  const rec = {
    k: titleKey({ type, title, year }),
    t: type,
    n: title,
    y: year,
    v: vote,
    tm: d.id,
    g: genres,
    m: inferMoods(genres, vote),
    o: (d.overview || '').slice(0, 260),
  }
  if (runtime) rec.r = runtime
  if (d.poster_path) rec.p = d.poster_path
  if (imdbId) rec.id = imdbId
  if (Object.keys(w).length) rec.w = w
  if (rc.length) rec.rc = rc
  return rec
}

// ---- app side ------------------------------------------------------------

export function expandShared(json, region = 'US') {
  if (!json?.items?.length) return []
  return json.items.map((x) => {
    const wr = x.w?.[region]
    let service
    let providers = []
    let watchLink = null
    if (Array.isArray(wr)) {
      providers = wr.map(([name, logo]) => ({ name, logo: logo ? `${LOGO}${logo}` : null }))
      service = [...new Set(providers.map((p) => p.name))].join(' · ')
      watchLink = watchPage(x.t, x.tm, region)
    } else if (wr === 'r') {
      service = 'Rent or buy'
      watchLink = watchPage(x.t, x.tm, region)
    } else {
      service = `Not on streaming in ${region}`
    }
    return {
      id: `shared-${x.t}-${x.tm}`,
      source: 'shared',
      _tmdbId: x.tm,
      _tmdbType: x.t === 'movie' ? 'movie' : 'tv',
      type: x.t,
      title: x.n,
      year: x.y,
      imdb: x.i ?? x.v,
      ratingSource: x.i != null ? 'IMDb' : 'TMDB',
      rt: x.rt ?? null,
      imdbId: x.id,
      genres: x.g || [],
      moods: x.m || [],
      runtime: x.r ?? null,
      overview: x.o || '',
      image: x.p ? `${IMG}${x.p}` : null,
      poster: colorFor(x.n || 'x'),
      service,
      providers,
      watchLink,
      watchRegion: region,
      recs: x.rc || [],
    }
  })
}

// Merge catalog lists that may describe the same title. Later lists add or
// refresh fields (region-accurate providers, live data) without losing better
// data from earlier ones: a real IMDb score is never replaced by a TMDB vote,
// and a known Rotten Tomatoes score is never blanked.
export function mergeCatalog(...lists) {
  const map = new Map()
  for (const list of lists) {
    for (const item of list || []) {
      const key = titleKey(item)
      const prev = map.get(key)
      if (!prev) { map.set(key, item); continue }
      const next = { ...prev }
      for (const [k, v] of Object.entries(item)) {
        if (v == null || v === '' || (Array.isArray(v) && !v.length)) continue
        if (k === 'id' || k === 'source') continue
        next[k] = v
      }
      if (item.ratingSource === 'TMDB' && prev.ratingSource !== 'TMDB' && prev.imdb) {
        next.imdb = prev.imdb
        next.ratingSource = prev.ratingSource
      }
      map.set(key, next)
    }
  }
  return [...map.values()]
}

// "People also watched" graph from every item that carries recommendations.
export function graphFrom(items, extra = {}) {
  const graph = { ...extra }
  for (const it of items) {
    if (!it.recs?.length) continue
    const k = titleKey(it)
    graph[k] = [...new Set([...(graph[k] || []), ...it.recs])]
  }
  return graph
}
