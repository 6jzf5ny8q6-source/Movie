import { useMemo, useState } from 'react'
import TitleCard from './TitleCard.jsx'
import SortedLibrary from './SortedLibrary.jsx'

// Titles the user dismissed from recommendations. They're kept here so they can
// be added back into rotation whenever the user changes their mind. Searchable
// and grouped into Movies / TV Shows, sortable by IMDb or Rotten Tomatoes.
export default function Removed({ removed, ratingPrefs, region, onRestore }) {
  const { useImdb = true, useRt = true } = ratingPrefs || {}
  const [query, setQuery] = useState('')

  const list = useMemo(
    () => Object.values(removed).map((r) => ({ ...r, id: r.key })),
    [removed],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((i) => i.title.toLowerCase().includes(q))
  }, [list, query])

  const sortOptions = [
    { key: 'removed', label: 'Recently hidden', compare: (a, b) => (b.removedAt || 0) - (a.removedAt || 0) },
    ...(useImdb ? [{ key: 'imdb', label: 'IMDb rating (high → low)', compare: (a, b) => (b.imdb || 0) - (a.imdb || 0) }] : []),
    ...(useRt ? [{ key: 'rt', label: 'Rotten Tomatoes (high → low)', compare: (a, b) => (b.rt || 0) - (a.rt || 0) }] : []),
  ]

  return (
    <section className="removed">
      <div className="removed__intro">
        <h2>Not interested</h2>
        <p>
          Titles you’ve hidden from recommendations live here. They won’t appear
          in Discover — until you add them back.
        </p>
      </div>

      {list.length === 0 ? (
        <p className="empty empty--big">
          You haven’t hidden any recommendations yet. Use “✕ Not interested” on a
          card in Discover and it’ll show up here.
        </p>
      ) : (
        <>
          <input
            className="libsearch"
            type="text"
            placeholder="Search hidden titles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {filtered.length === 0 ? (
            <p className="empty">No hidden titles match “{query}”.</p>
          ) : (
            <SortedLibrary
              items={filtered}
              sortOptions={sortOptions}
              defaultSort="removed"
              renderCard={(item) => (
                <TitleCard
                  key={item.id}
                  item={item}
                  variant="removed"
                  ratingPrefs={ratingPrefs}
                  region={region}
                  onRestore={onRestore}
                />
              )}
            />
          )}
        </>
      )}
    </section>
  )
}
