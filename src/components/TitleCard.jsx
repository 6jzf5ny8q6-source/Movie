import PixelPoster from './PixelPoster.jsx'

// A single movie/show card used across Discover and Ratings.
// `variant`:
//   'discover' -> shows match reason + actions to rate / add to watchlist
//   'rated'    -> shows the user's rating + watch-again + edit/remove
export default function TitleCard({
  item,
  variant = 'discover',
  reason,
  inWatchlist,
  onRate,
  onWatchlist,
  onRemove,
}) {
  const rating = item.imdb ? item.imdb.toFixed(1) : '—'
  const source = item.ratingSource || 'IMDb'

  return (
    <article className="card">
      <PixelPoster item={item} className="card__poster" />
      <div className="card__body">
        <header className="card__head">
          <h3 className="card__title">{item.title}</h3>
          <span className="card__year">{item.year || ''}</span>
        </header>

        <div className="card__meta">
          <span className="badge badge--rating" title={`${source} rating`}>
            ★ {rating}
          </span>
          <span className="badge badge--service">{item.service}</span>
          {(item.genres || []).slice(0, 3).map((g) => (
            <span key={g} className="badge badge--genre">{g}</span>
          ))}
        </div>

        {item.overview && <p className="card__overview">{item.overview}</p>}

        {variant === 'discover' && reason && (
          <p className="card__reason">✨ {reason}</p>
        )}

        {variant === 'rated' && (
          <div className="card__ratedrow">
            <span className="myrating">Your score: <strong>{item.userRating}/10</strong></span>
            {item.watchAgain && <span className="badge badge--again">↻ Watch again</span>}
          </div>
        )}

        <div className="card__actions">
          {variant === 'discover' && (
            <>
              <button className="btn btn--primary" onClick={() => onRate?.(item)}>
                Rate / mark watched
              </button>
              <button
                className={`btn btn--ghost ${inWatchlist ? 'is-active' : ''}`}
                onClick={() => onWatchlist?.(item)}
              >
                {inWatchlist ? '✓ In watchlist' : '＋ Watchlist'}
              </button>
            </>
          )}
          {variant === 'rated' && (
            <>
              <button className="btn btn--ghost" onClick={() => onRate?.(item)}>
                Edit rating
              </button>
              <button className="btn btn--danger" onClick={() => onRemove?.(item)}>
                Remove
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
