import { useMemo } from 'react'
import TitleCard from './TitleCard.jsx'

// Titles the user dismissed from recommendations. They're kept here so they can
// be added back into rotation whenever the user changes their mind.
export default function Removed({ removed, ratingPrefs, onRestore }) {
  const list = useMemo(
    () =>
      Object.values(removed)
        .sort((a, b) => (b.removedAt || 0) - (a.removedAt || 0))
        .map((r) => ({ ...r, id: r.key })),
    [removed],
  )

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
        <div className="grid">
          {list.map((item) => (
            <TitleCard
              key={item.id}
              item={item}
              variant="removed"
              ratingPrefs={ratingPrefs}
              onRestore={onRestore}
            />
          ))}
        </div>
      )}
    </section>
  )
}
