import { useMemo } from 'react'

// Taste Insights — turns the user's watch history into a small dashboard:
// headline stats, genre mix, favorite decade, score distribution, and how their
// scores compare to IMDb.
export default function Insights({ ratings, ratingPrefs, onBrowse }) {
  const { useImdb = true } = ratingPrefs || {}
  const list = useMemo(() => Object.values(ratings), [ratings])

  const s = useMemo(() => {
    if (!list.length) return null
    const movies = list.filter((r) => r.type === 'movie').length
    const shows = list.length - movies
    const avg = list.reduce((a, r) => a + (r.rating || 0), 0) / list.length
    const rewatch = list.filter((r) => r.watchAgain).length

    const gtally = {}
    for (const r of list) for (const g of r.genres || []) gtally[g] = (gtally[g] || 0) + 1
    const genres = Object.entries(gtally).sort((a, b) => b[1] - a[1]).slice(0, 8)

    const dtally = {}
    for (const r of list) if (r.year) { const d = Math.floor(r.year / 10) * 10; dtally[d] = (dtally[d] || 0) + 1 }
    const decades = Object.entries(dtally).map(([d, n]) => [Number(d), n]).sort((a, b) => a[0] - b[0])
    const favDecade = Object.entries(dtally).sort((a, b) => b[1] - a[1])[0]

    const dist = Array.from({ length: 10 }, (_, i) => list.filter((r) => r.rating === i + 1).length)

    const withImdb = list.filter((r) => r.imdb > 0)
    const delta = withImdb.length
      ? withImdb.reduce((a, r) => a + (r.rating - r.imdb), 0) / withImdb.length
      : null

    const top = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3)
    return { movies, shows, avg, rewatch, genres, decades, favDecade, dist, delta, top }
  }, [list])

  if (!s) {
    return (
      <section className="insights">
        <div className="removed__intro">
          <h2>Your insights</h2>
          <p>Rate a few titles and this page fills with your taste profile — favorite
            genres, the decades you love, how you score versus the critics, and more.</p>
        </div>
        <p className="empty empty--big">
          No ratings yet. <button className="linkbtn" onClick={onBrowse}>Rate something you’ve watched ›</button>
        </p>
      </section>
    )
  }

  const gMax = s.genres[0]?.[1] || 1
  const dMax = Math.max(...s.decades.map(([, n]) => n), 1)
  const distMax = Math.max(...s.dist, 1)

  return (
    <section className="insights">
      <div className="removed__intro">
        <h2>Your insights</h2>
        <p>Based on the {list.length} title{list.length === 1 ? '' : 's'} you’ve rated.</p>
      </div>

      <div className="tiles">
        <div className="tile"><div className="tile__num">{s.avg.toFixed(1)}</div><div className="tile__label">Average score</div></div>
        <div className="tile"><div className="tile__num">{s.movies}</div><div className="tile__label">Movies rated</div></div>
        <div className="tile"><div className="tile__num">{s.shows}</div><div className="tile__label">Shows rated</div></div>
        <div className="tile"><div className="tile__num">{s.rewatch}</div><div className="tile__label">Would rewatch</div></div>
        {s.favDecade && (
          <div className="tile"><div className="tile__num">{s.favDecade[0]}s</div><div className="tile__label">Favorite decade</div></div>
        )}
      </div>

      <div className="insights__panel">
        <h3>Your genre mix</h3>
        {s.genres.map(([g, n]) => (
          <div className="bar" key={g}>
            <span className="bar__label">{g}</span>
            <span className="bar__track"><span className="bar__fill" style={{ width: `${(n / gMax) * 100}%` }} /></span>
            <span className="bar__val">{n}</span>
          </div>
        ))}
      </div>

      <div className="insights__panel">
        <h3>How you score (1–10)</h3>
        <div className="hist">
          {s.dist.map((n, i) => (
            <div className="hist__col" key={i} title={`${n} rated ${i + 1}`}>
              <div className="hist__bar" style={{ height: `${(n / distMax) * 100}%` }} />
              <span className="hist__x">{i + 1}</span>
            </div>
          ))}
        </div>
        {useImdb && s.delta != null && (
          <p className="insights__note">
            {Math.abs(s.delta) < 0.15
              ? 'You rate right in line with IMDb audiences.'
              : `You rate about ${Math.abs(s.delta).toFixed(1)} point${Math.abs(s.delta) >= 1.5 ? 's' : ''} ${s.delta > 0 ? 'higher' : 'lower'} than IMDb on average.`}
          </p>
        )}
      </div>

      {s.decades.length > 1 && (
        <div className="insights__panel">
          <h3>Decades you watch</h3>
          {s.decades.map(([d, n]) => (
            <div className="bar" key={d}>
              <span className="bar__label">{d}s</span>
              <span className="bar__track"><span className="bar__fill bar__fill--teal" style={{ width: `${(n / dMax) * 100}%` }} /></span>
              <span className="bar__val">{n}</span>
            </div>
          ))}
        </div>
      )}

      <div className="insights__panel">
        <h3>Your top picks</h3>
        <ol className="toplist">
          {s.top.map((r) => (
            <li key={r.key}>
              <span className="toplist__title">{r.title}</span>
              <span className="toplist__score">{r.rating}/10</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
