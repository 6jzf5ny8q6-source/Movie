import { useMemo, useState } from 'react'
import { GENRES } from '../data/catalog.js'
import TitleCard from './TitleCard.jsx'

// "My Ratings": track what you've watched, score it, and mark watch-again.
// These ratings feed straight back into the recommendation engine.
export default function Ratings({ catalog, ratings, onRate, onRemove }) {
  const [query, setQuery] = useState('')
  const [manual, setManual] = useState(false)

  const ratedList = useMemo(
    () =>
      Object.values(ratings)
        .sort((a, b) => (b.ratedAt || 0) - (a.ratedAt || 0))
        .map((r) => ({ ...r, id: r.key, userRating: r.rating })),
    [ratings],
  )

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return catalog
      .filter((c) => c.title.toLowerCase().includes(q))
      .filter((c) => !ratings[`${c.type}:${c.title.toLowerCase().trim()}:${c.year || ''}`])
      .slice(0, 8)
  }, [query, catalog, ratings])

  const loved = ratedList.filter((r) => r.rating >= 8).length
  const rewatch = ratedList.filter((r) => r.watchAgain).length

  return (
    <section className="ratings">
      <div className="ratings__intro">
        <h2>Your watch history</h2>
        <p>Rate what you’ve seen — the AI recommender learns from every score and
          “watch again” you add.</p>
        <div className="ratings__stats">
          <span><strong>{ratedList.length}</strong> rated</span>
          <span><strong>{loved}</strong> loved (8+)</span>
          <span><strong>{rewatch}</strong> would rewatch</span>
        </div>
      </div>

      <div className="addbox">
        <div className="addbox__search">
          <input
            type="text"
            placeholder="Search a movie or show you’ve watched…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn btn--ghost" onClick={() => setManual((m) => !m)}>
            {manual ? 'Close manual add' : 'Can’t find it? Add manually'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <ul className="addbox__results">
            {searchResults.map((c) => (
              <li key={c.id}>
                <button onClick={() => { onRate(c); setQuery('') }}>
                  <span className="res__title">{c.title}</span>
                  <span className="res__meta">{c.type === 'movie' ? 'Film' : 'TV'} · {c.year} · ★ {c.imdb.toFixed(1)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {manual && <ManualAdd onAdd={(item) => { onRate(item); setManual(false) }} />}
      </div>

      {ratedList.length === 0 ? (
        <p className="empty empty--big">
          You haven’t rated anything yet. Search above to add your first watched title.
        </p>
      ) : (
        <div className="grid">
          {ratedList.map((item) => (
            <TitleCard
              key={item.id}
              item={item}
              variant="rated"
              onRate={onRate}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function ManualAdd({ onAdd }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('movie')
  const [year, setYear] = useState('')
  const [genres, setGenres] = useState([])

  const toggle = (g) =>
    setGenres((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g].slice(0, 4)))

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      id: `manual-${title.toLowerCase()}`,
      source: 'manual',
      type,
      title: title.trim(),
      year: year ? Number(year) : undefined,
      imdb: 0,
      genres: genres.length ? genres : ['Drama'],
      moods: [],
      service: 'Other',
      poster: '#4a4a5a',
    })
  }

  return (
    <form className="manual" onSubmit={submit}>
      <div className="manual__row">
        <input
          className="manual__title"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="movie">Movie</option>
          <option value="show">TV Show</option>
        </select>
        <input
          className="manual__year"
          placeholder="Year"
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
        />
      </div>
      <div className="manual__genres">
        {GENRES.map((g) => (
          <button
            type="button"
            key={g}
            className={`chip ${genres.includes(g) ? 'is-on' : ''}`}
            onClick={() => toggle(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <button className="btn btn--primary" type="submit">Add & rate</button>
    </form>
  )
}
