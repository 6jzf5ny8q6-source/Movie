import { useMemo, useState } from 'react'
import { recommend, explain } from '../lib/recommender.js'
import TitleCard from './TitleCard.jsx'

// The recommendations view. Shows up to `prefLimit` movies and `prefLimit`
// shows by default, each with a "show more" that requests additional picks.
export default function Discover({
  catalog,
  taste,
  ratings,
  settings,
  watchlist,
  hasProfile,
  services,
  live,
  onRate,
  onWatchlist,
  onSetMinImdb,
  onSetServices,
  onRefreshLive,
  onTakeQuiz,
}) {
  const base = settings.prefLimit || 5
  const [movieLimit, setMovieLimit] = useState(base)
  const [showLimit, setShowLimit] = useState(base)

  const common = {
    ratings,
    minImdb: settings.minImdb,
    services: settings.services,
  }

  const movies = useMemo(
    () => recommend(catalog, taste, { ...common, type: 'movie' }),
    [catalog, taste, ratings, settings.minImdb, settings.services],
  )
  const shows = useMemo(
    () => recommend(catalog, taste, { ...common, type: 'show' }),
    [catalog, taste, ratings, settings.minImdb, settings.services],
  )

  const inWatch = (item) => Boolean(watchlist[`${item.type}:${item.title.toLowerCase().trim()}:${item.year || ''}`])

  const Section = ({ label, items, limit, setLimit }) => (
    <div className="section">
      <div className="section__head">
        <h2>{label}</h2>
        <span className="section__count">{Math.min(limit, items.length)} of {items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="empty">No titles match your filters. Try lowering the minimum rating.</p>
      ) : (
        <div className="grid">
          {items.slice(0, limit).map((item) => (
            <TitleCard
              key={item.id}
              item={item}
              variant="discover"
              reason={explain(item, taste)}
              inWatchlist={inWatch(item)}
              onRate={onRate}
              onWatchlist={onWatchlist}
            />
          ))}
        </div>
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
        <div className="filters__group filters__group--rating">
          <label>
            Minimum IMDb rating
            <strong className="filters__val">{settings.minImdb.toFixed(1)}</strong>
          </label>
          <input
            type="range"
            min="0"
            max="9.5"
            step="0.1"
            value={settings.minImdb}
            onChange={(e) => onSetMinImdb(Number(e.target.value))}
          />
        </div>

        <div className="filters__group">
          <label htmlFor="svc">Streaming service</label>
          <select
            id="svc"
            value={settings.services[0] || ''}
            onChange={(e) => onSetServices(e.target.value ? [e.target.value] : [])}
          >
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="filters__group filters__group--live">
          <button
            className="btn btn--outline"
            onClick={onRefreshLive}
            disabled={live.loading}
          >
            {live.loading ? 'Fetching…' : '⟳ Get fresh titles'}
          </button>
          {live.message && <span className={`live__msg ${live.error ? 'is-error' : ''}`}>{live.message}</span>}
        </div>
      </div>

      <Section label="Movies for you" items={movies} limit={movieLimit} setLimit={setMovieLimit} />
      <Section label="TV shows for you" items={shows} limit={showLimit} setLimit={setShowLimit} />
    </section>
  )
}
