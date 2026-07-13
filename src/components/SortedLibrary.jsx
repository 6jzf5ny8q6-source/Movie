import { useState } from 'react'

// Renders a collection grouped into Movies and TV Shows, with a sort control.
// `sortOptions` is an array of { key, label, compare }. `renderCard(item)`
// draws each entry.
export default function SortedLibrary({
  items,
  sortOptions,
  defaultSort,
  renderCard,
  groupLabels = { movie: 'Movies', show: 'TV Shows' },
}) {
  const [sort, setSort] = useState(defaultSort || sortOptions[0]?.key)
  const active = sortOptions.find((o) => o.key === sort) || sortOptions[0]
  const sorted = [...items].sort(active.compare)

  const groups = [
    { type: 'movie', label: groupLabels.movie, items: sorted.filter((i) => i.type === 'movie') },
    { type: 'show', label: groupLabels.show, items: sorted.filter((i) => i.type === 'show') },
  ]

  return (
    <>
      <div className="sortbar">
        <label htmlFor="sortby">Organize by</label>
        <select id="sortby" value={sort} onChange={(e) => setSort(e.target.value)}>
          {sortOptions.map((o) => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>

      {groups.map((g) =>
        g.items.length ? (
          <div className="section" key={g.type}>
            <div className="section__head">
              <h2>{g.label}</h2>
              <span className="section__count">{g.items.length}</span>
            </div>
            <div className="grid">{g.items.map(renderCard)}</div>
          </div>
        ) : null,
      )}
    </>
  )
}
