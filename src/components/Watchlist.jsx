import { useMemo, useState } from 'react'
import TitleCard from './TitleCard.jsx'
import SortedLibrary from './SortedLibrary.jsx'

// The user's watchlist — titles they've saved to watch. Searchable, grouped
// into Movies and TV Shows, and sortable by IMDb or Rotten Tomatoes. Rating a
// title marks it watched and removes it from here.
export default function Watchlist({ watchlist, ratingPrefs, region, onRate, onRemove, onBrowse }) {
  const { useImdb = true, useRt = true } = ratingPrefs || {}
  const [query, setQuery] = useState('')

  const list = useMemo(
    () => Object.values(watchlist).map((w) => ({ ...w, id: w.key })),
    [watchlist],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((i) => i.title.toLowerCase().includes(q))
  }, [list, query])

  const sortOptions = [
    { key: 'added', label: 'Recently added', compare: (a, b) => (b.addedAt || 0) - (a.addedAt || 0) },
    ...(useImdb ? [{ key: 'imdb', label: 'IMDb rating (high → low)', compare: (a, b) => (b.imdb || 0) - (a.imdb || 0) }] : []),
    ...(useRt ? [{ key: 'rt', label: 'Rotten Tomatoes (high → low)', compare: (a, b) => (b.rt || 0) - (a.rt || 0) }] : []),
  ]

  const movies = list.filter((i) => i.type === 'movie').length
  const shows = list.filter((i) => i.type === 'show').length

  return (
    <section className="watchlist">
      <div className="removed__intro">
        <h2>Your watchlist</h2>
        <p>
          Titles you’ve saved to watch. They’re kept out of your recommendations
          so you don’t see them twice. Rate one to mark it watched.
        </p>
        {list.length > 0 && (
          <div className="ratings__stats">
            <span><strong>{list.length}</strong> saved</span>
            <span><strong>{movies}</strong> movies</span>
            <span><strong>{shows}</strong> TV shows</span>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <p className="empty empty--big">
          Your watchlist is empty. Add titles with “＋ Watchlist” on any
          recommendation.{' '}
          <button className="linkbtn" onClick={onBrowse}>Browse recommendations ›</button>
        </p>
      ) : (
        <>
          <input
            className="libsearch"
            type="text"
            placeholder="Search your watchlist…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {filtered.length === 0 ? (
            <p className="empty">No watchlist titles match “{query}”.</p>
          ) : (
            <SortedLibrary
              items={filtered}
              sortOptions={sortOptions}
              defaultSort="added"
              renderCard={(item) => (
                <TitleCard
                  key={item.id}
                  item={item}
                  variant="watchlist"
                  ratingPrefs={ratingPrefs}
                  region={region}
                  onRate={onRate}
                  onRemove={onRemove}
                />
              )}
            />
          )}
        </>
      )}
    </section>
  )
}
