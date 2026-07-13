import { useEffect, useState } from 'react'
import { imdbUrl, rtUrl } from '../lib/links.js'

// Rate a title 1-10 and flag whether you'd watch it again. Works for both
// catalog titles and manually-added ones.
export default function RatingModal({ item, existing, onSave, onClose }) {
  const [rating, setRating] = useState(existing?.rating ?? 8)
  const [watchAgain, setWatchAgain] = useState(existing?.watchAgain ?? false)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = () => onSave({ rating: Number(rating), watchAgain })

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="modal__close" onClick={onClose} aria-label="Close">×</button>
        <h2 className="modal__title">Rate “{item.title}”</h2>
        <p className="modal__sub">{item.type === 'movie' ? 'Movie' : 'TV Show'} · {item.year || 'Watched'}</p>
        <p className="modal__links">
          <a href={imdbUrl(item)} target="_blank" rel="noreferrer">IMDb ↗</a>
          <a href={rtUrl(item)} target="_blank" rel="noreferrer">Rotten Tomatoes ↗</a>
        </p>

        <label className="modal__label">Your score: <strong>{rating}/10</strong></label>
        <input
          className="modal__range"
          type="range"
          min="1"
          max="10"
          step="1"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
        <div className="modal__scale">
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i + 1}
              className={`scale__dot ${Number(rating) === i + 1 ? 'is-on' : ''}`}
              onClick={() => setRating(i + 1)}
              aria-label={`Rate ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <label className="modal__check">
          <input
            type="checkbox"
            checked={watchAgain}
            onChange={(e) => setWatchAgain(e.target.checked)}
          />
          <span>I’d happily watch this again</span>
        </label>

        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={save}>Save rating</button>
        </div>
      </div>
    </div>
  )
}
