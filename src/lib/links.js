// Build links to a title's IMDb and Rotten Tomatoes pages. When we have a
// verified IMDb id (from OMDb enrichment) we deep-link straight to the title;
// otherwise we fall back to a title+year search that reliably lands on it.

export function imdbUrl(item) {
  if (item.imdbId) return `https://www.imdb.com/title/${item.imdbId}/`
  const q = encodeURIComponent(`${item.title}${item.year ? ` ${item.year}` : ''}`)
  return `https://www.imdb.com/find/?s=tt&q=${q}`
}

export function rtUrl(item) {
  // Rotten Tomatoes has no stable id in our data, so search by title.
  return `https://www.rottentomatoes.com/search?search=${encodeURIComponent(item.title)}`
}
