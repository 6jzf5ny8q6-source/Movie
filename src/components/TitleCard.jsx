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
  ratingPrefs = { useImdb: true, useRt: true },
  onRate,
  onWatchlist,
  onRemove,
  onDismiss,
  onRestore,
}) {
  const { useImdb = true, useRt = true } = ratingPrefs
  const imdbSource = item.ratingSource === 'TMDB' ? 'TMDB score' : 'IMDb rating'
  const showImdb = useImdb && item.imdb != null && item.imdb > 0
  const showRt = useRt && item.rt != null

  return (
    <article className="card">
      <PixelPoster item={item} className="card__poster" />
      <div className="card__body">
        <header className="card__head">
          <h3 className="card__title">{item.title}</h3>
          <span className="card__year">{item.year || ''}</span>
        </header>

        <div className="card__meta">
          {showImdb && (
            <span className="badge badge--imdb" title={imdbSource}>
              IMDb {item.imdb.toFixed(1)}
            </span>
          )}
          {showRt && (
            <span className="badge badge--rt" title="Rotten Tomatoes">
              🍅 {item.rt}%
            </span>
          )}
          {(item.genres || []).slice(0, 3).map((g) => (
            <span key={g} className="badge badge--genre">{g}</span>
          ))}
        </div>

        {item.service && (
          <p className="card__where">
            <span className="card__wherelabel">Where to watch</span>
            <span className="card__service">▶ {item.service}</span>
          </p>
        )}

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
              <button
                className="btn btn--dismiss"
                onClick={() => onDismiss?.(item)}
                title="Hide this and stop recommending it"
              >
                ✕ Not interested
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
          {variant === 'watchlist' && (
            <>
              <button className="btn btn--primary" onClick={() => onRate?.(item)}>
                Rate / mark watched
              </button>
              <button className="btn btn--danger" onClick={() => onRemove?.(item)}>
                ✕ Remove
              </button>
            </>
          )}
          {variant === 'removed' && (
            <button className="btn btn--primary" onClick={() => onRestore?.(item)}>
              ↩ Add back to recommendations
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
