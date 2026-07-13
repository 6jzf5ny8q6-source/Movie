import { useMemo, useState } from 'react'
import { recommend, explain } from '../lib/recommender.js'
import { MOODS } from '../data/catalog.js'
import TitleCard from './TitleCard.jsx'

const RUNTIME_OPTS = [
  { key: 'any', label: 'Any length' },
  { key: 'short', label: 'Short (< 90 min)' },
  { key: 'medium', label: 'Standard (90–130 min)' },
  { key: 'long', label: 'Long (> 130 min)' },
]

// The recommendations view. A "Tonight's pick" spotlight, tonight-mood + runtime
// quick filters, then up to `prefLimit` movies and shows with "show more".
export default function Discover({
  catalog,
  taste,
  ratings,
  removed,
  settings,
  watchlist,
  hasProfile,
  services,
  region,
  live,
  onRate,
  onWatchlist,
  onDismiss,
  onSetMinImdb,
  onSetMinRt,
  onSetServices,
  onRefreshLive,
  onTakeQuiz,
}) {
  const base = settings.prefLimit || 5
  const [movieLimit, setMovieLimit] = useState(base)
  const [showLimit, setShowLimit] = useState(base)
  const [moods, setMoods] = useState([])       // tonight's mood filter
  const [runtime, setRuntime] = useState('any') // movie length filter
  const [rerollN, setRerollN] = useState(0)     // bumps to pick a new spotlight

  const common = {
    ratings,
    removed,
    watchlist,
    useImdb: settings.useImdb,
    minImdb: settings.minImdb,
    useRt: settings.useRt,
    minRt: settings.minRt,
    services: settings.services,
    moods,
    runtime,
  }
  const ratingPrefs = { useImdb: settings.useImdb, useRt: settings.useRt }
  const deps = [catalog, taste, ratings, removed, watchlist, settings.useImdb, settings.minImdb, settings.useRt, settings.minRt, settings.services, moods, runtime]

  const all = useMemo(() => recommend(catalog, taste, { ...common, type: 'all' }), deps) // eslint-disable-line react-hooks/exhaustive-deps

  // Spotlight: a random strong match from the top of the list (rerollable).
  const surprise = useMemo(() => {
    if (!all.length) return null
    const top = all.slice(0, Math.min(20, all.length))
    return top[Math.floor(Math.random() * top.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, rerollN])

  const movies = all.filter((i) => i.type === 'movie' && i.id !== surprise?.id)
  const shows = all.filter((i) => i.type === 'show' && i.id !== surprise?.id)

  const inWatch = (item) => Boolean(watchlist[`${item.type}:${item.title.toLowerCase().trim()}:${item.year || ''}`])
  const toggleMood = (m) => setMoods((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m]))

  const card = (item) => (
    <TitleCard
      key={item.id}
      item={item}
      variant="discover"
      reason={explain(item, taste)}
      inWatchlist={inWatch(item)}
      ratingPrefs={ratingPrefs}
      region={region}
      onRate={onRate}
      onWatchlist={onWatchlist}
      onDismiss={onDismiss}
    />
  )

  const Section = ({ label, items, limit, setLimit }) => (
    <div className="section">
      <div className="section__head">
        <h2>{label}</h2>
        <span className="section__count">{Math.min(limit, items.length)} of {items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="empty">No titles match your filters. Try lowering a minimum rating or clearing moods.</p>
      ) : (
        <div className="grid">{items.slice(0, limit).map(card)}</div>
      )}
      {limit < items.length && (
        <div className="section__more">
          <button className="btn btn--ghost" onClick={() => setLimit(limit + 5)}>
            Show 5 more {label.toLowerCase()} ›
          </button>
        </div>
      )}
    </div>
  )

  return (
    <section className="discover">
      {!hasProfile && (
        <div className="notice">
          <div>
            <strong>Want sharper picks?</strong> Take the 12-question taste quiz — it
            tunes every recommendation to you.
          </div>
          <button className="btn btn--primary" onClick={onTakeQuiz}>Take the quiz</button>
        </div>
      )}

      <div className="filters">
        {settings.useImdb && (
          <div className="filters__group filters__group--rating">
            <label>
              Minimum IMDb rating
              <strong className="filters__val">{settings.minImdb.toFixed(1)}</strong>
            </label>
            <input type="range" min="0" max="9.5" step="0.1" value={settings.minImdb}
              onChange={(e) => onSetMinImdb(Number(e.target.value))} />
          </div>
        )}

        {settings.useRt && (
          <div className="filters__group filters__group--rating">
            <label>
              Minimum Rotten Tomatoes
              <strong className="filters__val filters__val--rt">{settings.minRt}%</strong>
            </label>
            <input type="range" min="0" max="100" step="1" value={settings.minRt}
              onChange={(e) => onSetMinRt(Number(e.target.value))} />
          </div>
        )}

        {!settings.useImdb && !settings.useRt && (
          <div className="filters__group">
            <span className="filters__off">Rating filters are off — enable IMDb or Rotten Tomatoes in Settings.</span>
          </div>
        )}

        <div className="filters__group">
          <label htmlFor="svc">Streaming service</label>
          <select id="svc" value={settings.services[0] || ''}
            onChange={(e) => onSetServices(e.target.value ? [e.target.value] : [])}>
            <option value="">All services</option>
            {services.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>

        <div className="filters__group">
          <label htmlFor="rt">Movie length</label>
          <select id="rt" value={runtime} onChange={(e) => setRuntime(e.target.value)}>
            {RUNTIME_OPTS.map((o) => (<option key={o.key} value={o.key}>{o.label}</option>))}
          </select>
        </div>

        <div className="filters__group filters__group--live">
          <button className="btn btn--outline" onClick={onRefreshLive} disabled={live.loading}>
            {live.loading ? 'Fetching…' : '⟳ Get fresh titles'}
          </button>
          {live.message && <span className={`live__msg ${live.error ? 'is-error' : ''}`}>{live.message}</span>}
        </div>
      </div>

      <div className="moodbar">
        <span className="moodbar__label">In the mood for</span>
        <div className="moodbar__chips">
          {MOODS.map((m) => (
            <button key={m} className={`chip ${moods.includes(m) ? 'is-on' : ''}`} onClick={() => toggleMood(m)}>
              {m}
            </button>
          ))}
          {moods.length > 0 && (
            <button className="chip chip--clear" onClick={() => setMoods([])}>clear ✕</button>
          )}
        </div>
      </div>

      {surprise && (
        <div className="spotlight">
          <div className="spotlight__head">
            <h2>🍿 Tonight’s pick</h2>
            <button className="btn btn--ghost" onClick={() => setRerollN((n) => n + 1)}>🎲 Surprise me again</button>
          </div>
          <div className="spotlight__card">{card(surprise)}</div>
        </div>
      )}

      <Section label="Movies for you" items={movies} limit={movieLimit} setLimit={setMovieLimit} />
      <Section label="TV shows for you" items={shows} limit={showLimit} setLimit={setShowLimit} />
    </section>
  )
}
