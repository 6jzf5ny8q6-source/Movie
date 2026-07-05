// A tasteful poster placeholder that matches the app's retro spirit. Uses real
// artwork when available (from TMDB/OMDb), otherwise renders a pixel-styled
// card from the title's base color.

function initials(title) {
  return title
    .replace(/^(the|a|an) /i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function PixelPoster({ item, className = '' }) {
  if (item.image) {
    return (
      <div className={`poster ${className}`}>
        <img src={item.image} alt={`${item.title} poster`} loading="lazy" />
        <span className={`poster__type poster__type--${item.type}`}>
          {item.type === 'movie' ? 'FILM' : 'TV'}
        </span>
      </div>
    )
  }

  const base = item.poster || '#3a4a63'
  return (
    <div
      className={`poster poster--generated ${className}`}
      style={{ '--poster': base }}
    >
      <div className="poster__grid" aria-hidden="true" />
      <div className="poster__play" aria-hidden="true" />
      <span className="poster__initials">{initials(item.title)}</span>
      <span className="poster__name">{item.title}</span>
      <span className={`poster__type poster__type--${item.type}`}>
        {item.type === 'movie' ? 'FILM' : 'TV'}
      </span>
    </div>
  )
}
