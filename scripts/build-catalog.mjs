#!/usr/bin/env node
// Builds the shared CineMatch library (catalog.json) from TMDB so every
// visitor gets live data without their own API key. Run by
// .github/workflows/catalog.yml with the owner's keys as GitHub secrets.
//
//   TMDB_API_KEY=... [OMDB_API_KEY=...] node scripts/build-catalog.mjs \
//     --out catalog.json [--prev previous.json]

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { CATALOG } from '../src/data/catalog.js'
import { REGIONS } from '../src/lib/region.js'
import { titleKey } from '../src/lib/storage.js'
import { compactFromDetails } from '../src/lib/shared.js'

const TMDB = 'https://api.themoviedb.org/3'

// Listing pages to scan. Popular-by-genre-agnostic discover + top rated,
// across ALL years, for both movies and TV.
export const DEFAULT_PAGES = { discoverMovie: 20, topMovie: 20, discoverTv: 12, topTv: 12 }

async function getJson(fetchFn, url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetchFn(url)
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 1000 * (i + 1))); continue }
    if (!res.ok) throw new Error(`${res.status} for ${url.replace(/api_key=[^&]+/, 'api_key=***')}`)
    return res.json()
  }
  throw new Error('Rate limited by TMDB')
}

async function pool(items, worker, n = 8) {
  const q = [...items]
  const out = []
  await Promise.all(Array.from({ length: Math.min(n, q.length) }, async () => {
    while (q.length) {
      const it = q.shift()
      try { out.push(await worker(it)) } catch (e) { console.warn('skip:', e.message) }
    }
  }))
  return out
}

export async function buildCatalog({ tmdbKey, omdbKey, fetchFn = fetch, pages = DEFAULT_PAGES, prev = null, omdbLimit = 900 }) {
  if (!tmdbKey) throw new Error('TMDB_API_KEY is not set (add it as a GitHub Actions secret).')
  const k = `api_key=${tmdbKey}`
  const regions = REGIONS.map((r) => r.code)

  // 1) Collect candidate ids from listing endpoints.
  const listUrls = []
  const add = (n, make, type) => { for (let p = 1; p <= n; p++) listUrls.push([make(p), type]) }
  add(pages.discoverMovie, (p) => `${TMDB}/discover/movie?${k}&include_adult=false&sort_by=popularity.desc&vote_count.gte=300&page=${p}`, 'movie')
  add(pages.topMovie, (p) => `${TMDB}/movie/top_rated?${k}&page=${p}`, 'movie')
  add(pages.discoverTv, (p) => `${TMDB}/discover/tv?${k}&include_adult=false&sort_by=popularity.desc&vote_count.gte=150&page=${p}`, 'tv')
  add(pages.topTv, (p) => `${TMDB}/tv/top_rated?${k}&page=${p}`, 'tv')

  const seen = new Map() // `${type}:${id}` -> [type, id, voteCount]
  const lists = await pool(listUrls, async ([url, type]) => ({ type, data: await getJson(fetchFn, url) }))
  for (const { type, data } of lists) {
    for (const r of data.results || []) {
      if (!r.vote_average) continue
      seen.set(`${type}:${r.id}`, [type, r.id, r.vote_count || 0])
    }
  }

  // 2) One details call per title gets providers (all regions),
  //    recommendations and the IMDb id together.
  const detailed = await pool([...seen.values()], async ([type, id, votes]) => {
    const d = await getJson(fetchFn, `${TMDB}/${type}/${id}?${k}&append_to_response=watch/providers,recommendations,external_ids`)
    return { rec: compactFromDetails(d, type, regions), votes }
  })

  const byKey = new Map()
  for (const { rec, votes } of detailed) if (rec.n) byKey.set(rec.k, { rec, votes })

  // 3) Keep only graph edges that point at titles the app knows.
  const known = new Set([...byKey.keys(), ...CATALOG.map((c) => titleKey(c))])
  for (const { rec } of byKey.values()) {
    if (rec.rc) { rec.rc = rec.rc.filter((x) => known.has(x)); if (!rec.rc.length) delete rec.rc }
  }

  // 4) IMDb + Rotten Tomatoes via OMDb: reuse yesterday's results, then fill
  //    gaps for the most-voted titles up to the daily free-tier budget.
  const prevByKey = new Map((prev?.items || []).map((x) => [x.k, x]))
  for (const { rec } of byKey.values()) {
    const p = prevByKey.get(rec.k)
    if (p?.i != null) rec.i = p.i
    if (p?.rt != null) rec.rt = p.rt
    if (p?.om) rec.om = 1
  }
  if (omdbKey) {
    const todo = [...byKey.values()]
      .filter(({ rec }) => !rec.om && rec.id)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, omdbLimit)
    await pool(todo, async ({ rec }) => {
      const d = await getJson(fetchFn, `https://www.omdbapi.com/?apikey=${omdbKey}&i=${rec.id}`)
      if (d.Response !== 'True') {
        if (!/limit/i.test(d.Error || '')) rec.om = 1 // daily cap hit: retry tomorrow
        return
      }
      rec.om = 1
      const i = Number(d.imdbRating)
      if (!Number.isNaN(i) && i > 0) rec.i = i
      const rt = (d.Ratings || []).find((r) => r.Source === 'Rotten Tomatoes')
      if (rt) { const n = Number(String(rt.Value).replace('%', '')); if (!Number.isNaN(n)) rec.rt = n }
    }, 6)
  }

  const items = [...byKey.values()].sort((a, b) => b.votes - a.votes).map((x) => x.rec)
  return { v: 1, generatedAt: new Date().toISOString(), regions, count: items.length, items }
}

// ---- CLI ----
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null }
  const out = arg('--out') || 'catalog.json'
  const prevPath = arg('--prev')
  let prev = null
  if (prevPath && existsSync(prevPath)) {
    try { prev = JSON.parse(readFileSync(prevPath, 'utf8')) } catch { prev = null }
  }
  const t0 = Date.now()
  buildCatalog({ tmdbKey: process.env.TMDB_API_KEY, omdbKey: process.env.OMDB_API_KEY, prev })
    .then((json) => {
      writeFileSync(out, JSON.stringify(json))
      const withProv = json.items.filter((x) => x.w).length
      const withRt = json.items.filter((x) => x.rt != null).length
      console.log(`Wrote ${out}: ${json.count} titles, ${withProv} with providers, ${withRt} with RT scores (${Math.round((Date.now() - t0) / 1000)}s)`)
    })
    .catch((e) => { console.error(e.message); process.exit(1) })
}
